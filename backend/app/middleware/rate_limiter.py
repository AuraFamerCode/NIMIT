"""
Rate limiting middleware for AlgoBacktest.
Uses in-memory sliding window (suitable for single-process deployments).
For multi-process, swap to Redis-based limiter.
"""

import time
import threading
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.logging_config import get_logger

logger = get_logger("rate_limiter")


class InMemoryRateLimiter:
    """Simple sliding-window rate limiter using in-memory storage."""

    def __init__(self, requests_per_minute: int = 30, burst: int = 10):
        self.requests_per_minute = requests_per_minute
        self.burst = burst
        self._timestamps: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        """Check if a request is allowed. Returns True if within limits."""
        now = time.time()
        window_start = now - 60  # 60-second window

        with self._lock:
            # Clean old entries
            self._timestamps[key] = [
                ts for ts in self._timestamps[key] if ts > window_start
            ]

            if len(self._timestamps[key]) >= self.burst:
                logger.warning("Rate limit exceeded for key: %s", key)
                return False

            self._timestamps[key] = [
                ts for ts in self._timestamps[key] if ts > window_start
            ]

            # Enforce per-minute limit
            if (
                len(self._timestamps[key]) >= self.requests_per_minute
                and self._timestamps[key][0] <= window_start
            ):
                logger.warning("Rate limit per-minute exceeded for key: %s", key)
                return False

            self._timestamps[key] = [
                ts for ts in self._timestamps[key] if ts > window_start
            ]
            self._timestamps[key].append(now)
            return True

    def cleanup(self):
        """Remove expired entries (call periodically)."""
        now = time.time()
        with self._lock:
            for key in list(self._timestamps.keys()):
                self._timestamps[key] = [
                    ts for ts in self._timestamps[key] if ts > now - 60
                ]
                if not self._timestamps[key]:
                    del self._timestamps[key]


# Global limiter instance — loaded from settings
rate_limiter = InMemoryRateLimiter(
    requests_per_minute=30,
    burst=10,
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that applies rate limiting per client IP.
    Exempts paths like /health and /docs.
    """

    EXEMPT_PATHS = {"/health", "/docs", "/openapi.json"}

    def __init__(self, app, limiter: InMemoryRateLimiter = rate_limiter):
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        request_id = getattr(request.state, "request_id", client_ip)

        if not self.limiter.is_allowed(client_ip):
            logger.warning(
                "Rate limit hit for IP %s on %s", client_ip, request.url.path
            )
            return Response(
                content='{"success": false, "error": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={
                    "Retry-After": "60",
                },
            )

        response = await call_next(request)
        return response