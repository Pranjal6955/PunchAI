"""
Pydantic schemas for Data Source management (PDF, URL, FAQ).
"""

from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any
from datetime import datetime


# ── FAQ Entry ──

class FAQEntry(BaseModel):
    question: str
    answer: str


class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None


class FAQResponse(BaseModel):
    id: str
    question: str
    answer: str
    botId: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


# ── Request Schemas ──

class URLSourceCreate(BaseModel):
    url: HttpUrl
    botId: str


class FAQSourceCreate(BaseModel):
    name: str
    faqs: List[FAQEntry]
    botId: str


# ── Response Schemas ──

class DataSourceResponse(BaseModel):
    id: str
    name: str
    type: str           # FILE | URL | TEXT
    status: str         # PENDING | PROCESSING | COMPLETED | FAILED
    fileUrl: Optional[str] = None
    metadata: Optional[Any] = None
    botId: str
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class DataSourceListResponse(BaseModel):
    data: list[DataSourceResponse]
    total: int
