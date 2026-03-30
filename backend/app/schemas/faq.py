from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FAQCreate(BaseModel):
    question: str
    answer: str
    sortOrder: Optional[int] = 0
    isActive: Optional[bool] = True


class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class FAQResponse(BaseModel):
    id: str
    question: str
    answer: str
    sortOrder: int
    isActive: bool
    botId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class FAQReorder(BaseModel):
    """Payload for bulk reordering FAQs."""
    ids: list[str]  # Ordered list of FAQ IDs
