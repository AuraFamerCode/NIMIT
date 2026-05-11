"""
Unit tests for executor (code sandbox).
"""
import tempfile
import os
import pytest
from unittest.mock import patch, MagicMock
from backend.app.utils.executor import (
    execute_code,
    ExecutionTimeoutError,
    ExecutionError,
    _parse_stdout,
)


class TestExecuteCode:
    """Tests for code execution sandbox."""

    def test_simple_code(self):
        code = "print({'success': True, 'metrics': {'total_return': 0.1}})"
        result = execute_code(code, timeout_seconds=10)
        assert result["success"] is True
        assert result["metrics"]["total_return"] == 0.1

    def test_execution_timeout(self):
        code = "import time; time.sleep(5)"
        with pytest.raises(ExecutionTimeoutError):
            execute_code(code, timeout_seconds=1)

    def test_code_error(self):
        code = "raise ValueError('test error')"
        with pytest.raises(ExecutionError):
            execute_code(code, timeout_seconds=10)

    def test_syntax_error(self):
        code = "def broken("  # incomplete syntax
        with pytest.raises(ExecutionError):
            execute_code(code, timeout_seconds=10)

    def test_temp_file_cleanup(self):
        """Verify temp files are cleaned up after execution."""
        before = len(os.listdir(tempfile.gettempdir()))
        code = 'print({"success": True})'
        execute_code(code, timeout_seconds=10)
        # Temp files should be cleaned up (at most 1 transient)
        after = len(os.listdir(tempfile.gettempdir()))
        assert after <= before + 1


class TestParseStdout:
    """Tests for JSON stdout parsing."""

    def test_valid_json_last_line(self):
        stdout = "Some output\n{'key': 'value'}"
        result = _parse_stdout(stdout)
        assert result == {"key": "value"}

    def test_json_with_extra_prints(self):
        stdout = "Debug info\nMore debug\n{'success': True}"
        result = _parse_stdout(stdout)
        assert result == {"success": True}

    def test_invalid_json_raises(self):
        with pytest.raises(ExecutionError):
            _parse_stdout("No JSON here")

    def test_empty_stdout_raises(self):
        with pytest.raises(ExecutionError):
            _parse_stdout("")