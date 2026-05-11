"""
Application configuration and settings.
Loads from environment variables with sensible defaults.
"""

from pydantic import BaseModel, Field, field_validator
from enum import Enum
from functools import lru_cache
import os


class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TEST = "test"


class Settings(BaseModel):
    # ── Environment ──────────────────────────────────────
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = True
    project_name: str = "AlgoBacktest"
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # ── Server ───────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    reload: bool = True
    cors_origins: list[str] = ["http://localhost:3000"]

    # ── Database ─────────────────────────────────────────
    database_url: str = Field(
        default="sqlite:///./backtest.db",
        alias="DATABASE_URL",
    )

    # ── LLM / OpenRouter ─────────────────────────────────
    openrouter_api_key: str = Field(
        default="",
        alias="OPENROUTER_API_KEY",
    )
    model: str = "moonshotai/kimi-k2.6"
    your_site_url: str = Field(
        default="http://localhost:3000",
        alias="YOUR_SITE_URL",
    )
    your_site_name: str = Field(
        default="AI Backtester",
        alias="YOUR_SITE_NAME",
    )

    # ── Rate Limiting ────────────────────────────────────
    rate_limit_per_minute: int = 30
    rate_limit_burst: int = 10

    # ── Security ─────────────────────────────────────────
    backend_cors_regex: str = r"^http://localhost(:\d+)?$"
    admin_password: str = "admin"  # TODO: load from env in production
    max_strategy_length: int = 5000
    max_code_size: int = 16_384  # 16 KB
    backtest_timeout_seconds: int = 90

    # ── Auth ─────────────────────────────────────────────
    secret_key: str = Field(
        default="change-me-in-production-use-secure-random",
        alias="SECRET_KEY",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("openrouter_api_key", mode="before")
    @classmethod
    def validate_openrouter_key(cls, v):
        if not v:
            raise ValueError("OPENROUTER_API_KEY is required")
        return v


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()