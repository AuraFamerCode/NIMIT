"""
/history routes — list, detail, delete, and download backtest runs.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import datetime

from backend.app.services.db_service import db_service
from backend.app.logging_config import get_logger

logger = get_logger("routes.history")
router = APIRouter()


@router.get("/history")
async def get_history(skip: int = 0, take: int = 20):
    """List past backtest runs (newest first) with pagination."""
    if skip < 0 or take < 1 or take > 100:
        raise HTTPException(status_code=400, detail="Invalid pagination params.")
    rows, total = await db_service.get_all_runs(skip=skip, take=take)
    return {"total": total, "items": [_row_to_item(r) for r in rows]}


@router.get("/history/{run_id}")
async def get_history_detail(run_id: str):
    """Get full details for a single backtest run."""
    row = await db_service.get_run(run_id)
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return _row_to_detail(row)


@router.delete("/history/{run_id}")
async def delete_run(run_id: str):
    """Delete a single backtest run."""
    row = await db_service.get_run(run_id)
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    await db_service.delete_run(run_id)
    return {"deleted": run_id}


@router.get("/history/{run_id}/solana-instructions")
async def get_solana_instructions(run_id: str):
    """Download Solana instructions JSON as a file attachment."""
    row = await db_service.get_run(run_id)
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    if not row.solanaInstructions:
        raise HTTPException(status_code=404, detail="No Solana instructions for this run")

    fname = f"solana_instructions_{run_id[:8]}_{datetime.date.today().isoformat()}.json"
    return JSONResponse(
        content=_safe_json(row.solanaInstructions),
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
            "Content-Type": "application/json",
        },
    )


@router.get("/stats")
async def get_stats():
    """Aggregate platform statistics."""
    return await db_service.get_stats()


def _row_to_item(row):
    return {
        "id": row.id,
        "createdAt": row.createdAt.isoformat() if row.createdAt else None,
        "strategy": row.strategy,
        "model": row.model,
        "success": row.success,
        "totalReturn": row.totalReturn,
        "sharpeRatio": row.sharpeRatio,
        "maxDrawdown": row.maxDrawdown,
        "numTrades": row.numTrades,
        "summary": row.summary,
        "error": row.error,
    }


def _row_to_detail(row):
    import json as _json
    return {
        **_row_to_item(row),
        "annualReturn": row.annualReturn,
        "winRate": row.winRate,
        "profitFactor": row.profitFactor,
        "code": row.code,
        "equityCurve": _safe_json(row.equityCurve),
        "trades": _safe_json(row.trades),
        "solanaInstructions": _safe_json(row.solanaInstructions),
    }


def _safe_json(s):
    if not s:
        return None
    try:
        return _json.loads(s)
    except Exception:
        return None