"""
Input validation utilities and strategy prompt builder.
"""

import re
import html
import hashlib
from datetime import datetime, timezone


# ── Input Sanitization ──────────────────────────────────

DANGEROUS_PATTERNS = re.compile(
    r"(?:import|exec|eval|compile|open\(|file\(|write\(|delete|rm |subprocess"
    r"|os\.system|shutil\.rm|__import__|globals\(|vars\(|getattr\(|setattr\("
    r"|del\s+\w+|raise\s+)",
    re.IGNORECASE,
)

MAX_STRATEGY_LENGTH = 5000


class ValidationError(Exception):
    """Raised when input validation fails."""


def sanitize_strategy(text: str) -> str:
    """
    Validate and sanitize a user-provided strategy description.

    Raises ValidationError if the input is invalid or potentially dangerous.
    """
    if not text or not isinstance(text, str):
        raise ValidationError("Strategy description cannot be empty.")

    text = text.strip()

    if len(text) > MAX_STRATEGY_LENGTH:
        raise ValidationError(
            f"Strategy too long (max {MAX_STRATEGY_LENGTH} characters)."
        )

    if DANGEROUS_PATTERNS.search(text):
        raise ValidationError(
            "Input contains disallowed patterns. "
            "Please describe your strategy in plain English."
        )

    # Basic XSS prevention for any HTML-rendered output
    text = html.escape(text)

    return text


def sanitize_data_source(source: str) -> str:
    """Validate the data_source parameter."""
    source = source.strip().lower()
    if source not in ("stocks", "crypto"):
        raise ValidationError(f"Invalid data_source: '{source}'. Must be 'stocks' or 'crypto'.")
    return source


def sanitize_run_id(run_id: str) -> str:
    """Validate a run ID format (CUID)."""
    if not re.match(r"^[a-z0-9]{8,}$", run_id):
        raise ValidationError(f"Invalid run ID format: '{run_id}'.")
    return run_id


# ── Prompt Building ─────────────────────────────────────

def build_strategy_prompt(strategy: str, data_source: str, conversation: list | None = None) -> list[dict]:
    """
    Build the LLM messages payload for code generation.

    Returns a list of messages in OpenAI-compatible format.
    """
    from backend.app.prompts import get_code_gen_prompt, get_instructions_prompt, get_solana_prompt

    system_prompt = get_code_gen_prompt(data_source)

    messages = [{"role": "system", "content": system_prompt}]

    if conversation:
        messages.extend(conversation)

    messages.append({"role": "user", "content": f"Generate backtest code for: {strategy}"})

    return messages


def request_id() -> str:
    """Generate a short request identifier for logging."""
    import secrets
    return secrets.token_hex(4)


def compute_checksum(code: str) -> str:
    """SHA-256 checksum of generated code (for dedup / caching)."""
    return hashlib.sha256(code.encode()).hexdigest()[:16]


def utcnow() -> datetime:
    """Timezone-aware UTC now."""
    return datetime.now(timezone.utc)