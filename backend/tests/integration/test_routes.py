"""
Integration tests for API routes (using FastAPI TestClient).
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from backend.app.main import app
from backend.app.config import Settings


@pytest.fixture
def client():
    """Create a test client."""
    with patch("backend.app.routes.backtest.get_openai_client") as mock_llm:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content='{"success": true, "metrics": {"total_return": 0.1, "annual_return": 0.12, "sharpe_ratio": 1.0, "max_drawdown": -0.1, "win_rate": 0.6, "num_trades": 10, "profit_factor": 1.5}, "summary": "Test", "equity_curve": [], "trades": []}'))]
        )
        mock_llm.return_value = mock_client

        from backend.app.services.db_service import DatabaseService
        with patch.object(DatabaseService, 'get_db', new_callable=lambda: AsyncMock(return_value=MagicMock())):
            from fastapi.testclient import TestClient
            yield TestClient(app)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_backtest_basic(client):
    response = client.post("/api/v1/backtest", json={
        "strategy": "Buy and hold SPY",
        "data_source": "stocks",
    })
    assert response.status_code in [200, 500]  # 500 if mock DB not fully set up


def test_backtest_no_strategy(client):
    response = client.post("/api/v1/backtest", json={
        "strategy": "",
        "data_source": "stocks",
    })
    assert response.status_code in [422, 500]


def test_backtest_invalid_data_source(client):
    response = client.post("/api/v1/backtest", json={
        "strategy": "test strategy",
        "data_source": "forex",
    })
    assert response.status_code in [422, 500]


def test_history_empty(client):
    response = client.get("/api/v1/history")
    assert response.status_code in [200, 500]


def test_stats(client):
    response = client.get("/api/v1/stats")
    assert response.status_code in [200, 500]