# 🧪 AlgoBacktest — AI-Powered Trading Strategy Backtester

An end-to-end platform that generates, backtests, and packages trading strategies using LLMs, historical market data, and Solana DeFi integration.

---

## 📋 Overview

**AlgoBacktest** is an AI-powered backtesting platform that takes a plain-English description of a trading strategy and:

1. **Generates** executable Python backtest code using an LLM (via OpenRouter)
2. **Runs** the backtest against real historical data (stocks via `yfinance` or crypto via Binance API)
3. **Displays** results with interactive charts, performance metrics, and trade logs
4. **Extracts** actionable trading instructions from the backtest code
5. **Generates** Solana transaction instructions (via Jupiter Aggregator) for on-chain execution

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend                              │
│  React + Vite (port 3000)                                │
│  ├── Strategy input & chat UI                            │
│  ├── Equity curve charts (Recharts)                      │
│  ├── Trading instructions display                        │
│  ├── Solana execution instructions                       │
│  └── Admin dashboard (history, stats, delete)            │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────┐
│                     Backend                               │
│  FastAPI + Uvicorn (port 8000)                           │
│  ├── /backtest        — Generate, run, store backtest    │
│  ├── /history         — List past runs                   │
│  ├── /history/{id}    — Full run details                 │
│  ├── /history/{id}/   │                                  │
│  │   solana-instructions — Download Solana JSON          │
│  ├── /stats           — Aggregate statistics             │
│  └── /health          — Health check                     │
│                                                          │
│  LLM Pipeline (OpenRouter):                              │
│  1. Code generation prompt (strategy → Python code)      │
│  2. Code execution (sandboxed subprocess, 90s timeout)   │
│  3. Instruction extraction (code → trading instructions)  │
│  4. Solana instructions (instructions → Solana tx JSON)  │
│                                                          │
│  Database: SQLite via Prisma ORM                         │
│  └── BacktestRun model (strategy, metrics, code, etc.)   │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend & Prisma)
- **Python** 3.10+ (for backend)
- **OpenRouter API key** — get one at [openrouter.ai](https://openrouter.ai)

### Installation

**1. Clone the repository**

```bash
git clone <repo-url>
cd backtest2
```

**2. Set up environment variables**

```bash
cp .env.example .env  # or create .env manually
```

Edit `.env`:

```env
DATABASE_URL=file:./backtest.db
OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY_HERE
MODEL=moonshotai/kimi-k2.6   # or any OpenRouter model
YOUR_SITE_URL=http://localhost:3000
YOUR_SITE_NAME=AI Backtester
```

> ⚠️ **Never commit your `OPENROUTER_API_KEY` to version control.** The `.env` file is already in `.gitignore`.

**3. Install Python dependencies**

```bash
pip install -r requirements.txt
```

**4. Set up the database**

```bash
# Option A: Use the init script (quick)
python init_db.py

# Option B: Use Prisma (recommended for full schema management)
npx prisma generate
npx prisma db push
```

**5. Install Node.js dependencies**

```bash
npm install
```

### Running the Application

**In separate terminals:**

```bash
# Terminal 1 — Start the backend (FastAPI)
uvicorn main:app --reload --port 8000

# Terminal 2 — Start the frontend (Vite + React)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 How It Works

### 1. Describe a Strategy

Enter a plain-English trading strategy in the chat input. Examples:

| Asset Class | Example Strategy |
|---|---|
| **Stocks** | "SMA 50/200 golden cross on SPY 2019–2024" |
| **Stocks** | "RSI(14) mean reversion on AAPL: buy below 30, sell above 70" |
| **Crypto** | "Momentum strategy on BTC-USD past 30 days" |
| **Crypto** | "Bollinger Band squeeze on SOL-USD 2024–2025" |

Toggle between **Stocks** and **Crypto** using the top-right switch.

### 2. AI Code Generation

The backend sends your strategy to an LLM via OpenRouter with a detailed system prompt that:
- Generates executable Python code using `yfinance` (stocks) or Binance API (crypto)
- Enforces strict coding rules (pandas type safety, error handling, etc.)
- Outputs backtest results as JSON including metrics, equity curve, and trade log

### 3. Sandboxed Execution

The generated code runs in a sandboxed temporary file with:
- **90-second timeout** to prevent infinite loops
- **Isolated subprocess** — no network access beyond data fetching
- **Automatic cleanup** — temp files are deleted after execution

### 4. Results Display

Successful backtests display:
- **📊 Key Metrics** — Total return, annual return, Sharpe ratio, max drawdown, win rate, profit factor
- **📈 Equity Curve** — Interactive line chart showing portfolio value over time
- **📝 Trading Instructions** — Extracted entry/exit rules, position sizing, and risk management
- **🟣 Solana Instructions** — Ready-to-use JSON for executing the strategy on Solana via Jupiter Aggregator
- **💻 Generated Code** — View/hide the full backtest Python source

### 5. Persistence

All backtest runs are saved to a SQLite database (`backtest.db`) via Prisma ORM. Results persist across server restarts.

---

## 🗄️ Database Schema

The `BacktestRun` table stores:

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Unique run identifier |
| `createdAt` | DateTime | When the run was created |
| `strategy` | String | User's strategy description |
| `model` | String | LLM model used |
| `success` | Boolean | Whether the backtest succeeded |
| `error` | String? | Error message (if failed) |
| `totalReturn` | Float? | Total portfolio return |
| `annualReturn` | Float? | Annualized return |
| `sharpeRatio` | Float? | Risk-adjusted return metric |
| `maxDrawdown` | Float? | Maximum peak-to-trough loss |
| `winRate` | Float? | Percentage of winning trades |
| `numTrades` | Int? | Number of trades executed |
| `profitFactor` | Float? | Ratio of gross profit to gross loss |
| `summary` | String? | LLM-generated summary |
| `code` | String? | Generated Python backtest code |
| `equityCurve` | String (JSON) | Portfolio value over time |
| `trades` | String (JSON) | Individual trade log |
| `solanaInstructions` | String (JSON) | Solana transaction payload |

---

## 🔐 Admin Panel

Access the admin dashboard by clicking the **Admin** button (top-right) and logging in with:

```
Username: admin
Password: admin
```

> ⚠️ Change these credentials in production! See the [Security](#-security) section.

The admin panel provides:
- **All Runs** table with view, download, and delete capabilities
- **Statistics** overview (total runs, success rate, best Sharpe ratio)
- **Delete All** button to wipe the database

---

## 🔗 API Reference

### `POST /backtest`

Run a new backtest.

```json
{
  "strategy": "RSI mean reversion on QQQ 2020-2024",
  "data_source": "stocks"
}
```

**Response:** `BacktestResponse` with `id`, `success`, `result`, `code`, `instructions`, `solana_instructions`

### `GET /history?skip=0&take=20`

List past backtest runs (newest first).

### `GET /history/{run_id}`

Get full details for a specific run.

### `DELETE /history/{run_id}`

Delete a backtest run.

### `GET /history/{run_id}/solana-instructions`

Download Solana transaction instructions as JSON.

### `GET /stats`

Get aggregate statistics.

### `GET /health`

Health check endpoint.

---

## 📁 Project Structure

```
.
├── main.py              # FastAPI backend (server + LLM pipeline)
├── init_db.py           # SQLite database initialization script
├── schema.prisma        # Prisma ORM schema
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies & scripts
├── vite.config.js       # Vite configuration
├── index.html           # HTML entry point
├── main.jsx             # React entry point
├── App.jsx              # Main React application (all components)
├── .env                 # Environment variables (gitignored)
├── .gitignore
├── backtest.db          # SQLite database (auto-generated)
├── dist/                # Production build output
└── node_modules/        # Node.js dependencies (auto-generated)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts |
| **Backend** | FastAPI, Uvicorn |
| **Database** | SQLite + Prisma ORM |
| **LLM** | OpenRouter (configurable model) |
| **Data** | `yfinance` (stocks), Binance API (crypto) |
| **Execution** | Python `subprocess` (sandboxed) |
| **Styling** | Inline CSS (dark theme, no CSS files) |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | _(required)_ | API key for OpenRouter LLM access |
| `DATABASE_URL` | `file:./backtest.db` | SQLite database path |
| `MODEL` | `moonshotai/kimi-k2.6` | OpenRouter model identifier |
| `YOUR_SITE_URL` | `http://localhost:3000` | Referer header for OpenRouter |
| `YOUR_SITE_NAME` | `AI Backtester` | Title header for OpenRouter |

### Vite Config

The frontend runs on port **3000** and proxies `/api` requests to the backend at `http://localhost:8000`.

---

## 🔒 Security

**Important notes for production deployment:**

- **Admin credentials** are hardcoded (`admin/admin`) — use environment variables or a proper auth system
- **CORS** is set to `allow_origins: ["*"]` — restrict to your domain in production
- **Code execution** uses `subprocess` with a timeout but no containerization — consider Docker sandboxing
- **API key** is loaded from `.env` — never expose it in client-side code
- The SQLite database is stored locally — use PostgreSQL for production

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add authentication/authorization for the API
- [ ] Support PostgreSQL for production databases
- [ ] Add Docker containerization
- [ ] Implement streaming responses for long-running backtests
- [ ] Add paper trading integration with Solana
- [ ] Improve error handling and user feedback
- [ ] Add unit tests for the backend pipeline

---

## 📝 License

This project is open source. See the LICENSE file for details.

---

*Built with FastAPI, React, Prisma, OpenRouter, and a lot of AI magic.* 🚀