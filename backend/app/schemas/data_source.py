from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DataSourceBase(BaseModel):
    type: str = "url"
    link: Optional[str] = None
    fileName: Optional[str] = None
    prompt: Optional[str] = None

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceUpdate(BaseModel):
    title: Optional[str] = None
    structuredContent: Optional[str] = None
    content: Optional[str] = None

class DataSourceResponse(DataSourceBase):
    id: str
    title: Optional[str] = None
    content: Optional[str] = None
    structuredContent: Optional[str] = None
    botId: str
    status: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
