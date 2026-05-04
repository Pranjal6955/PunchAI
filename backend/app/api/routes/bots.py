"""
REST API routes for Bot CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.concurrency import run_in_threadpool
from typing import Optional
from app.core.database import db
from app.schemas.bot import BotCreate, BotUpdate, BotResponse, BotListResponse, BotWithUserResponse
from app.schemas.chat import ChatListResponse
from app.api.deps import get_current_user
from app.core.vector_store import delete_collection
from app.services.processor import hybrid_retrieve
from app.services.llm import generate_suggested_questions
import uuid

router = APIRouter(prefix="/bots", tags=["Bots"])


@router.post("", response_model=BotResponse, status_code=201)
async def create_bot(payload: BotCreate, current_user=Depends(get_current_user)):
    """Create a new bot/agent."""
    bot = await db.bot.create(
        data={
            "name": payload.name,
            "description": payload.description,
            "botPersona": payload.botPersona,
            "owner": {"connect": {"id": current_user.id}},
        }
    )
    return bot


@router.get("", response_model=BotListResponse)
async def list_bots(
    skip: int = Query(0, ge=0),
    take: int = Query(20, ge=1, le=100),
    owner_id: str | None = Query(None, alias="ownerId"),
    current_user=Depends(get_current_user),
):
    """List bots. (Protected: Defaults to current user's bots)"""
    where = {}
    
    # Security: If no owner_id is requested, default to current_user
    # If owner_id is requested, ensure requester has permission (for now, just allow their own)
    target_owner = owner_id if owner_id else current_user.id
    
    if target_owner != current_user.id:
        # For now, users can only list their own bots
        raise HTTPException(status_code=403, detail="Not authorized to list bots for other users")
        
    where["ownerId"] = target_owner

    bots = await db.bot.find_many(
        where=where, skip=skip, take=take,
        include={"dataSources": True}
    )
    bots_with_count = []
    for b in bots:
        count = len(b.dataSources) if b.dataSources else 0
        # Convert to dict and add the custom field
        bot_dict = b.model_dump()
        bot_dict["dataSourceCount"] = count
        bots_with_count.append(bot_dict)
        
    total = await db.bot.count(where=where)
    return {"data": bots_with_count, "total": total}


@router.get("/{bot_id}", response_model=BotWithUserResponse)
async def get_bot(bot_id: str, current_user=Depends(get_current_user)):
    """Get a single bot by ID with its owner details. (Owner only)"""
    bot = await db.bot.find_unique(
        where={"id": bot_id},
        include={"owner": True, "dataSources": True}
    )
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Security check: only owner can see full details
    if bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Manually adding non-persistent field for Response Schema
    bot_dict = bot.model_dump()
    bot_dict["dataSourceCount"] = len(bot.dataSources) if bot.dataSources else 0
    return bot_dict


@router.patch("/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: str, payload: BotUpdate, current_user=Depends(get_current_user)):
    """Update bot fields."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Only owner can update
    if bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this bot")

    updated = await db.bot.update(
        where={"id": bot_id},
        data=payload.model_dump(exclude_unset=True),
    )
    return updated


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(bot_id: str, current_user=Depends(get_current_user)):
    """Delete a bot."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Only owner can delete
    if bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bot")

    # 1. Delete from Vector Store
    await run_in_threadpool(delete_collection, bot_id)

    # 2. Delete from Database (cascades to chats, sources, etc.)
    await db.bot.delete(where={"id": bot_id})
    return None


@router.post("/{bot_id}/api-key", response_model=BotResponse)
async def generate_bot_api_key(bot_id: str, current_user=Depends(get_current_user)):
    """Generate or rotate an API key for a bot."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Only owner can generate/rotate key
    if bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this bot")

    # Rotate or Generate
    new_key = str(uuid.uuid4())
    updated = await db.bot.update(
        where={"id": bot_id},
        data={"apiKey": new_key}
    )
    return updated


@router.get("/{bot_id}/conversations", response_model=ChatListResponse)
async def get_bot_conversations(
    bot_id: str,
    isExternal: Optional[bool] = Query(None),
    current_user=Depends(get_current_user)
):
    """List all conversations for a specific bot. Only accessible by the bot owner."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    if bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    where = {"botId": bot_id}
    if isExternal is not None:
        where["isExternal"] = isExternal
        
    chats = await db.chat.find_many(
        where=where,
        order={"updatedAt": "desc"}
    )
    return {"data": chats, "total": len(chats)}

@router.get("/{bot_id}/feedback-messages")
async def get_negative_feedback_messages(bot_id: str, current_user=Depends(get_current_user)):
    """Retrieve all messages with negative feedback for this bot."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    messages = await db.message.find_many(
        where={
            "chat": {"botId": bot_id},
            "feedback": -1
        },
        order={"createdAt": "desc"}
    )
    return messages

@router.get("/{bot_id}/suggested-questions")
async def get_suggested_questions(bot_id: str, current_user=Depends(get_current_user)):
    """Auto-generate context-aware starter questions for the bot."""
    bot = await db.bot.find_unique(where={"id": bot_id})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # 1. Grab some context from the bot's KB
    context = await hybrid_retrieve(bot_id, "Explain top themes and purpose of these documents", top_k=5)

    context_chunks = context.get("chunks", []) if isinstance(context, dict) else context
    if not context_chunks:
        return ["Who are you?", "What can you do?", "Tell me about yourself."]

    # 2. Ask LLM to generate questions
    questions = await generate_suggested_questions(context_chunks)
    return questions
