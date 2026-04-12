"""
REST API routes for External Widget operations.
Allows anonymous users to interact with chatbots via API Key.
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.database import db
from app.schemas.chat import (
    MessageCreate,
    MessageResponse,
    ChatWithMessagesResponse,
)
from prisma import Json
from app.api.deps import get_bot_by_api_key
from app.services.processor import hybrid_retrieve
from app.services.llm import build_rag_prompt, generate_llm_response
from typing import Optional

router = APIRouter(prefix="/external", tags=["External"])

@router.post("/chat/init", response_model=ChatWithMessagesResponse)
async def init_external_chat(
    bot=Depends(get_bot_by_api_key)
):
    """Initialize a new chat session for an external widget."""
    chat = await db.chat.create(
        data={
            "title": f"External Chat with {bot.name}",
            "bot": {"connect": {"id": bot.id}},
        },
        include={"messages": True}
    )
    return chat

@router.post("/chat/{chat_id}/message", response_model=MessageResponse)
async def add_external_message(
    chat_id: str,
    payload: MessageCreate,
    bot=Depends(get_bot_by_api_key)
):
    """
    Handle a message from the external widget.
    1. Validate chat belongs to the bot.
    2. RAG Flow.
    """
    chat = await db.chat.find_unique(where={"id": chat_id})
    if not chat or chat.botId != bot.id:
        raise HTTPException(status_code=404, detail="Chat session not found for this bot")

    # 1. Save User Message
    user_msg = await db.message.create(
        data={
            "role": "USER",
            "content": payload.content,
            "chat": {"connect": {"id": chat_id}},
        }
    )

    # 2. Hybrid RAG Retrieval (Vector + Keyword)
    context_chunks = await hybrid_retrieve(bot_id=bot.id, query=payload.content, top_k=5)
    
    # Update user message metadata with chunks
    await db.message.update(where={"id": user_msg.id}, data={"metadata": Json({"chunks": context_chunks})})

    # 3. LLM Generation
    # Fetch recent chat history
    history = await db.message.find_many(
        where={
            "chatId": chat_id,
            "NOT": {"id": user_msg.id}
        },
        order={"createdAt": "desc"},
        take=5
    )
    history.reverse()

    prompt = build_rag_prompt(
        persona=bot.botPersona, 
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

    return assistant_msg

@router.get("/bot-info")
async def get_public_bot_info(bot=Depends(get_bot_by_api_key)):
    """Get public information about the bot."""
    return {
        "id": bot.id,
        "name": bot.name,
        "description": bot.description,
        "botPersona": bot.botPersona,
        "customCss": bot.customCss,
    }
