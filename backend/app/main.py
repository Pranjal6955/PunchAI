"""
PunchAI Backend — FastAPI application entry point.

REST API powered by:
  • FastAPI + Uvicorn
  • Prisma Client Python (ORM)
  • Neon PostgreSQL (serverless Postgres)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_db, disconnect_db

# ── Route imports ──
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.bots import router as bots_router
from app.api.routes.datasources import router as datasources_router
from app.api.routes.chats import router as chats_router
from app.api.routes.ai import router as ai_router


# ── Lifespan: DB connect / disconnect ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


# ── Create app ──
app = FastAPI(
    title="PunchAI API",
    description="REST API for the PunchAI platform — manage users, bots, data sources, and chats.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──
API_PREFIX = "/api"

app.include_router(health_router)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(bots_router, prefix=API_PREFIX)
app.include_router(datasources_router, prefix=API_PREFIX)
app.include_router(chats_router, prefix=API_PREFIX)
app.include_router(ai_router, prefix=API_PREFIX)


# ── Root ──
@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "PunchAI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
