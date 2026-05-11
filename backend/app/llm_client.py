"""
OpenAI / LLM client wrapper for AlgoBacktest.
Handles retries, logging, and response parsing.
"""

from openai import OpenAI, AsyncOpenAI
from backend.app.logging_config import get_logger
from backend.app.config import settings

logger = get_logger("llm")


def get_openai_client() -> OpenAI:
    """Create a synchronous OpenAI client configured for OpenRouter."""
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=settings.openrouter_api_key,
    )


def get_extra_headers() -> dict:
    """Extra HTTP headers for OpenRouter billing."""
    return {
        "HTTP-Referer": settings.your_site_url,
        "X-Title": settings.your_site_name,
    }


def get_model_reasoning_config(model: str | None = None) -> dict:
    """
    Return extra_body config for reasoning models.
    Hy3-preview models require explicit reasoning disable for non-reasoning calls.
    """
    target = model or settings.model
    if "hy3-preview" in target:
        return {"reasoning": {"enabled": False}}
    return {}


def parse_llm_response(content: str | None, fallback_reasoning: str | None = None) -> str:
    """
    Extract text content from an LLM response, handling reasoning models.
    Falls back to reasoning content if main content is empty.
    """
    text = content or ""
    if not text and fallback_reasoning:
        text = fallback_reasoning
    return text.strip()