from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BotBase(BaseModel):
    name: str
    description: Optional[str] = None
    engine: str
    type: str

class BotCreate(BotBase):
    pass

class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    engine: Optional[str] = None
    type: Optional[str] = None


class BotResponse(BotBase):
    id: str
    userId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
