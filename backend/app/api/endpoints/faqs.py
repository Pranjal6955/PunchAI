from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.db.prisma import prisma
from app.api.endpoints.auth import get_current_user
from app.schemas.faq import FAQCreate, FAQUpdate, FAQResponse, FAQReorder

router = APIRouter()


async def _verify_bot_ownership(bot_id: str, user_id: str):
    """Helper to verify the bot exists and belongs to the current user."""
    bot = await prisma.chatbot.find_unique(where={"id": bot_id})
    if not bot or bot.userId != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
    return bot


@router.post("/{bot_id}/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    bot_id: str,
    faq_in: FAQCreate,
    current_user=Depends(get_current_user)
):
    """Create a new FAQ entry for a specific bot."""
    await _verify_bot_ownership(bot_id, current_user.id)

    # Auto-assign sortOrder to the end if not provided or zero
    if not faq_in.sortOrder:
        existing_count = await prisma.faq.count(where={"botId": bot_id})
        faq_in.sortOrder = existing_count

    new_faq = await prisma.faq.create(
        data={
            "question": faq_in.question,
            "answer": faq_in.answer,
            "sortOrder": faq_in.sortOrder,
            "isActive": faq_in.isActive if faq_in.isActive is not None else True,
            "botId": bot_id,
        }
    )
    return new_faq


@router.get("/{bot_id}/faqs", response_model=List[FAQResponse])
async def list_faqs(
    bot_id: str,
    current_user=Depends(get_current_user)
):
    """List all FAQs for a specific bot, ordered by sortOrder."""
    await _verify_bot_ownership(bot_id, current_user.id)

    faqs = await prisma.faq.find_many(
        where={"botId": bot_id},
        order={"sortOrder": "asc"}
    )
    return faqs


@router.get("/{bot_id}/faqs/{faq_id}", response_model=FAQResponse)
async def get_faq(
    bot_id: str,
    faq_id: str,
    current_user=Depends(get_current_user)
):
    """Retrieve a single FAQ by ID."""
    await _verify_bot_ownership(bot_id, current_user.id)

    faq = await prisma.faq.find_unique(where={"id": faq_id})
    if not faq or faq.botId != bot_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ not found"
        )
    return faq


@router.put("/{bot_id}/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(
    bot_id: str,
    faq_id: str,
    faq_in: FAQUpdate,
    current_user=Depends(get_current_user)
):
    """Update an existing FAQ entry."""
    await _verify_bot_ownership(bot_id, current_user.id)

    faq = await prisma.faq.find_unique(where={"id": faq_id})
    if not faq or faq.botId != bot_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ not found"
        )

    update_data = faq_in.dict(exclude_unset=True)
    updated_faq = await prisma.faq.update(
        where={"id": faq_id},
        data=update_data
    )
    return updated_faq


@router.delete("/{bot_id}/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    bot_id: str,
    faq_id: str,
    current_user=Depends(get_current_user)
):
    """Delete an FAQ entry."""
    await _verify_bot_ownership(bot_id, current_user.id)

    faq = await prisma.faq.find_unique(where={"id": faq_id})
    if not faq or faq.botId != bot_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ not found"
        )

    await prisma.faq.delete(where={"id": faq_id})
    return None


@router.post("/{bot_id}/faqs/reorder", status_code=status.HTTP_200_OK)
async def reorder_faqs(
    bot_id: str,
    payload: FAQReorder,
    current_user=Depends(get_current_user)
):
    """Bulk reorder FAQs by providing an ordered list of IDs."""
    await _verify_bot_ownership(bot_id, current_user.id)

    for index, faq_id in enumerate(payload.ids):
        await prisma.faq.update(
            where={"id": faq_id},
            data={"sortOrder": index}
        )

    return {"message": "FAQs reordered successfully"}
