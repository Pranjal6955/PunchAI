"""
Pydantic schemas for Bot endpoints.
"""

from pydantic import BaseModel
from typing import Optional
from app.schemas.user import UserResponse


# ── Request Schemas ──

class BotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    botPersona: Optional[str] = None
    ownerId: str


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    botPersona: Optional[str] = None


# ── Response Schemas ──

class BotResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    botPersona: Optional[str] = None
    ownerId: str
    dataSourceCount: Optional[int] = 0

    model_config = {"from_attributes": True}


class BotWithUserResponse(BotResponse):
    owner: UserResponse


class BotListResponse(BaseModel):
    data: list[BotResponse]
    total: int
