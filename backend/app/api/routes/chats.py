"""
REST API routes for Chat and Message operations with full RAG (Retrieval-Augmented Generation).
Integrates local ChromaDB and local Ollama (Llama 3).
"""

from fastapi import APIRouter, HTTPException, Query, Depends
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
        },
        include={"messages": True}
    )
    return chat


# ── FULL RAG FLOW: CHAT -> RETRIEVE -> PROMPT -> LLM ──

@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=201)
async def add_message(
    chat_id: str, 
    payload: MessageCreate, 
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

    # 1. Save User Message
    user_msg = await db.message.create(
        data={
            "role": "USER",
            "content": payload.content,
            "chat": {"connect": {"id": chat_id}},
        }
    )

    # 2. Hybrid RAG Retrieval (Vector + Keyword)
    context_chunks = await hybrid_retrieve(bot_id=chat.botId, query=payload.content, top_k=5)
    
    # Optional: Log the retrieved context into the user's message metadata
    await db.message.update(where={"id": user_msg.id}, data={"metadata": Json({"chunks": context_chunks})})

    # 3. LLM Generation (OpenRouter with Groq Fallback)
    
    # Fetch recent chat history (last 5 messages before the current one)
    history = await db.message.find_many(
        where={
            "chatId": chat_id,
            "NOT": {
                "id": user_msg.id
            }
        },
        order_by={"createdAt": "desc"},
        take=5
    )
    history.reverse()  # Chronological order

    prompt = build_rag_prompt(
        persona=chat.bot.botPersona, 
        context=context_chunks, 
        question=payload.content,
        history=history
    )
    
    ai_text = generate_llm_response(prompt)

    # 4. Save Assistant Message
    assistant_msg = await db.message.create(
        data={
            "role": "ASSISTANT",
            "content": ai_text,
            "chat": {"connect": {"id": chat_id}},
            "metadata": Json({"source_chunks": len(context_chunks)})
        }
    )

    # Return the assistant's message as the reply
    return assistant_msg


@router.get("/{chat_id}", response_model=ChatWithMessagesResponse)
async def get_chat(chat_id: str, current_user=Depends(get_current_user)):
    chat = await db.chat.find_unique(
        where={"id": chat_id},
        include={"messages": {"order_by": {"createdAt": "asc"}}}
    )
    if not chat or chat.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return chat


@router.get("/", response_model=ChatListResponse)
async def list_chats(userId: str = Query(...), current_user=Depends(get_current_user)):
    if userId != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    chats = await db.chat.find_many(where={"userId": userId}, order={"updatedAt": "desc"})
    return {"data": chats, "total": len(chats)}


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: str, current_user=Depends(get_current_user)):
    chat = await db.chat.find_unique(where={"id": chat_id})
    if not chat or chat.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.chat.delete(where={"id": chat_id})
    return None
