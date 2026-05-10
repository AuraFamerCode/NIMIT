"""
AI Backtesting Server  (OpenRouter + Prisma edition)
Run with: uvicorn main:app --reload --port 8000

Setup (one-time):
  pip install -r requirements.txt
  npx prisma generate          # generates Prisma Python client
  npx prisma db push           # creates backtest.db

Env vars (set in .env):
  OPENROUTER_API_KEY   — required
  DATABASE_URL         — default: file:./backtest.db
  MODEL                — default: moonshotai/kimi-k2.6
  YOUR_SITE_URL        — optional
  YOUR_SITE_NAME       — optional
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from openai import OpenAI
from prisma import Prisma
import subprocess
import tempfile
import os
import json
from dotenv import load_dotenv

load_dotenv(override=True)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
MODEL              = os.environ.get("MODEL", "moonshotai/kimi-k2.6")

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is not set.")

# ---------------------------------------------------------------------------
# OpenRouter client
# ---------------------------------------------------------------------------
llm = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

EXTRA_HEADERS = {
    "HTTP-Referer": os.environ.get("YOUR_SITE_URL", "http://localhost:3000"),
    "X-Title":      os.environ.get("YOUR_SITE_NAME", "AI Backtester"),
}

# ---------------------------------------------------------------------------
# Prisma client  (singleton, connected on startup)
# ---------------------------------------------------------------------------
db = Prisma()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="AI Backtesting Server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
CODE_GEN_PROMPT_STOCKS = """You are an expert quantitative analyst. When given a trading strategy description, output ONLY executable Python code — no explanations, no markdown fences, no preamble.

DATA SOURCE: STOCKS — use `yfinance` (free, no API key needed)
- Tickers: SPY, AAPL, TSLA, QQQ, etc.
- Crypto tickers in yfinance use format BTC-USD, ETH-USD, etc.

The code MUST:
1. Use `yfinance` for market data
2. Use only these libraries: yfinance, pandas, numpy, json, datetime
3. Implement the described strategy faithfully
4. End with exactly one line: `print(json.dumps(result))` where result has this schema:

{
  "success": true,
  "metrics": {
    "total_return": 0.25,
    "annual_return": 0.12,
    "sharpe_ratio": 1.4,
    "max_drawdown": -0.18,
    "win_rate": 0.55,
    "num_trades": 42,
    "profit_factor": 1.6
  },
  "equity_curve": [
    {"date": "2020-01-02", "value": 100000.0}
  ],
  "trades": [
    {"date": "2020-01-15", "action": "BUY", "ticker": "SPY", "price": 320.5, "shares": 10}
  ],
  "summary": "One-sentence description of the strategy and overall result."
}

IMPORTANT CODING RULES:
- When comparing pandas values in iterrows(), use `float(val)` or `int(val)` to convert numpy types to Python scalars
- Never use a pandas Series in a boolean context (e.g., `if series:`). Always use `.any()`, `.all()`, or convert to scalar first.
- For momentum signals, compute the signal as a column FIRST, then iterate:
  `df['signal'] = df['momentum'] > 0` then iterate with `for date, row in df.iterrows(): if float(row['signal']): ...`
- Use `try/except` to handle data errors gracefully
- All string comparisons should use `.strip()` if needed

DEFAULTS if not specified: Ticker=SPY, Start=2020-01-01, End=2024-01-01, Capital=$100,000
Equity curve: max 200 points. Trades: max 50 entries.

ERROR HANDLING: print(json.dumps({"success": False, "error": "description"}))
CRITICAL: Output ONLY raw Python. No markdown, no backticks, nothing else."""


CODE_GEN_PROMPT_CRYPTO = """You are an expert quantitative analyst. When given a trading strategy description, output ONLY executable Python code — no explanations, no markdown fences, no preamble.

DATA SOURCE: CRYPTO — use Binance public API (free, no API key needed)
- API endpoint: https://api.binance.com/api/v3/klines
- Parameters: symbol=BTCUSDT, interval=1d, startTime, endTime, limit=1000
- Returns: [[openTime, open, high, low, close, volume, ...], ...]
- Crypto symbols: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, etc.
- Use `requests` library (no API key needed for public endpoints)

