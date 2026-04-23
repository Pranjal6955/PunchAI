"""
REST API routes for Chat and Message operations with full RAG (Retrieval-Augmented Generation).
Integrates local ChromaDB and local Ollama (Llama 3).
"""

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from app.core.database import db
from app.schemas.chat import (
    ChatCreate,
    MessageCreate,
    ChatWithMessagesResponse,
    ChatListResponse,
    MessageResponse,
)
from prisma import Json
from app.api.deps import get_current_user
from app.services.processor import hybrid_retrieve
from app.services.llm import build_rag_prompt, generate_llm_response
from app.core.config import settings

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.post("/", response_model=ChatWithMessagesResponse, status_code=201)
async def create_chat(payload: ChatCreate, current_user=Depends(get_current_user)):
    """Start a new chat conversation."""
    if payload.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    bot = await db.bot.find_unique(where={"id": payload.botId})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    chat = await db.chat.create(
        data={
            "title": payload.title or f"Chat with {bot.name}",
            "user": {"connect": {"id": payload.userId}},
            "bot": {"connect": {"id": payload.botId}},
            "isExternal": False,
        },
        include={"messages": True}
    )
    return chat


# ── FULL RAG FLOW: CHAT -> RETRIEVE -> PROMPT -> LLM ──

@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=201)
async def add_message(
    chat_id: str, 
    payload: MessageCreate, 
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """
    1. Save User Message
    2. Retrieve Context (ChromaDB)
    3. Build Prompt & Call LLM (Ollama)
    4. Save Assistant Response
    """
    chat = await db.chat.find_unique(where={"id": chat_id}, include={"bot": True})
    if not chat or chat.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Bug 4 fix: validate message content server-side
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message content cannot be empty")
    if len(content) > 2000:
        raise HTTPException(status_code=422, detail="Message too long (max 2000 characters)")

    # 1. Save User Message
    user_msg = await db.message.create(
        data={
            "role": "USER",
            "content": content,
            "chat": {"connect": {"id": chat_id}},
        }
    )

    # 2. Hybrid RAG Retrieval (Vector + Keyword)
    # Improvement: Refine search query to strip conversational noise (Bug fix for RAG effectiveness)
    from app.services.llm import get_search_query
    
    # Fetch top history items for query refinement
    refinement_history = await db.message.find_many(
        where={"chatId": chat_id, "NOT": {"id": user_msg.id}},
        order={"createdAt": "desc"},
        take=3
    )
    search_query = await get_search_query(content, refinement_history)
    
    retrieval = await hybrid_retrieve(bot_id=chat.botId, query=search_query, top_k=5)
    context_chunks = retrieval["chunks"]

    # Optional: Log the retrieved context/refined query into metadata
    await db.message.update(
        where={"id": user_msg.id}, 
        data={"metadata": Json({"chunks": context_chunks, "refined_query": search_query})}
    )

    # 3. LLM Generation (OpenRouter with Groq Fallback)

    # Bug 5 fix: fetch last 10 messages for better conversational context (was 5)
    history = await db.message.find_many(
        where={
            "chatId": chat_id,
            "NOT": {
                "id": user_msg.id
            }
        },
        order={"createdAt": "desc"},
        take=10
    )
    history.reverse()  # Chronological order

    # Structured prompt returns a dict {system, user}
    structured_prompt = build_rag_prompt(
        persona=chat.bot.botPersona,
        context=context_chunks,
        question=content,
        history=history
    )
    
    ai_text, usage = await generate_llm_response(structured_prompt, model=payload.model)

    # 4. Save Assistant Message
    assistant_msg = await db.message.create(
        data={
            "role": "ASSISTANT",
            "content": ai_text,
            "chat": {"connect": {"id": chat_id}},
            "metadata": Json({
                "source_chunks": len(context_chunks),
                "chunks": context_chunks,
                "model": payload.model or settings.OPENROUTER_MODEL
            })
        }
    )

    # Return the assistant's message as the reply
    return assistant_msg


@router.get("/{chat_id}", response_model=ChatWithMessagesResponse)
async def get_chat(chat_id: str, current_user=Depends(get_current_user)):
    chat = await db.chat.find_unique(
        where={"id": chat_id},
        include={
            "messages": True,
            "bot": True
        }
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Sort messages in Python
    if chat.messages:
        chat.messages.sort(key=lambda x: x.createdAt)
        
    # Allow if requester is the chat creator OR the bot owner
    if chat.userId != current_user.id and chat.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return chat


@router.get("/", response_model=ChatListResponse)
async def list_chats(userId: str = Query(...), current_user=Depends(get_current_user)):
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    chats = await db.chat.find_many(where={"userId": userId}, order={"updatedAt": "desc"})
    return {"data": chats, "total": len(chats)}


@router.get("/owner/all", response_model=ChatListResponse)
async def list_all_owner_chats(
    isExternal: bool | None = Query(default=None, description="Filter by chat type: true=external, false=internal, omit=all"),
    current_user=Depends(get_current_user)
):
    """List all conversations for all bots owned by the current user."""
    # 1. Get all bot IDs owned by the user
    bots = await db.bot.find_many(where={"ownerId": current_user.id})
    bot_ids = [b.id for b in bots]
    
    # 2. Build filter — optionally scope to internal or external chats
    where_clause: dict = {"botId": {"in": bot_ids}}
    if isExternal is not None:
        where_clause["isExternal"] = isExternal

    # 3. Get all chats for these bots
    chats = await db.chat.find_many(
        where=where_clause,
        order={"updatedAt": "desc"}
    )
    return {"data": chats, "total": len(chats)}


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: str, current_user=Depends(get_current_user)):
    """Delete a chat. (Creator or Bot Owner only)"""
    chat = await db.chat.find_unique(where={"id": chat_id}, include={"bot": True})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Permission: User is the creator OR User is the owner of the bot
    is_creator = chat.userId == current_user.id
    is_bot_owner = chat.bot.ownerId == current_user.id
    
    if not is_creator and not is_bot_owner:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this chat")

    await db.chat.delete(where={"id": chat_id})
    return None

@router.patch("/{chat_id}/messages/{message_id}/feedback", response_model=MessageResponse)
async def submit_message_feedback(
    chat_id: str,
    message_id: str,
    feedback: int = Query(..., ge=-1, le=1),
    current_user=Depends(get_current_user)
):
    """Submit thumbs up (1) or thumbs down (-1) feedback for a message."""
    # Find message and verify it belongs to the chat and the chat is accessible
    message = await db.message.find_unique(
        where={"id": message_id},
        include={"chat": {"include": {"bot": True}}}
    )
    
    if not message or message.chatId != chat_id:
        raise HTTPException(status_code=404, detail="Message not found")

    # In production, check if the current user has access to this chat
    # For now, let's allow it

    updated = await db.message.update(
        where={"id": message_id},
        data={"feedback": feedback}
    )
    return updated
