"""
/backtest route — generates, executes, and stores backtest results.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from backend.app.services.db_service import db_service
from backend.app.llm_client import (
    get_openai_client,
    get_extra_headers,
    get_model_reasoning_config,
    parse_llm_response,
)
from backend.app.prompts import (
    get_instructions_prompt,
    get_solana_prompt,
)
from backend.app.utils.validators import (
    sanitize_strategy,
    sanitize_data_source,
    build_strategy_prompt,
    compute_checksum,
)
from backend.app.utils.executor import (
    execute_code,
    ExecutionTimeoutError,
    ExecutionError,
)
from backend.app.logging_config import get_logger
from backend.app.config import settings

logger = get_logger("routes.backtest")
router = APIRouter()

# ── Solana token constants ────────────────────────────────────────────────────
SOL_MINT = "So11111111111111111111111111111111111111112"
USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"


class BacktestRequest(BaseModel):
    strategy: str = Field(..., min_length=3, max_length=5000)
    conversation: list = []
    data_source: str = "stocks"

    @field_validator("strategy", mode="before")
    @classmethod
    def validate_strategy(cls, v):
        return sanitize_strategy(v)

    @field_validator("data_source", mode="before")
    @classmethod
    def validate_data_source(cls, v):
        return sanitize_data_source(v)


class BacktestResponse(BaseModel):
    id: str | None = None
    success: bool
    result: dict | None = None
    code: str | None = None
    error: str | None = None
    instructions: dict | None = None
    solana_instructions: dict | None = None


def _row_to_item(row):
    """Serialize a BacktestRun row to a lightweight dict."""
    return {
        "id": row.id,
        "createdAt": row.createdAt.isoformat() if row.createdAt else None,
        "strategy": row.strategy,
        "model": row.model,
        "success": row.success,
        "totalReturn": row.totalReturn,
        "sharpeRatio": row.sharpeRatio,
        "maxDrawdown": row.maxDrawdown,
        "numTrades": row.numTrades,
        "summary": row.summary,
        "error": row.error,
    }


def _safe_json(s: str | None) -> list | None:
    """Safely parse a JSON string."""
    if not s:
        return None
    try:
        return __import__("json").loads(s)
    except Exception:
        return None


def _row_to_detail(row):
    """Serialize a BacktestRun row to full detail."""
    return {
        **_row_to_item(row),
        "annualReturn": row.annualReturn,
        "winRate": row.winRate,
        "profitFactor": row.profitFactor,
        "code": row.code,
        "equityCurve": _safe_json(row.equityCurve),
        "trades": _safe_json(row.trades),
        "solanaInstructions": _safe_json(row.solanaInstructions),
    }


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(req: BacktestRequest):
    """Submit a strategy for AI-generated backtesting."""
    logger.info(
        "New backtest: strategy=%s data_source=%s",
        req.strategy[:100],
        req.data_source,
    )

    # ── Step 1: Generate code via LLM ─────────────────────────────────────
    try:
        system_prompt = get_code_gen_prompt(req.data_source)
        messages = build_strategy_prompt(req.strategy, req.data_source, req.conversation)

        client = get_openai_client()
        resp = client.chat.completions.create(
            model=settings.model,
            max_tokens=4096,
            messages=messages,
            extra_headers=get_extra_headers(),
            extra_body=get_model_reasoning_config(),
        )
        code_raw = resp.choices[0].message.content or ""
        code = _strip_code(code_raw)
    except Exception as e:
        logger.error("Code generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Code generation failed: {e}")

    # ── Step 2: Execute code in sandbox ────────────────────────────────────
    try:
        parsed = execute_code(code)
    except ExecutionTimeoutError as e:
        record = await db_service.create_run(
            strategy=req.strategy,
            model=settings.model,
            success=False,
            error=f"Backtest timed out ({e.timeout_seconds}s). Try a shorter date range.",
            code=code,
        )
        raise HTTPException(status_code=500, detail=record.error)
    except ExecutionError as e:
        error_msg = str(e.stderr)[-2000:]
        record = await db_service.create_run(
            strategy=req.strategy,
            model=settings.model,
            success=False,
            error=error_msg,
            code=code,
        )
        raise HTTPException(status_code=500, detail=error_msg)

    if not parsed.get("success"):
        error_msg = parsed.get("error", "Unknown error")
        record = await db_service.create_run(
            strategy=req.strategy,
            model=settings.model,
            success=False,
            error=error_msg,
            code=code,
        )
        raise HTTPException(status_code=500, detail=error_msg)

    # ── Step 3: Persist to database ────────────────────────────────────────
    m = parsed.get("metrics", {})
    record = await db_service.create_run(
        strategy=req.strategy,
        model=settings.model,
        success=True,
        totalReturn=m.get("total_return"),
        annualReturn=m.get("annual_return"),
        sharpeRatio=m.get("sharpe_ratio"),
        maxDrawdown=m.get("max_drawdown"),
        winRate=m.get("win_rate"),
        numTrades=m.get("num_trades"),
        profitFactor=m.get("profit_factor"),
        summary=parsed.get("summary"),
        code=code,
        equityCurve=__import__("json").dumps(parsed.get("equity_curve", [])),
        trades=__import__("json").dumps(parsed.get("trades", [])),
    )
    logger.info("Run %s created successfully", record.id)

    # ── Step 4: Generate trading instructions ──────────────────────────────
    instructions = None
    try:
        instr_resp = client.chat.completions.create(
            model=settings.model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": get_instructions_prompt()},
                {"role": "user", "content": f"Extract trading instructions from this backtest code:\n\n{code}"},
            ],
            extra_headers=get_extra_headers(),
            extra_body=get_model_reasoning_config(),
        )
        instr_raw = parse_llm_response(instr_resp.choices[0].message.content)
        instructions = __import__("json").loads(instr_raw)
    except Exception as e:
        logger.warning("Instruction extraction failed: %s", e)

    # ── Step 5: Generate Solana instructions ───────────────────────────────
    solana_instructions = None
    if instructions is not None:
        try:
            sol_resp = client.chat.completions.create(
                model=settings.model,
                max_tokens=2048,
                messages=[
                    {"role": "system", "content": get_solana_prompt()},
                    {"role": "user", "content": (
                        f"Backtest run ID: {record.id}\n"
                        f"Strategy: {req.strategy}\n"
                        f"Data source: {req.data_source}\n"
                        f"Trading instructions (extracted):\n"
                        f"{__import__('json').dumps(instructions, indent=2)}\n\n"
                        f"Backtest metrics:\n"
                        f"{__import__('json').dumps(parsed.get('metrics', {}), indent=2)}\n\n"
                        "Generate a Solana transaction instructions JSON that another AI agent "
                        "can use to execute this strategy on Solana via Jupiter Aggregator."
                    )},
                ],
                extra_headers=get_extra_headers(),
                extra_body=get_model_reasoning_config(),
            )
            sol_raw_str = parse_llm_response(sol_resp.choices[0].message.content)
            solana_instructions = __import__("json").loads(sol_raw_str)
        except Exception as e:
            logger.warning("Solana instructions generation failed: %s", e)

    # ── Step 6: Update record with Solana instructions ─────────────────────
    update_data = {}
    if solana_instructions is not None:
        update_data["solanaInstructions"] = __import__("json").dumps(solana_instructions)
    if update_data:
        await db_service.update_run(record.id, **update_data)

    return BacktestResponse(
        id=record.id,
        success=True,
        result=parsed,
        code=code,
        instructions=instructions,
        solana_instructions=solana_instructions,
    )


def _strip_code(raw: str) -> str:
    """Strip markdown fences and leading whitespace from generated code."""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        inner = lines[1:] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).rstrip("`").strip()
    return raw