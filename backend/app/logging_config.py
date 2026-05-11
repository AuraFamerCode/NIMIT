"""
Structured logging configuration.
Supports JSON logging for production and colored console logging for dev.
"""

import logging
import sys
import json
import os
from datetime import datetime, timezone
from typing import Any

from backend.app.config import settings


class JSONFormatter(logging.Formatter):
    """Production-ready JSON log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Merge extra fields
        for key in ("request_id", "user", "action", "strategy", "run_id"):
            if hasattr(record, key):
                log_obj[key] = getattr(record, key)

        return json.dumps(log_obj, default=str)


class ConsoleFormatter(logging.Formatter):
    """Colored console formatter for development."""

    COLORS = {
        "DEBUG": "\033[36m",  # cyan
        "INFO": "\033[32m",   # green
        "WARNING": "\033[33m", # yellow
        "ERROR": "\033[31m",   # red
        "CRITICAL": "\033[1;31m",  # bold red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        ts = datetime.now().strftime("%H:%M:%S")
        return (
            f"{color}{ts} [{record.levelname}]{self.RESET} "
            f"{record.name}: {record.getMessage()}"
        )


def setup_logging() -> None:
    """Configure root logger and application loggers."""
    root_logger = logging.getLogger()
    root_logger.handlers.clear()

    if settings.environment == Environment.PRODUCTION:
        formatter = JSONFormatter()
        handler = logging.StreamHandler(sys.stdout)
    else:
        formatter = ConsoleFormatter()
        handler = logging.StreamHandler(sys.stderr)

    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(
        logging.DEBUG if settings.debug else logging.INFO
    )

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("prisma").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


# Named loggers for modules
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"algo_backtest.{name}")


logger = get_logger("app")