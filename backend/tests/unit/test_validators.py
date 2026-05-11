"""
Unit tests for utility functions.
"""
import pytest
from backend.app.utils.validators import (
    sanitize_strategy,
    sanitize_data_source,
    sanitize_run_id,
    ValidationError,
    request_id,
    compute_checksum,
)


class TestSanitizeStrategy:
    """Tests for strategy input sanitization."""

    def test_valid_strategy(self):
        result = sanitize_strategy("SMA 50/200 golden cross on SPY")
        assert "SMA 50/200 golden cross on SPY" in result

    def test_trims_whitespace(self):
        result = sanitize_strategy("  RSI mean reversion  ")
        assert result == "RSI mean reversion"

    def test_rejects_empty_string(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("")

    def test_rejects_whitespace_only(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("   ")

    def test_rejects_code_injection(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("import os; os.system('rm -rf /')")

    def test_rejects_exec_keyword(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("Use exec to run this strategy")

    def test_rejects_eval_keyword(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("eval('print(1)')")

    def test_rejects_subprocess(self):
        with pytest.raises(ValidationError):
            sanitize_strategy("subprocess.run('ls')")

    def test_truncates_long_input(self):
        long_text = "x" * 6000
        with pytest.raises(ValidationError, match="too long"):
            sanitize_strategy(long_text)

    def test_escapes_html(self):
        result = sanitize_strategy('<script>alert("xss")</script>')
        assert "<script>" not in result
        assert "&lt;script&gt;" in result


class TestSanitizeDataSource:
    """Tests for data source validation."""

    def test_stocks_valid(self):
        assert sanitize_data_source("stocks") == "stocks"

    def test_crypto_valid(self):
        assert sanitize_data_source("crypto") == "crypto"

    def test_case_insensitive(self):
        assert sanitize_data_source("STOCKS") == "stocks"
        assert sanitize_data_source("CRYPTO") == "crypto"

    def test_whitespace_stripped(self):
        assert sanitize_data_source("  stocks  ") == "stocks"

    def test_rejects_invalid(self):
        with pytest.raises(ValidationError):
            sanitize_data_source("forex")


class TestSanitizeRunId:
    """Tests for run ID validation."""

    def test_valid_cuid(self):
        assert sanitize_run_id("cmoyf82no0000fmtvw9wkxqpv") == "cmoyf82no0000fmtvw9wkxqpv"

    def test_rejects_empty(self):
        with pytest.raises(ValidationError):
            sanitize_run_id("")

    def test_rejects_special_chars(self):
        with pytest.raises(ValidationError):
            sanitize_run_id("../etc/passwd")


class TestUtilities:
    """Tests for miscellaneous utilities."""

    def test_request_id_is_hex(self):
        rid = request_id()
        assert len(rid) == 8
        int(rid, 16)  # Must be valid hex

    def test_request_id_unique(self):
        ids = {request_id() for _ in range(100)}
        assert len(ids) == 100

    def test_compute_checksum(self):
        cs1 = compute_checksum("hello world")
        cs2 = compute_checksum("hello world")
        cs3 = compute_checksum("different")
        assert cs1 == cs2
        assert cs1 != cs3
        assert len(cs1) == 16