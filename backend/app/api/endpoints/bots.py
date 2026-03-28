from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.prisma import prisma
from app.api.endpoints.auth import get_current_user
from app.schemas.bot import BotCreate, BotUpdate, BotResponse

router = APIRouter()

@router.post("/", response_model=BotResponse, status_code=status.HTTP_201_CREATED)
async def create_bot(bot_in: BotCreate, current_user = Depends(get_current_user)):
    """
    Create a new chatbot for the current user.
    """
    bot = await prisma.chatbot.create(
        data={
            **bot_in.model_dump(),
            "userId": current_user.id
        }
    )
    return bot


@router.get("/", response_model=List[BotResponse])
async def list_bots(current_user = Depends(get_current_user)):
    """
    Retrieve all chatbots for the current user.
    """
    bots = await prisma.chatbot.find_many(
        where={
            "userId": current_user.id
        },
        order={
            "createdAt": "desc"
        }
    )
    return bots

@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(bot_id: str, current_user = Depends(get_current_user)):
    """
    Retrieve a specific chatbot by ID.
    """
    bot = await prisma.chatbot.find_unique(
        where={
            "id": bot_id
        }
    )
    
    if not bot or bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
    return bot

@router.patch("/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: str, bot_in: BotUpdate, current_user = Depends(get_current_user)):
    """
    Update a chatbot.
    """
    # Check if bot exists and belongs to user
    bot = await prisma.chatbot.find_unique(
        where={
            "id": bot_id
        }
    )
    
    if not bot or bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
    
    # Update data
    update_data = bot_in.model_dump(exclude_unset=True)
    
    updated_bot = await prisma.chatbot.update(
        where={
            "id": bot_id
        },
        data=update_data
    )
    return updated_bot

@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bot(bot_id: str, current_user = Depends(get_current_user)):
    """
    Delete a chatbot.
    """
    # Check if bot exists and belongs to user
    bot = await prisma.chatbot.find_unique(
        where={
            "id": bot_id
        }
    )
    
    if not bot or bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
    
    await prisma.chatbot.delete(
        where={
            "id": bot_id
        }
    )
    return None
