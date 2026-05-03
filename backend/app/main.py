"""
PunchAI Backend — FastAPI application entry point.

REST API powered by:
  • FastAPI + Uvicorn
  • Prisma Client Python (ORM)
  • Neon PostgreSQL (serverless Postgres)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.core.logging import logger
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from fastapi.staticfiles import StaticFiles
import os

# ── Route imports ──
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.bots import router as bots_router
from app.api.routes.datasources import router as datasources_router
from app.api.routes.chats import router as chats_router
from app.api.routes.ai import router as ai_router
from app.api.routes.external import router as external_router


# ── Lifespan: DB connect / disconnect ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.utils.extractor import pw_manager
    logger.info("Starting up PunchAI Backend...")
    await connect_db()
    await pw_manager.start()
    yield
    await pw_manager.stop()
    await disconnect_db()
    logger.info("Shutting down PunchAI Backend...")


# ── Create app ──
app = FastAPI(
    title="PunchAI API",
    description="REST API for the PunchAI platform — manage users, bots, data sources, and chats.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Unified CORS Middleware ──
@app.middleware("http")
async def unified_cors_middleware(request: Request, call_next):
    """
    Handles CORS for both the internal dashboard and external widget.
    - Dashboard: Requires credentials, limited to settings.cors_origins_list.
    - External: Allows all origins, no credentials.
    """
    origin = request.headers.get("Origin")
    is_external = request.url.path.startswith("/api/external")

    # 1. Handle Preflight (OPTIONS)
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
            "Access-Control-Max-Age": "86400",
        }
        
        if is_external:
            headers["Access-Control-Allow-Origin"] = "*"
        elif origin in settings.cors_origins_list:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
        else:
            # Fallback for security: allow first configured origin
            headers["Access-Control-Allow-Origin"] = settings.cors_origins_list[0] if settings.cors_origins_list else "*"
            headers["Access-Control-Allow-Credentials"] = "true"

        return Response(status_code=204, headers=headers)

    # 2. Handle Actual Request
    response = await call_next(request)

    # 3. Add CORS Headers to Response
    if is_external:
        response.headers["Access-Control-Allow-Origin"] = "*"
    elif origin in settings.cors_origins_list:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# ── Register Routers ──
API_PREFIX = "/api"

app.include_router(health_router)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(bots_router, prefix=API_PREFIX)
app.include_router(datasources_router, prefix=API_PREFIX)
app.include_router(chats_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)
app.include_router(external_router, prefix=API_PREFIX)

# Avatars will now be served via a dedicated public route, 
# and DataSource files will be served via an owner-only route for security.
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Root ──
@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "PunchAI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