The code MUST:
1. Use `requests` to fetch historical kline data from Binance API
2. Use only these libraries: requests, pandas, numpy, json, datetime
3. Implement the described strategy faithfully
4. End with exactly one line: `print(json.dumps(result))` where result has this schema:

{
  "success": true,
  "metrics": {
    "total_return": 0.25,
    "annual_return": 0.12,
    "sharpe_ratio": 1.4,
    "max_drawdown": -0.18,
    "win_rate": 0.55,
    "num_trades": 42,
    "profit_factor": 1.6
  },
  "equity_curve": [
    {"date": "2020-01-02", "value": 100000.0}
  ],
  "trades": [
    {"date": "2020-01-15", "action": "BUY", "ticker": "BTC", "price": 320.5, "shares": 0.01}
  ],
  "summary": "One-sentence description of the strategy and overall result."
}

IMPORTANT CODING RULES:
- Convert Binance timestamps (ms) to datetime: `datetime.datetime.fromtimestamp(int(openTime)/1000)`
- When comparing pandas values in iterrows(), use `float(val)` or `int(val)` to convert numpy types to Python scalars
- Never use a pandas Series in a boolean context (e.g., `if series:`). Always use `.any()`, `.all()`, or convert to scalar first.
- For momentum signals, compute the signal as a column FIRST, then iterate:
  `df['signal'] = df['momentum'] > 0` then iterate with `for date, row in df.iterrows(): if float(row['signal']): ...`
- Use `try/except` to handle data errors gracefully
- All string comparisons should use `.strip()` if needed
- Crypto amounts can be fractional (e.g., 0.001 BTC)

DEFAULTS if not specified: Symbol=BTCUSDT, Start=30 days ago, End=today, Capital=$100,000
Equity curve: max 200 points. Trades: max 50 entries.

ERROR HANDLING: print(json.dumps({"success": False, "error": "description"}))
CRITICAL: Output ONLY raw Python. No markdown, no backticks, nothing else."""


INSTRUCTIONS_PROMPT = """You are a trading signal extractor. Given a backtest Python code, analyze it and output ONLY a JSON object with actionable trading instructions.

Output exactly this JSON (no markdown, no explanation):
{
  "strategy_name": "Name of the strategy",
  "ticker": "BTCUSDT or SPY etc.",
  "data_source": "crypto or stocks",
  "parameters": {
    "lookback_period": 10,
    "oversold_threshold": 30,
    "overbought_threshold": 70
  },
  "entry_rules": [
    {"condition": "Close > SMA(50)", "action": "BUY", "description": "Buy when price crosses above 50-day SMA"}
  ],
  "exit_rules": [
    {"condition": "Close < SMA(50)", "action": "SELL", "description": "Sell when price crosses below 50-day SMA"}
  ],
  "position_sizing": {
    "type": "fixed|percent|kelly",
    "value": 1.0,
    "max_position_pct": 100,
    "description": "Use all available capital for each trade"
  },
  "risk_management": {
    "stop_loss_pct": 5.0,
    "take_profit_pct": 10.0,
    "max_drawdown_exit": 15.0,
    "trailing_stop_pct": null,
    "sell_half_at": null,
    "description": "Exit full position at 5% stop loss, 10% take profit"
  },
  "execution_notes": [
    "Check momentum signal daily at market close",
    "Enter on next day open if signal is active",
    "Monitor drawdown closely during volatile periods"
  ],
  "warnings": [
    "Backtest period was only 30 days - extend for better validation",
    "Transaction costs not included in backtest"
  ]
}

EXTRACT from the code:
1. What are the exact BUY conditions? (e.g., RSI < 30, SMA cross, etc.)
2. What are the exact SELL conditions? (e.g., RSI > 70, opposite cross, etc.)
3. What position sizing is used? (fixed shares, all-in, percent of capital?)
4. What risk management rules should be applied? (stop loss, take profit, trailing stop, sell half at X%)
5. What timeframe is used? (1d, 1h, etc.)
6. Any other important execution notes?

