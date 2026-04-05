"""
REST API routes for Bot CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from app.core.database import db
from app.schemas.bot import BotCreate, BotUpdate, BotResponse, BotListResponse, BotWithUserResponse
from app.api.deps import get_current_user
from app.core.vector_store import delete_collection

router = APIRouter(prefix="/bots", tags=["Bots"])


@router.post("/", response_model=BotResponse, status_code=201)
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


@router.get("/", response_model=BotListResponse)
async def list_bots(
    skip: int = Query(0, ge=0),
    take: int = Query(20, ge=1, le=100),
    owner_id: str | None = Query(None, alias="ownerId"),
):
    """List bots, optionally filtered by owner."""
    where = {}
    if owner_id:
        where["ownerId"] = owner_id

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
async def get_bot(bot_id: str):
    """Get a single bot by ID with its owner details."""
    bot = await db.bot.find_unique(
        where={"id": bot_id},
        include={"owner": True, "dataSources": True}
    )
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
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
    delete_collection(bot_id)

    # 2. Delete from Database (cascades to chats, sources, etc.)
    await db.bot.delete(where={"id": bot_id})
    return None
