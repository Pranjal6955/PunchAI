"""
Pydantic schemas for Bot endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserResponse


# ── Request Schemas ──

class BotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    botPersona: Optional[str] = None
    ownerId: Optional[str] = None


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    botPersona: Optional[str] = None
    customCss: Optional[str] = None
    welcomeMessage: Optional[str] = None
    suggestionChips: Optional[str] = None
    themeColor: Optional[str] = None
    widgetWidth: Optional[str] = None
    widgetBorderRadius: Optional[int] = None
    userBorderRadius: Optional[int] = None
    assistantBorderRadius: Optional[int] = None
    userChatBg: Optional[str] = None
    assistantChatBg: Optional[str] = None


# ── Response Schemas ──

class BotResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    botPersona: Optional[str] = None
    apiKey: Optional[str] = None
    customCss: Optional[str] = None
    welcomeMessage: Optional[str] = None
    suggestionChips: Optional[str] = None
    themeColor: Optional[str] = None
    widgetWidth: Optional[str] = None
    widgetBorderRadius: Optional[int] = None
    userBorderRadius: Optional[int] = None
    assistantBorderRadius: Optional[int] = None
    userChatBg: Optional[str] = None
    assistantChatBg: Optional[str] = None
    ownerId: str
    dataSourceCount: Optional[int] = 0
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class BotWithUserResponse(BotResponse):
    owner: UserResponse


class BotListResponse(BaseModel):
    data: list[BotResponse]
    total: int