CRITICAL: Output ONLY the JSON object. No markdown, no backticks, nothing else."""


# Token mint addresses on Solana mainnet
SOL_MINT = "So11111111111111111111111111111111111111112"
USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap"
JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote"

# LLM prompt — keep it SHORT so the model actually returns valid JSON
SOLANA_INSTRUCTIONS_PROMPT = """You are a Solana DeFi strategist. Given a trading strategy description and its extracted trading instructions, return a JSON object with these fields:

{
  "strategy_name": "Short name",
  "ticker": "SOL/USDC",
  "direction": "long",
  "action": "buy",
  "token_in": "<SOL_or_token_mint>",
  "token_out": "<USDC_or_token_mint>",
  "amount_in_usd": 1000,
  "slippage_bps": 100,
  "entry_conditions": ["list from trading instructions"],
  "exit_conditions": ["list from trading instructions"],
  "risk_management": {
    "stop_loss_pct": 5.0,
    "take_profit_pct": 10.0,
    "max_slippage_bps": 200,
    "max_position_usd": 5000
  },
  "position_sizing": {
    "type": "fixed|percent|kelly",
    "usd_amount": 1000
  },
  "execution_bot_prompt": "One-sentence instruction for an AI trading bot...",
  "metadata": {
    "backtest_id": "<run_id>",
    "generated_at": "ISO timestamp",
    "model_used": "<model>",
    "confidence": "high",
    "backtest_metrics": {"total_return": 0.25, "sharpe_ratio": 1.4, "win_rate": 0.55, "num_trades": 42},
    "notes": ["Always test on devnet first"],
    "warnings": ["Past performance != future results"]
  }
}

