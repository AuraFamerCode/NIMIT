"""
Tests for error handling and middleware.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from backend.app.main import app
from backend.app.services.db_service import DatabaseService


@pytest.fixture
def client():
    """Create a test client with mocked LLM and DB."""
    with patch("backend.app.routes.backtest.get_openai_client") as mock_llm:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content='{invalid json'))]
        )
        mock_llm.return_value = mock_client

        with patch.object(DatabaseService, 'get_db', new_callable=lambda: AsyncMock(return_value=MagicMock())):
            from fastapi.testclient import TestClient
            yield TestClient(app, raise_server_exceptions=False)


def test_health_returns_json(client):
    """Health endpoint always returns valid JSON."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data


def test_unknown_route_404(client):
    """Unknown routes return 404."""
    resp = client.get("/nonexistent")
    assert resp.status_code == 404


def test_internal_error_no_leak(client):
    """Internal errors should not leak stack traces to clients."""
    # This tests the generic exception handler
    resp = client.post("/api/v1/backtest", json={"strategy": "test", "data_source": "stocks"})
    # May be 500 or other, but should never contain traceback
    if resp.status_code == 500:
        assert "Traceback" not in resp.text