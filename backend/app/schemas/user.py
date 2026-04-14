"""
Pydantic schemas for User endpoints.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Request Schemas ──

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    avatar: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Response Schemas ──

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    password: Optional[str] = None


class UserListResponse(BaseModel):
    data: list[UserResponse]
    total: int
