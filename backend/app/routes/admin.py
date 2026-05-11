"""
/admin routes — platform administration endpoints.
Requires authentication (TODO: implement proper JWT auth).
"""

from fastapi import APIRouter, HTTPException, Header
from backend.app.services.db_service import db_service
from backend.app.config import settings
from backend.app.logging_config import get_logger

logger = get_logger("routes.admin")
router = APIRouter()


def _verify_admin(authorization: str | None = Header(None)):
    """Simple admin token check."""
    # TODO: Replace with JWT-based auth in production
    token = (authorization or "").removeprefix("Bearer ").strip()
    if token != settings.admin_password:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.delete("/admin/runs")
async def delete_all_runs(authorization: str | None = Header(None)):
    """Delete all backtest runs (admin-only)."""
    _verify_admin(authorization)
    count = await db_service.delete_all_runs()
    return {"deleted": count, "status": "ok"}


@router.get("/admin/health")
async def admin_health():
    """Extended health check with database status."""
    try:
        total = await db_service.get_db()
        count = await total.backtestrun.count()
        return {"status": "ok", "db_records": count}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}