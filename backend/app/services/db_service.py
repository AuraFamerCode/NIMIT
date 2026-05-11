"""
Database service layer for AlgoBacktest.
Handles all Prisma ORM interactions.
"""

from datetime import datetime
from typing import Optional

from prisma import Prisma
from prisma.models import BacktestRun

from backend.app.logging_config import get_logger
from backend.app.config import settings

logger = get_logger("db")


class DatabaseService:
    """High-level database operations for backtest runs."""

    def __init__(self, db: Prisma | None = None):
        self.db = db

    async def get_db(self) -> Prisma:
        """Lazy-init the Prisma client."""
        if self.db is None:
            self.db = Prisma()
            await self.db.connect()
            logger.info("Database connected")
        return self.db

    async def close(self) -> None:
        """Disconnect the Prisma client."""
        if self.db:
            await self.db.disconnect()
            logger.info("Database disconnected")

    async def create_run(self, **kwargs) -> BacktestRun:
        """Create a new backtest run record."""
        db = await self.get_db()
        record = await db.backtestrun.create(data=kwargs)
        logger.info("Created run %s", record.id)
        return record

    async def get_run(self, run_id: str) -> Optional[BacktestRun]:
        """Fetch a single run by ID."""
        db = await self.get_db()
        return await db.backtestrun.find_unique(where={"id": run_id})

    async def get_all_runs(
        self, skip: int = 0, take: int = 20
    ) -> tuple[list[BacktestRun], int]:
        """Fetch runs with pagination. Returns (items, total)."""
        db = await self.get_db()
        items = await db.backtestrun.find_many(
            order={"createdAt": "desc"},
            skip=skip,
            take=take,
        )
        total = await db.backtestrun.count()
        return items, total

    async def delete_run(self, run_id: str) -> BacktestRun:
        """Delete a run by ID."""
        db = await self.get_db()
        record = await db.backtestrun.delete(where={"id": run_id})
        logger.info("Deleted run %s", run_id)
        return record

    async def delete_all_runs(self) -> int:
        """Delete all runs. Returns count deleted."""
        db = await self.get_db()
        count = await db.backtestrun.count()
        await db.backtestrun.delete_many()
        logger.info("Deleted all %d runs", count)
        return count

    async def update_run(self, run_id: str, **kwargs) -> BacktestRun:
        """Update fields on a run record."""
        db = await self.get_db()
        record = await db.backtestrun.update(
            where={"id": run_id},
            data=kwargs,
        )
        return record

    async def get_stats(self) -> dict:
        """Compute aggregate statistics."""
        db = await self.get_db()
        total = await db.backtestrun.count()
        success = await db.backtestrun.count(where={"success": True})
        rows = await db.backtestrun.find_many(where={"success": True})
        best = max(rows, key=lambda r: r.sharpeRatio or -999, default=None)

        return {
            "totalRuns": total,
            "successRuns": success,
            "failedRuns": total - success,
            "bestSharpe": best.sharpeRatio if best else None,
            "bestStrategy": best.strategy if best else None,
            "bestId": best.id if best else None,
            "successRate": round(success / total * 100, 1) if total > 0 else 0,
        }


# Singleton instance
db_service = DatabaseService()


async def get_db_service() -> DatabaseService:
    """Dependency injection helper."""
    return db_service