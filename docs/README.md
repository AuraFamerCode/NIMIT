# AlgoBacktest

An **AI-powered trading strategy platform** that generates, backtests, and packages strategies for stocks and crypto — with Solana DeFi execution support.

![CI](https://github.com/kanishcancode/algobacktest/workflows/CI/badge.svg)

## Quick Start

```bash
# 1. Install dependencies
make install

# 2. Set environment variables
cp .env.example .env   # Edit with your OpenRouter API key

# 3. Start the server
make up

# 4. Open in browser
open http://localhost:3000
```

## Features

- 🤖 **AI Strategy Generation** — Describe strategies in plain English; LLM generates executable backtest code
- 📊 **Stock & Crypto Backtesting** — Supports `yfinance` (stocks) and Binance API (crypto)
- 🧪 **Sandboxed Execution** — Code runs in isolated subprocesses with timeouts and cleanup
- 📈 **Performance Metrics** — Total return, Sharpe ratio, max drawdown, win rate, profit factor
- 🟣 **Solana Integration** — Auto-generates Jupiter Aggregator transaction instructions
- 🔐 **Security First** — Rate limiting, CORS, input validation, security headers
- 📋 **History & Admin** — Track all runs, export Solana instructions, manage via dashboard

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  React       │────▶│  FastAPI      │────▶│  LLM (Open   │
│  Frontend    │◀────│  Backend      │◀────│  Router)     │
│  (port 3000) │     │  (port 8000)  │     └──────────────┘
└─────────────┘     └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   SQLite DB   │
                    │  (Prisma ORM) │
                    └──────────────┘
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── config.py            # Pydantic settings
│   │   ├── prompts.py           # LLM prompt templates
│   │   ├── llm_client.py        # OpenAI client wrapper
│   │   ├── errors.py            # Exceptions + handlers
│   │   ├── utils/
│   │   │   ├── validators.py    # Input validation & sanitization
│   │   │   └── executor.py      # Sandboxed code execution
│   │   ├── services/
│   │   │   └── db_service.py    # Prisma ORM service layer
│   │   ├── middleware/
│   │   │   ├── security.py      # CORS + security headers
│   │   │   └── rate_limiter.py  # In-memory rate limiting
│   │   └── routes/
│   │       ├── backtest.py      # POST /backtest
│   │       ├── history.py       # GET/DELETE /history
│   │       └── admin.py         # Admin endpoints
│   └── tests/
│       ├── conftest.py          # Shared fixtures
│       ├── unit/
│       └── integration/
├── frontend/                    # React + Vite (see README for details)
├── docs/                        # User & developer docs
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── schema.prisma                # Database schema
├── prisma.sh                    # Prisma wrapper script
├── requirements.txt
├── package.json
├── ruff.toml                    # Python linter config
├── .prettierrc.json             # JS formatter config
└── .github/workflows/ci.yml     # CI pipeline
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | — | OpenRouter API key for LLM access |
| `DATABASE_URL` | ✅ | `sqlite:///./backtest.db` | Database connection string |
| `MODEL` | ❌ | `moonshotai/kimi-k2.6` | OpenRouter LLM model |
| `YOUR_SITE_URL` | ❌ | `http://localhost:3000` | Referer for OpenRouter billing |
| `YOUR_SITE_NAME` | ❌ | `AI Backtester` | Title for OpenRouter billing |
| `SECRET_KEY` | ❌ | `change-me` | Auth secret (change for production!) |

See [.env.example](.env.example) for a complete template.

## API Reference

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/backtest` | Generate + run a new backtest |
| `GET` | `/api/v1/history` | List all backtest runs |
| `GET` | `/api/v1/history/{id}` | Get full details for a run |
| `DELETE` | `/api/v1/history/{id}` | Delete a run |
| `GET` | `/api/v1/history/{id}/solana-instructions` | Download Solana tx JSON |
| `GET` | `/api/v1/stats` | Platform-wide statistics |
| `GET` | `/health` | Health check (no prefix) |

## Docker

```bash
# Build and start
make docker-up

# Or with Docker Compose directly
docker-compose up -d --build
```

## Running Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests only
make test-integration
```

## Security

See [SECURITY.md](./SECURITY.md) for security policies and responsible disclosure guidelines.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

Open source — see LICENSE file for details.

---

*Built with FastAPI, React, Prisma, OpenRouter, and a lot of AI magic.* 🚀