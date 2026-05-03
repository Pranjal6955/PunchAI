"""
REST API routes for User CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends
from fastapi.responses import FileResponse
import os
import shutil
from app.core.database import db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.api.deps import get_current_user

from app.core.security import get_password_hash
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/users", tags=["Users"])




@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    take: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    """List all users with pagination. (Protected)"""
    users = await db.user.find_many(skip=skip, take=take, order={"createdAt": "desc"})
    total = await db.user.count()
    return {"data": users, "total": total}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user=Depends(get_current_user)):
    """Get a single user by ID. (Protected)"""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, payload: UserUpdate, current_user=Depends(get_current_user)):
    """Update user fields. (Owner only)"""
    if user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to update this user")

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
    
    def save_file():
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    await run_in_threadpool(save_file)
    
    # URL for the avatar (serving via the new API route)
    avatar_url = f"/api/users/avatar/{file_name}"
    
    updated = await db.user.update(
        where={"id": current_user.id},
        data={"avatar": avatar_url},
    )
    return updated


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, current_user=Depends(get_current_user)):
    """Delete a user. (Owner only)"""
    if user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this user")
         
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.user.delete(where={"id": user_id})
    return None


@router.get("/avatar/{filename}")
async def get_avatar(filename: str):
    """Serve user avatars publicly."""
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(filename)
    
    # Safety Check: only allows avatar_ prefixed files
    if not safe_filename.startswith("avatar_"):
        raise HTTPException(status_code=403, detail="Not authorized to access this file type")
        
    file_path = os.path.join("uploads", safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Avatar not found")
        
    return FileResponse(file_path)
