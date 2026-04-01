"""
REST API routes for User Authentication (Signup/Login).
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: UserResponse = Depends(get_current_user)):
    """Return the authenticated user profile."""
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate):
    """Register a new user and return an access token."""
    # Check if user already exists
    existing = await db.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Create user with hashed password
    user = await db.user.create(
        data={
            "email": payload.email,
            "password": get_password_hash(payload.password),
            "name": payload.name,
            "avatar": payload.avatar,
        }
    )

    # Generate token
    token = create_access_token(subject=user.id)
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user,
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    """Authenticate user and return an access token."""
    # Find user
    user = await db.user.find_unique(where={"email": payload.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Verify password
    if not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Generate token
    token = create_access_token(subject=user.id)
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user,
    }
