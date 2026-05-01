"""
Pydantic schemas for Data Source management (PDF, URL, FAQ).
"""

from pydantic import BaseModel, HttpUrl
from pydantic import TypeAdapter, field_validator
from typing import Optional, List, Any
from datetime import datetime
import re


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
    sourceId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


# ── Request Schemas ──

class URLSourceCreate(BaseModel):
    url: str
    botId: str

    @field_validator("url")
    @classmethod
    def normalize_and_validate_url(cls, value: str) -> str:
        url = value.strip()
        if not url:
            raise ValueError("URL is required")

        if not re.match(r"^https?://", url, flags=re.IGNORECASE):
            url = f"https://{url}"

        validated = TypeAdapter(HttpUrl).validate_python(url)
        return str(validated)


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


# ── Chunk Management (Extracted Data) ──

class ChunkUpdate(BaseModel):
    content: str


class ChunkResponse(BaseModel):
    id: str
    content: str
    sourceId: str
    botId: str
    createdAt: datetime

    model_config = {"from_attributes": True}
