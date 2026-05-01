"""
Pydantic schemas for Chat and Message endpoints.
"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


# ── Request Schemas ──

class ChatCreate(BaseModel):
    title: Optional[str] = None
    userId: Optional[str] = None
    botId: str
    isExternal: bool = False
    visitorId: Optional[str] = None
    externalUserId: Optional[str] = None
    externalUserName: Optional[str] = None
    externalUserEmail: Optional[str] = None
    customMetadata: Optional[dict[str, Any]] = None

class ExternalUserData(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class MessageCreate(BaseModel):
    role: str = "USER"       # USER | ASSISTANT | SYSTEM
    content: str
    model: Optional[str] = None # P3: model override for Playground
    metadata: Optional[dict[str, Any]] = None


# ── Response Schemas ──

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    metadata: Optional[Any] = None
    feedback: Optional[int] = None
    chatId: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    id: str
    title: Optional[str] = None
    userId: Optional[str] = None
    botId: str
    isExternal: bool
    visitorId: Optional[str] = None
    externalUserId: Optional[str] = None
    externalUserName: Optional[str] = None
    externalUserEmail: Optional[str] = None
    customMetadata: Optional[Any] = None
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class ChatWithMessagesResponse(ChatResponse):
    messages: list[MessageResponse] = []


class ChatListResponse(BaseModel):
    data: list[ChatResponse]
    total: int
