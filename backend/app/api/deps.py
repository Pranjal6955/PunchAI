"""
FastAPI dependencies for authentication.
"""

from fastapi import Depends, HTTPException, status, Header, Request
from typing import Optional
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.core.database import db
from app.core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validate the JWT token and return the current user from the database.
    Used as a dependency for protected routes.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise credentials_exception

    return user
async def get_optional_user(token: str | None = Header(None, alias="Authorization")):
    """
    Optional user validation. Returns User object if valid token provided, else None.
    """
    if not token or not token.startswith("Bearer "):
        return None
        
    try:
        actual_token = token.split(" ")[1]
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return await db.user.find_unique(where={"id": user_id})
    except (JWTError, IndexError):
        return None

async def get_bot_by_api_key(
    request: Request,
    x_api_key: str | None = Header(None, alias="X-API-Key")
):
    """
    Validate the API key and return the bot.
    Used for external widget interactions.
    """
    # Skip validation for OPTIONS preflight requests
    if request.method == "OPTIONS":
        return None

    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key missing"
        )
    
    bot = await db.bot.find_unique(where={"apiKey": x_api_key})
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    
    return bot