Extract from the strategy: BUY/SELL conditions, risk rules, position sizing, and execution notes.
Output ONLY valid JSON. No markdown. No backticks."""


class BacktestRequest(BaseModel):
    strategy: str
    conversation: list = []
    data_source: str = "stocks"  # "stocks" or "crypto"


class BacktestResponse(BaseModel):
    id: str | None = None
    success: bool
    result: dict | None = None
    code: str | None = None
    error: str | None = None
    instructions: dict | None = None
    solana_instructions: dict | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def clean_code(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        inner = lines[1:] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).rstrip("`").strip()
    return raw


def safe_json(s: str | None) -> list | None:
    if not s:
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


def row_to_item(row) -> dict:
    return {
        "id":          row.id,
        "createdAt":   row.createdAt.isoformat(),
        "strategy":    row.strategy,
        "model":       row.model,
        "success":     row.success,
        "totalReturn": row.totalReturn,
        "sharpeRatio": row.sharpeRatio,
        "maxDrawdown": row.maxDrawdown,
        "numTrades":   row.numTrades,
        "summary":     row.summary,
        "error":       row.error,
    }


def row_to_detail(row) -> dict:
    return {
        **row_to_item(row),
        "annualReturn":       row.annualReturn,
        "winRate":            row.winRate,
        "profitFactor":       row.profitFactor,
        "code":               row.code,
        "equityCurve":        safe_json(row.equityCurve),
        "trades":             safe_json(row.trades),
        "solanaInstructions": safe_json(row.solanaInstructions),
    }


# ---------------------------------------------------------------------------
# POST /backtest  — run a new backtest and persist result
# ---------------------------------------------------------------------------
@app.post("/backtest", response_model=BacktestResponse)
async def run_backtest(req: BacktestRequest):

    # ── 1. Generate code ────────────────────────────────────────────────────
    try:
        # Select prompt based on data source
        if req.data_source == "crypto":
            system_prompt = CODE_GEN_PROMPT_CRYPTO
        else:
            system_prompt = CODE_GEN_PROMPT_STOCKS

        messages = (
            [{"role": "system", "content": system_prompt}]
            + req.conversation
            + [{"role": "user", "content": f"Generate backtest code for: {req.strategy}"}]
        )
        resp = llm.chat.completions.create(
            model=MODEL,
            max_tokens=4096,
            messages=messages,
            extra_headers=EXTRA_HEADERS,
            extra_body={"reasoning": {"enabled": False}} if "hy3-preview" in MODEL else None,
        )
        msg = resp.choices[0].message
        code_raw = msg.content if msg.content else getattr(msg, 'reasoning', '')
        code = clean_code(code_raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")

    # ── 2. Execute code ──────────────────────────────────────────────────────
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(code)
        tmp_path = f.name

    try:
        proc = subprocess.run(
            ["python3", tmp_path],
            capture_output=True, text=True, timeout=90,
        )
    except subprocess.TimeoutExpired:
        error_msg = "Backtest timed out (90s). Try a shorter date range."
        record = await db.backtestrun.create(data={
            "strategy": req.strategy, "model": MODEL,
            "success": False, "error": error_msg, "code": code,
        })
        return BacktestResponse(id=record.id, success=False, code=code, error=error_msg)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    if proc.returncode != 0:
        error_msg = proc.stderr[-2000:]
        record = await db.backtestrun.create(data={
            "strategy": req.strategy, "model": MODEL,
            "success": False, "error": error_msg, "code": code,
        })
        return BacktestResponse(id=record.id, success=False, code=code, error=error_msg)

    # ── 3. Parse stdout JSON ─────────────────────────────────────────────────
    stdout = proc.stdout.strip()
    parsed = None
    for line in reversed(stdout.splitlines()):
        try:
            parsed = json.loads(line)
            break
        except json.JSONDecodeError:
            continue

    if parsed is None or not parsed.get("success"):
        error_msg = (
            parsed.get("error", "Unknown error") if parsed
            else f"No JSON output. stdout:\n{stdout[:500]}"
        )
        record = await db.backtestrun.create(data={
            "strategy": req.strategy, "model": MODEL,
            "success": False, "error": error_msg, "code": code,
        })
        return BacktestResponse(id=record.id, success=False, code=code, error=error_msg)

    # ── 4. Persist to Prisma ─────────────────────────────────────────────────
    m = parsed.get("metrics", {})
    record = await db.backtestrun.create(data={
        "strategy":    req.strategy,
        "model":       MODEL,
        "success":     True,
        "totalReturn": m.get("total_return"),
        "annualReturn": m.get("annual_return"),
        "sharpeRatio": m.get("sharpe_ratio"),
        "maxDrawdown": m.get("max_drawdown"),
        "winRate":     m.get("win_rate"),
        "numTrades":   m.get("num_trades"),
        "profitFactor": m.get("profit_factor"),
        "summary":     parsed.get("summary"),
        "code":        code,
        "equityCurve": json.dumps(parsed.get("equity_curve", [])),
        "trades":      json.dumps(parsed.get("trades", [])),
    })

    # ── 5. Generate trading instructions ────────────────────────────────────────
    instructions = None
    try:
        instr_resp = llm.chat.completions.create(
            model=MODEL,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": INSTRUCTIONS_PROMPT},
                {"role": "user", "content": f"Extract trading instructions from this backtest code:\n\n{code}"},
            ],
            extra_headers=EXTRA_HEADERS,
            extra_body={"reasoning": {"enabled": False}} if "hy3-preview" in MODEL else None,
        )
        instr_raw = instr_resp.choices[0].message.content or getattr(instr_resp.choices[0].message, 'reasoning', '')
        instr_raw = clean_code(instr_raw)
        instructions = json.loads(instr_raw)
    except Exception as e:
        print(f"Instructions generation failed: {e}")

    # ── 6. Generate Solana transaction instructions ───────────────────────────
    solana_instructions = None
    if instructions is not None:
        try:
            sol_instr_resp = llm.chat.completions.create(
                model=MODEL,
                max_tokens=2048,
                messages=[
                    {"role": "system", "content": SOLANA_INSTRUCTIONS_PROMPT},
                    {"role": "user", "content": (
                        f"Backtest run ID: {record.id}\n"
                        f"Strategy: {req.strategy}\n"
                        f"Data source: {req.data_source}\n"
                        f"Trading instructions (extracted):\n{json.dumps(instructions, indent=2)}\n"
                        f"Backtest metrics:\n{json.dumps(parsed.get('metrics', {}), indent=2)}\n\n"
                        "Generate a Solana transaction instructions JSON that another AI agent "
                        "can use to execute this strategy on Solana via Jupiter Aggregator. "
                        "Use sensible defaults for the ticker and token addresses based on "
                        "the data source and ticker from the backtest."
                    )},
                ],
                extra_headers=EXTRA_HEADERS,
                extra_body={"reasoning": {"enabled": False}} if "hy3-preview" in MODEL else None,
            )
            sol_raw = sol_instr_resp.choices[0].message.content or getattr(sol_instr_resp.choices[0].message, 'reasoning', '')
            sol_raw = clean_code(sol_raw)
            solana_instructions = json.loads(sol_raw)
        except Exception as e:
            print(f"Solana instructions generation failed: {e}")

    # ── 7. Update record with Solana instructions ────────────────────────────
    update_data = {}
    if solana_instructions is not None:
        update_data["solanaInstructions"] = json.dumps(solana_instructions)
    if update_data:
        await db.backtestrun.update(
            where={"id": record.id},
            data=update_data,
        )

    return BacktestResponse(
        id=record.id,
        success=True,
        result=parsed,
        code=code,
        instructions=instructions,
        solana_instructions=solana_instructions,
    )


# ---------------------------------------------------------------------------
# GET /history  — list past runs, newest first
# ---------------------------------------------------------------------------
@app.get("/history")
async def get_history(skip: int = 0, take: int = 20):
    rows = await db.backtestrun.find_many(
        order={"createdAt": "desc"},
        skip=skip,
        take=take,
    )
    total = await db.backtestrun.count()
    return {"total": total, "items": [row_to_item(r) for r in rows]}


# ---------------------------------------------------------------------------
# GET /history/{id}  — full detail with equity curve + trades
# ---------------------------------------------------------------------------
@app.get("/history/{run_id}")
async def get_history_detail(run_id: str):
    row = await db.backtestrun.find_unique(where={"id": run_id})
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return row_to_detail(row)


# ---------------------------------------------------------------------------
# DELETE /history/{id}
# ---------------------------------------------------------------------------
@app.delete("/history/{run_id}")
async def delete_run(run_id: str):
    row = await db.backtestrun.find_unique(where={"id": run_id})
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    await db.backtestrun.delete(where={"id": run_id})
    return {"deleted": run_id}


# ---------------------------------------------------------------------------
# GET /history/{id}/solana-instructions  — download Solana instructions JSON
# ---------------------------------------------------------------------------
@app.get("/history/{run_id}/solana-instructions")
async def get_solana_instructions(run_id: str):
    row = await db.backtestrun.find_unique(where={"id": run_id})
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    raw = row.solanaInstructions
    if not raw:
        raise HTTPException(status_code=404, detail="No Solana instructions for this run")
    import datetime
    fname = f"solana_instructions_{run_id[:8]}_{datetime.date.today().isoformat()}.json"
    from fastapi.responses import JSONResponse
    return JSONResponse(
        content=json.loads(raw),
        headers={
            "Content-Disposition": f"attachment; filename=\"{fname}\"",
            "Content-Type": "application/json",
        },
    )


# ---------------------------------------------------------------------------
# GET /stats  — aggregate summary
# ---------------------------------------------------------------------------
@app.get("/stats")
async def get_stats():
    total   = await db.backtestrun.count()
    success = await db.backtestrun.count(where={"success": True})
    rows    = await db.backtestrun.find_many(where={"success": True})
    best    = max(rows, key=lambda r: r.sharpeRatio or -999, default=None)
    return {
        "totalRuns":    total,
        "successRuns":  success,
        "failedRuns":   total - success,
        "bestSharpe":   best.sharpeRatio if best else None,
        "bestStrategy": best.strategy    if best else None,
        "bestId":       best.id          if best else None,
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL, "provider": "openrouter"}
