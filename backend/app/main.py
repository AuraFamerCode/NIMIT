"""
AlgoBacktest API — Professional entry point.
Run: uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.logging_config import setup_logging, logger
from backend.app.errors import (
    AppException,
    ValidationError,
    RateLimitError,
    AuthError,
    NotFoundError,
    ExecutionError,
    register_exception_handlers,
)
from backend.app.middleware.security import setup_cors, SecurityHeadersMiddleware
from backend.app.middleware.rate_limiter import RateLimitMiddleware
from backend.app.services.db_service import db_service

# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle management."""
    # Startup
    setup_logging()
    logger.info(
        "Starting %s v%s in %s mode",
        settings.project_name,
        settings.version,
        settings.environment.value,
    )
    await db_service.get_db()
    logger.info("All services initialized")
    yield
    # Shutdown
    await db_service.close()
    logger.info("Shutdown complete")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="AI-powered trading strategy backtester with Solana integration",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────

setup_cors(app)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
register_exception_handlers(app)


# ── Health (pre-middleware route for monitoring) ──────────────────────────────

@app.get("/health")
async def health():
    """Health check — bypasses middleware for uptime probes."""
    return {"status": "ok", "model": settings.model, "provider": "openrouter"}


# ── Import routes (must come after middleware setup) ──────────────────────────

from backend.app.routes import backtest, history, admin  # noqa: E402

app.include_router(backtest.router, prefix=settings.api_prefix, tags=["backtest"])
app.include_router(history.router, prefix=settings.api_prefix, tags=["history"])
app.include_router(admin.router, prefix=settings.api_prefix, tags=["admin"])


# ── Request ID injection ──────────────────────────────────────────────────────

@app.middleware("http")
async def inject_request_id(request: Request, call_next):
    from backend.app.utils.validators import request_id
    request.state.request_id = request_id()
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response