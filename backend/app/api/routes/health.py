"""
Health check endpoint.
"""

from fastapi import APIRouter
from app.core.database import db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Application health check — verifies DB connectivity."""
    try:
        # Quick query to verify the database connection is alive
        await db.execute_raw("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
    }
