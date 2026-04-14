"""
REST API routes for User CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends
import os
import shutil
from app.core.database import db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.api.deps import get_current_user

from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(payload: UserCreate):
    """Create a new user."""
    # Check for duplicate email
    existing = await db.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = await db.user.create(
        data={
            "email": payload.email,
            "name": payload.name,
            "avatar": payload.avatar,
        }
    )
    return user


@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    take: int = Query(20, ge=1, le=100),
):
    """List all users with pagination."""
    users = await db.user.find_many(skip=skip, take=take, order={"createdAt": "desc"})
    total = await db.user.count()
    return {"data": users, "total": total}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get a single user by ID."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, payload: UserUpdate):
    """Update user fields."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        data["password"] = get_password_hash(data["password"])

    updated = await db.user.update(
        where={"id": user_id},
        data=data,
    )
    return updated


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload and set profile avatar."""
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"avatar_{current_user.id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # URL for the avatar (serving via /uploads mount)
    avatar_url = f"/uploads/{file_name}"
    
    updated = await db.user.update(
        where={"id": current_user.id},
        data={"avatar": avatar_url},
    )
    return updated


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str):
    """Delete a user."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.user.delete(where={"id": user_id})
    return None
