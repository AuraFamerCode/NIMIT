"""
Error handlers and custom exceptions for the AlgoBacktest API.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
import traceback

from backend.app.logging_config import get_logger

logger = get_logger("errors")


class AppException(Exception):
    """Base application exception with HTTP status mapping."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: dict | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}


class ValidationError(AppException):
    """Input validation failure."""

    def __init__(self, message: str = "Invalid input"):
        super().__init__(message, status_code=422)


class RateLimitError(AppException):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Rate limit exceeded. Try again later."):
        super().__init__(message, status_code=429)


class AuthError(AppException):
    """Authentication/authorization failure."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class NotFoundError(AppException):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ExecutionError(AppException):
    """Backtest execution failure."""

    def __init__(self, message: str = "Execution failed"):
        super().__init__(message, status_code=502)


async def app_exception_handler(request: Request, exc: AppException):
    """Handle all application-specific exceptions."""
    logger.error(
        "AppException: %s | path=%s | detail=%s",
        exc.message,
        request.url.path,
        exc.detail,
        exc_info=True,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "detail": exc.detail or None,
        },
    )


async def validation_exception_handler(request: Request, exc: Exception):
    """Handle Pydantic validation errors."""
    logger.warning("ValidationError on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Validation error",
            "detail": str(exc),
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — never leak internals."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.critical(
        "Unhandled exception [%s]: %s",
        request_id,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "request_id": request_id,
        },
    )


def register_exception_handlers(app):
    """Attach all exception handlers to the FastAPI app."""
    from fastapi.exceptions import RequestValidationError

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)