"""
Pydantic schemas for Chat and Message endpoints.
"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


# ── Request Schemas ──

class ChatCreate(BaseModel):
    title: Optional[str] = None
    userId: str
    botId: str


class MessageCreate(BaseModel):
    role: str = "USER"       # USER | ASSISTANT | SYSTEM
    content: str
    metadata: Optional[dict[str, Any]] = None


# ── Response Schemas ──

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Optional[Any] = None
    chatId: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    id: str
    title: Optional[str] = None
    userId: Optional[str] = None
    botId: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class ChatWithMessagesResponse(ChatResponse):
    messages: list[MessageResponse] = []


class ChatListResponse(BaseModel):
    data: list[ChatResponse]
    total: int
