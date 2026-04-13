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
    logger.info("Starting up PunchAI Backend...")
    await connect_db()
    yield
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

# ── CORS Middleware ──
# We allow specific origins with credentials for the dashboard, 
# and we will handle external widget logic by ensuring the origins are permissive.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def external_cors_middleware(request: Request, call_next):
    """
    Handle CORS for external widget routes.
    Allows all origins for /api/external to support the embeddable widget.
    """
    if request.url.path.startswith("/api/external"):
        if request.method == "OPTIONS":
            return Response(
                status_code=204,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    return await call_next(request)

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

# ── Static Files ──
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Root ──
@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "PunchAI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
