"""
Pytest configuration for AlgoBacktest backend.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from backend.app.config import Settings


@pytest.fixture
def mock_settings():
    """Override settings for testing."""
    with patch("backend.app.config.get_settings") as mock:
        settings = Settings(
            environment="test",
            debug=True,
            openrouter_api_key="test-key",
            database_url="sqlite:///./test_backtest.db",
            rate_limit_per_minute=1000,
            rate_limit_burst=100,
            secret_key="test-secret-key-for-testing-only",
        )
        mock.return_value = settings
        yield settings


@pytest.fixture
def mock_db():
    """Create a mock Prisma database client."""
    mock = AsyncMock()
    mock.backtestrun.find_many = AsyncMock(return_value=[])
    mock.backtestrun.count = AsyncMock(return_value=0)
    mock.backtestrun.find_unique = AsyncMock(return_value=None)
    mock.backtestrun.create = AsyncMock()
    mock.backtestrun.delete = AsyncMock()
    mock.backtestrun.delete_many = AsyncMock()
    mock.backtestrun.update = AsyncMock()
    mock.connect = AsyncMock()
    mock.disconnect = AsyncMock()
    return mock


@pytest.fixture
def sample_run():
    """A sample BacktestRun-like object for tests."""
    class FakeRun:
        id = "test12345678"
        createdAt = "2026-05-10T12:00:00+00:00"
        updatedAt = "2026-05-10T12:00:00+00:00"
        strategy = "SMA 50/200 golden cross on SPY"
        model = "moonshotai/kimi-k2.6"
        success = True
        error = None
        totalReturn = 0.25
        annualReturn = 0.12
        sharpeRatio = 1.4
        maxDrawdown = -0.18
        winRate = 0.55
        numTrades = 42
        profitFactor = 1.6
        summary = "Golden cross strategy yielded 25% return."
        code = "print('hello')"
        equityCurve = '[{"date": "2020-01-02", "value": 100000.0}]'
        trades = '[{"date": "2020-06-15", "action": "BUY", "ticker": "SPY", "price": 320.5, "shares": 10}]'
        solanaInstructions = '{"strategy_name": "golden-cross"}'
    return FakeRun()


@pytest.fixture
def sample_run_dict(sample_run):
    """Sample run as a plain dict (for route-level tests)."""
    return {
        "id": sample_run.id,
        "createdAt": sample_run.createdAt,
        "strategy": sample_run.strategy,
        "model": sample_run.model,
        "success": sample_run.success,
        "totalReturn": sample_run.totalReturn,
        "sharpeRatio": sample_run.sharpeRatio,
        "maxDrawdown": sample_run.maxDrawdown,
        "numTrades": sample_run.numTrades,
        "summary": sample_run.summary,
        "error": sample_run.error,
    }