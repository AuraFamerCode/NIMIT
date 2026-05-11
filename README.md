# 🧪 AI Backtester — AI-Powered Trading Strategy Backtester

A modern, end-to-end platform that generates, backtests, and analyzes trading strategies using advanced AI models, historical market data, and natural language processing.

![Status](https://img.shields.io/badge/status-active-success)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Overview

**AI Backtester** is an intelligent backtesting platform that transforms plain-English trading strategy descriptions into executable backtests with detailed performance analytics.

### Key Capabilities

1. **🤖 AI Code Generation**: Converts natural language strategies into executable Python backtest code using state-of-the-art LLMs via OpenRouter
2. **📊 Real-Time Execution**: Runs backtests against real historical data (stocks via `yfinance` or crypto via Binance API)
3. **📈 Interactive Visualization**: Displays results with equity curves, performance metrics, and detailed trade logs
4. **💡 Strategy Extraction**: Automatically extracts actionable trading rules from generated code
5. **🔗 Solana Integration**: Generates Solana transaction instructions via Jupiter Aggregator for on-chain execution
6. **💾 Persistent Storage**: All backtest history saved to SQLite database for future reference

---

## ✨ Features

- **Natural Language Interface**: Describe strategies in plain English—no coding required
- **Multi-Asset Support**: Trade stocks (NYSE, NASDAQ) and cryptocurrencies (BTC, ETH, SOL, etc.)
- **Comprehensive Metrics**: Win rate, profit factor, Sharpe ratio, max drawdown, total return
- **Interactive Charts**: Beautiful equity curve visualizations with Recharts
- **Chat-Based UI**: Conversational interface for seamless interaction
- **Admin Dashboard**: Monitor system usage, view all runs, manage history
- **Modern Dark Theme**: Sleek UI with gradients, glassmorphism, and smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend                              │
│  React 18 + Vite (port 3000)                             │
│  ├── Strategy input & chat UI                            │
│  ├── Equity curve charts (Recharts)                      │
│  ├── Performance metrics dashboard                       │
│  ├── Trading instructions display                        │
│  ├── Solana execution instructions                       │
│  └── Admin panel (history, stats, delete)                │
└──────────────────────────┬───────────────────────────────┘
                           │ REST API
┌──────────────────────────▼───────────────────────────────┐
│                     Backend                               │
│  FastAPI + Uvicorn (port 8000)                           │
│  ├── POST /backtest        — Generate & run backtest     │
│  ├── GET  /history         — List past runs              │
│  ├── GET  /history/{id}    — Full run details            │
│  ├── DELETE /history/{id}  — Delete a run                │
│  ├── GET  /stats           — Aggregate statistics        │
│  └── GET  /health          — Health check                │
│                                                          │
│  AI Pipeline (OpenRouter):                               │
│  1. Code generation (strategy → Python code)             │
│  2. Sandboxed execution (90s timeout)                    │
│  3. Instruction extraction (code → trading rules)        │
│  4. Solana integration (rules → Jupiter tx JSON)         │
│                                                          │
│  Database: SQLite via Prisma ORM                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend & Prisma)
- **Python** 3.10+ (for backend)
- **OpenRouter API Key** — Get one at [openrouter.ai](https://openrouter.ai)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-backtester
```

#### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=file:./backtest.db
OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY_HERE
NODE_ENV=development
MODEL=inclusionai/ring-2.6-1t:free
YOUR_SITE_URL=http://localhost:3000
YOUR_SITE_NAME=AI Backtester
```

> ⚠️ **Security Note**: Never commit your `OPENROUTER_API_KEY` to version control. The `.env` file is already in `.gitignore`.

#### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Required packages include: `fastapi`, `uvicorn`, `prisma`, `yfinance`, `pandas`, `numpy`, and more.

#### 4. Initialize the Database

```bash
# Option A: Quick initialization
python init_db.py

# Option B: Full Prisma setup (recommended)
npx prisma generate
npx prisma db push
```

#### 5. Install Node.js Dependencies

```bash
npm install
```

### Running the Application

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (FastAPI)
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (Vite + React)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧩 How It Works

### Step 1: Describe Your Strategy

Enter a trading strategy in natural language. Examples:

| Asset Class | Example Strategy |
|-------------|------------------|
| **Stocks** | "SMA 50/200 golden cross on SPY from 2019 to 2024" |
| **Stocks** | "RSI(14) mean reversion on AAPL: buy below 30, sell above 70" |
| **Crypto** | "Momentum strategy on BTC-USD for the past 30 days" |
| **Crypto** | "Bollinger Band squeeze breakout on SOL-USD 2024–2025" |

Toggle between **Stocks** and **Crypto** using the switch in the top-right corner.

### Step 2: AI Code Generation

The backend sends your strategy to an LLM via OpenRouter with a detailed system prompt that:
- Generates executable Python code using `yfinance` (stocks) or Binance API (crypto)
- Enforces strict coding standards (type safety, error handling, vectorized operations)
- Outputs structured JSON with metrics, equity curve, and trade log

### Step 3: Sandboxed Execution

Generated code runs in an isolated subprocess with:
- **90-second timeout** to prevent infinite loops
- **Restricted permissions** for security
- **Automatic cleanup** of temporary files

### Step 4: View Results

Successful backtests display:

- **📊 Key Metrics Card**: Total return, annual return, Sharpe ratio, max drawdown, win rate, profit factor
- **📈 Equity Curve**: Interactive line chart showing portfolio growth over time
- **📝 Trading Instructions**: Extracted entry/exit rules, position sizing, risk management
- **🟣 Solana Instructions**: Ready-to-execute JSON for Solana transactions via Jupiter
- **💻 Generated Code**: Toggle to view/hide the full Python source

### Step 5: Save & Review

All runs are automatically saved to `backtest.db`. Access history anytime via the Admin panel.

---

## 🗄️ Database Schema

The `BacktestRun` model stores comprehensive data:

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique run identifier |
| `createdAt` | DateTime | Timestamp of execution |
| `strategy` | String | User's strategy description |
| `model` | String | LLM model used |
| `success` | Boolean | Execution status |
| `error` | String? | Error message (if failed) |
| `totalReturn` | Float? | Total portfolio return (%) |
| `annualReturn` | Float? | Annualized return (%) |
| `sharpeRatio` | Float? | Risk-adjusted return metric |
| `maxDrawdown` | Float? | Maximum peak-to-trough loss (%) |
| `winRate` | Float? | Percentage of winning trades |
| `numTrades` | Int? | Total number of trades |
| `profitFactor` | Float? | Gross profit / gross loss ratio |
| `summary` | String? | AI-generated strategy summary |
| `code` | String? | Generated Python backtest code |
| `equityCurve` | JSON | Portfolio value over time |
| `trades` | JSON | Individual trade log |
| `solanaInstructions` | JSON | Solana transaction payload |

---

## 🔐 Admin Panel

Access the admin dashboard by clicking the **Admin** button (top-right) and logging in:

```
Username: admin
Password: admin
```

> ⚠️ **Production Warning**: Change these default credentials before deploying! See the [Security](#-security) section.

### Admin Features

- **📜 All Runs Table**: View, download, and delete past backtests
- **📊 Statistics Overview**: Total runs, success rate, best/worst performers
- **🗑️ Bulk Operations**: Delete all history with one click
- **📥 Export Data**: Download Solana instructions as JSON files

---

## 🔗 API Reference

### `POST /backtest`

Execute a new backtest.

**Request:**
```json
{
  "strategy": "RSI mean reversion on QQQ 2020-2024",
  "data_source": "stocks"
}
```

**Response:** `BacktestResponse` with `id`, `success`, `result`, `code`, `instructions`, `solana_instructions`

---

### `GET /history?skip=0&take=20`

List past backtest runs (newest first).

**Query Parameters:**
- `skip`: Number of records to skip (pagination)
- `take`: Number of records to return

---

### `GET /history/{run_id}`

Get complete details for a specific backtest run.

---

### `DELETE /history/{run_id}`

Delete a specific backtest run from the database.

---

### `GET /history/{run_id}/solana-instructions`

Download Solana transaction instructions as a JSON file.

---

### `GET /stats`

Get aggregate statistics across all backtests.

**Response:**
```json
{
  "totalRuns": 42,
  "successfulRuns": 38,
  "averageWinRate": 64.5,
  "bestSharpeRatio": 2.34
}
```

---

### `GET /health`

Health check endpoint for monitoring.

---

## 📁 Project Structure

```
ai-backtester/
├── main.py                 # FastAPI backend (server + LLM pipeline)
├── init_db.py              # SQLite database initialization
├── schema.prisma           # Prisma ORM schema definition
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies & scripts
├── vite.config.js          # Vite bundler configuration
├── index.html              # HTML entry point
├── main.jsx                # React application entry
├── App.jsx                 # Main React component (all UI logic)
├── .env                    # Environment variables (gitignored)
├── .gitignore              # Git ignore rules
├── backtest.db             # SQLite database (auto-generated)
├── dist/                   # Production build output
├── node_modules/           # Node.js dependencies
└── README.md               # This documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Recharts |
| **Backend** | FastAPI, Uvicorn |
| **Database** | SQLite + Prisma ORM |
| **AI/LLM** | OpenRouter (configurable models) |
| **Market Data** | `yfinance` (stocks), Binance API (crypto) |
| **Execution** | Python `subprocess` (sandboxed) |
| **Styling** | Inline CSS with Tailwind-inspired dark theme |
| **Icons** | Lucide React |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `OPENROUTER_API_KEY` | — | ✅ | API key for OpenRouter LLM access |
| `DATABASE_URL` | `file:./backtest.db` | ❌ | SQLite database connection string |
| `MODEL` | `inclusionai/ring-2.6-1t:free` | ❌ | OpenRouter model identifier |
| `NODE_ENV` | `development` | ❌ | Environment mode (development/production) |
| `YOUR_SITE_URL` | `http://localhost:3000` | ❌ | Frontend URL for CORS and links |
| `YOUR_SITE_NAME` | `AI Backtester` | ❌ | Application name for branding |

### Model Configuration

You can change the AI model by updating the `MODEL` environment variable. Popular options:

- `inclusionai/ring-2.6-1t:free` (default, free tier)
- `meta-llama/llama-3-70b-instruct`
- `mistralai/mistral-large`
- `anthropic/claude-3-haiku`

Visit [OpenRouter Models](https://openrouter.ai/models) for the full list.

---

## 🧪 Example Strategies

Try these examples to get started:

### Stocks
```
Test a dual moving average crossover strategy on SPY using 50-day and 200-day SMAs from 2020 to 2024.
Buy when the 50-day crosses above the 200-day, sell when it crosses below.
```

### Crypto
```
Backtest an RSI mean reversion strategy on BTC-USD for the last 90 days.
Buy when RSI(14) drops below 30, sell when it rises above 70.
Initial capital: $10,000.
```

### Advanced
```
Implement a Bollinger Band squeeze breakout strategy on QQQ from 2019 to 2024.
Enter long when price breaks above the upper band after a period of low volatility (bandwidth < 5%).
Exit when price crosses below the middle band (20-day SMA).
Use 2% position sizing and stop loss at 5%.
```

---

## 🔒 Security

### Best Practices

1. **Never commit `.env`**: The file is in `.gitignore` by default.
2. **Change admin credentials**: Before deploying to production, update the hardcoded admin login in `App.jsx`.
3. **Rate limiting**: Consider adding rate limiting to the `/backtest` endpoint in production.
4. **Input sanitization**: All user inputs are sanitized before being sent to the LLM.
5. **Sandboxed execution**: Generated code runs in a restricted subprocess with a 90-second timeout.

### Production Deployment

For production use:

1. Set `NODE_ENV=production`
2. Use a strong database password if switching to PostgreSQL
3. Enable HTTPS on your frontend
4. Add authentication middleware
5. Configure CORS properly for your domain
6. Set up monitoring and logging (e.g., Sentry, LogRocket)

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'prisma'`
- **Solution**: Run `pip install -r requirements.txt` and then `npx prisma generate`

**Issue**: Backend returns 500 error on backtest
- **Solution**: Check that `OPENROUTER_API_KEY` is valid and has sufficient credits

**Issue**: Frontend shows "Failed to connect to backend"
- **Solution**: Ensure the backend is running on port 8000 and check CORS settings in `main.py`

**Issue**: Database locked error
- **Solution**: Close any other processes using `backtest.db` or delete the file to reset

**Issue**: Backtest times out after 90 seconds
- **Solution**: Simplify your strategy or reduce the date range. Complex strategies may require more optimization.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a **Pull Request**

### Development Setup

```bash
# Install dev dependencies
npm install --save-dev

# Run linter
npm run lint

# Build for production
npm run build

# Test production build locally
npm run preview
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[OpenRouter](https://openrouter.ai/)** — Providing access to multiple LLM providers through a unified API
- **[yfinance](https://github.com/ranaroussi/yfinance)** — Reliable market data for stocks and ETFs
- **[Binance API](https://binance-docs.github.io/apidocs/spot/en/)** — Cryptocurrency market data
- **[FastAPI](https://fastapi.tiangolo.com/)** — Modern, fast Python web framework
- **[Prisma](https://www.prisma.io/)** — Type-safe database ORM
- **[Recharts](https://recharts.org/)** — Beautiful charting library for React
- **[Vite](https://vitejs.dev/)** — Next-generation frontend build tool

---

## 📞 Support & Community

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/yourusername/ai-backtester/issues)
- **Discussions**: Join conversations about strategies and improvements
- **Email**: For business inquiries, contact support@aibacktester.com

---

<div align="center">

**Built with ❤️ using React, FastAPI, and AI**

[⬆ Back to Top](#-ai-backtester--ai-powered-trading-strategy-backtester)

</div>