"""
REST API routes for User CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Query
from app.core.database import db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse

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

    updated = await db.user.update(
        where={"id": user_id},
        data=payload.model_dump(exclude_unset=True),
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
