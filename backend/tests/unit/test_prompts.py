"""
Unit tests for prompts module.
"""
from backend.app.prompts import (
    get_code_gen_prompt,
    get_instructions_prompt,
    get_solana_prompt,
    STOCK_PROMPT,
    CRYPTO_PROMPT,
)


class TestGetCodeGenPrompt:
    def test_stocks_prompt(self):
        prompt = get_code_gen_prompt("stocks")
        assert prompt == STOCK_PROMPT
        assert "yfinance" in prompt

    def test_crypto_prompt(self):
        prompt = get_code_gen_prompt("crypto")
        assert prompt == CRYPTO_PROMPT
        assert "Binance" in prompt

    def test_unknown_defaults_to_stocks(self):
        prompt = get_code_gen_prompt("unknown")
        assert "yfinance" in prompt


class TestGetInstructionsPrompt:
    def test_returns_string(self):
        prompt = get_instructions_prompt()
        assert isinstance(prompt, str)
        assert "JSON" in prompt


class TestGetSolanaPrompt:
    def test_returns_string(self):
        prompt = get_solana_prompt()
        assert isinstance(prompt, str)
        assert "Solana" in prompt
        assert "Jupiter" in prompt