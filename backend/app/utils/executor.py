"""
Code execution sandbox for AlgoBacktest.
Runs generated Python code in isolated subprocesses with safety limits.
"""

import subprocess
import tempfile
import os
import json
import logging
import signal

from backend.app.logging_config import get_logger
from backend.app.config import settings

logger = get_logger("executor")


class ExecutionTimeoutError(Exception):
    """Raised when code execution exceeds the time limit."""

    def __init__(self, timeout_seconds: int):
        super().__init__(f"Code execution timed out after {timeout_seconds}s")
        self.timeout_seconds = timeout_seconds


class ExecutionError(Exception):
    """Raised when code execution fails."""

    def __init__(self, stderr: str, return_code: int):
        super().__init__(f"Execution failed with code {return_code}")
        self.stderr = stderr
        self.return_code = return_code


def execute_code(code: str, timeout_seconds: int | None = None) -> dict:
    """
    Execute Python code in a sandboxed subprocess.

    Args:
        code: Python source code to execute.
        timeout_seconds: Maximum execution time (defaults to settings).

    Returns:
        dict parsed from stdout JSON.

    Raises:
        ExecutionTimeoutError: If the process exceeds the time limit.
        ExecutionError: If the process exits non-zero or produces invalid JSON.
    """
    timeout = timeout_seconds or settings.backtest_timeout_seconds
    tmp_path = None

    try:
        # Write code to a temporary file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, prefix="algo_"
        ) as f:
            f.write(code)
            tmp_path = f.name

        logger.info(
            "Executing code in sandbox: %s (timeout=%ds)",
            os.path.basename(tmp_path),
            timeout,
        )

        # Run in isolated subprocess
        proc = subprocess.run(
            ["python3", tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )

        if proc.returncode != 0:
            stderr_tail = proc.stderr[-2000:] if proc.stderr else "No stderr"
            logger.error("Code failed (rc=%d): %s", proc.returncode, stderr_tail)
            raise ExecutionError(stderr_tail, proc.returncode)

        # Parse JSON from the last line of stdout
        result = _parse_stdout(proc.stdout)
        return result

    except subprocess.TimeoutExpired:
        logger.error("Execution timed out after %ds", timeout)
        raise ExecutionTimeoutError(timeout)
    finally:
        # Clean up temp file
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError as e:
                logger.warning("Failed to clean up temp file %s: %s", tmp_path, e)


def _parse_stdout(stdout: str) -> dict:
    """
    Parse JSON from the last valid line of stdout.

    Searches from the end backwards to find the final JSON output,
    which handles cases where there are extra print statements.
    """
    for line in reversed(stdout.splitlines()):
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            continue

    raise ExecutionError(
        f"No JSON output found. stdout:\n{stdout[:500]}",
        return_code=0,
    )