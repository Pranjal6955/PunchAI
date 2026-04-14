from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body, Request
from fastapi.responses import StreamingResponse
from prisma import Json

from app.core.database import db
from app.api.deps import get_bot_by_api_key
from app.core.limiter import limiter
from app.services.processor import hybrid_retrieve
from app.services.llm import build_rag_prompt, generate_llm_response, generate_llm_stream
from app.schemas.chat import (
    MessageCreate,
    MessageResponse,
    ChatWithMessagesResponse,
)

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
@limiter.limit("10/minute")
async def add_external_message(
    chat_id: str,
    payload: MessageCreate,
    request: Request,
    bot=Depends(get_bot_by_api_key)
):
    """
    Standard (Atomic) Message handling.
    Updated to be async-safe and Rate Limited.
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
    await db.message.update(where={"id": user_msg.id}, data={"metadata": Json({"chunks": context_chunks})})

    # 3. LLM Generation
    history = await db.message.find_many(
        where={"chatId": chat_id, "NOT": {"id": user_msg.id}},
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
    
    ai_text = await generate_llm_response(prompt)

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

@router.post("/chat/{chat_id}/message/stream")
@limiter.limit("5/minute")
async def add_external_message_stream(
    chat_id: str,
    payload: MessageCreate,
    request: Request, # Required by slowapi
    bot=Depends(get_bot_by_api_key)
):
    """
    Real-time Message Streaming (f) & Rate Limiting (g).
    Steps:
    1. Save user message.
    2. Hybrid Retrieval.
    3. Stream AI response.
    4. Save full response at the end.
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
    await db.message.update(where={"id": user_msg.id}, data={"metadata": Json({"chunks": context_chunks})})

    # Fetch history
    history = await db.message.find_many(
        where={"chatId": chat_id, "NOT": {"id": user_msg.id}},
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

    # 3. Stream Response
    async def chat_generator():
        full_text = ""
        async for chunk in generate_llm_stream(prompt):
            full_text += chunk
            yield chunk

        # 4. Save Assistant Message once streaming is done
        await db.message.create(
            data={
                "role": "ASSISTANT",
                "content": full_text,
                "chat": {"connect": {"id": chat_id}},
                "metadata": Json({"source_chunks": len(context_chunks), "streamed": True})
            }
        )

    return StreamingResponse(chat_generator(), media_type="text/plain")

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
