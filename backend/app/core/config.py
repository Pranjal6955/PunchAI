"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # ── Database ──
    DATABASE_URL: str

    # ── App ──
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    APP_HOST: str = "0.0.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me"

    # ── CORS ──
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ── OpenRouter ──
    OPENROUTER_API_KEY: str = "sk-or-v1-..."
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"

    # ── Groq ──
    GROQ_API_KEY: str = "gsk_..."
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton instance
settings = Settings()
