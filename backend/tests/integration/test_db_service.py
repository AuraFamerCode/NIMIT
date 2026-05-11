"""
Integration tests for database service layer.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from backend.app.services.db_service import DatabaseService


@pytest.fixture
def mock_db():
    """Create a mock Prisma instance."""
    return MagicMock()


@pytest.fixture
def db_service(mock_db):
    """Create a DatabaseService with mocked DB."""
    with patch.object(DatabaseService, 'get_db', new_callable=lambda: AsyncMock(return_value=mock_db)):
        service = DatabaseService()
        service.db = mock_db
        return service


class TestDatabaseService:
    """Tests for the DatabaseService layer."""

    @pytest.mark.asyncio
    async def test_create_run(self, db_service, mock_db):
        mock_run = MagicMock()
        mock_run.id = "test-id"
        mock_run.strategy = "Test strategy"
        mock_db.backtestrun.create.return_value = mock_run

        result = await db_service.create_run(
            strategy="Test strategy",
            model="test-model",
            success=True,
        )
        assert result.id == "test-id"
        mock_db.backtestrun.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_run_not_found(self, db_service, mock_db):
        mock_db.backtestrun.find_unique.return_value = None
        result = await db_service.get_run("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_all_runs(self, db_service, mock_db):
        mock_db.backtestrun.find_many.return_value = []
        mock_db.backtestrun.count.return_value = 0
        items, total = await db_service.get_all_runs(skip=0, take=20)
        assert items == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_delete_run(self, db_service, mock_db):
        mock_run = MagicMock()
        mock_run.id = "delete-me"
        mock_db.backtestrun.delete.return_value = mock_run
        result = await db_service.delete_run("delete-me")
        assert result.id == "delete-me"

    @pytest.mark.asyncio
    async def test_get_stats(self, db_service, mock_db):
        mock_run = MagicMock()
        mock_run.sharpeRatio = 2.0
        mock_run.strategy = "Best strat"
        mock_run.id = "best-id"
        mock_db.backtestrun.count.side_effect = [5, 5, 5]
        mock_db.backtestrun.find_many.return_value = [mock_run]

        stats = await db_service.get_stats()
        assert stats["totalRuns"] == 5
        assert stats["successRuns"] == 5
        assert stats["bestSharpe"] == 2.0
        assert stats["bestStrategy"] == "Best strat"

    @pytest.mark.asyncio
    async def test_close_without_db(self, db_service):
        """Closing when db is None should not error."""
        db_service.db = None
        await db_service.close()  # Should not raise