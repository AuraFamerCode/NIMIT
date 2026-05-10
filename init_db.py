import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "backtest.db")

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA foreign_keys=ON")
conn.execute("""
CREATE TABLE IF NOT EXISTS BacktestRun (
    id           TEXT PRIMARY KEY,
    createdAt    TEXT NOT NULL,
    updatedAt    TEXT NOT NULL,
    strategy     TEXT NOT NULL,
    model        TEXT NOT NULL,
    success      INTEGER NOT NULL,
    error        TEXT,
    totalReturn  REAL,
    annualReturn REAL,
    sharpeRatio  REAL,
    maxDrawdown  REAL,
    winRate      REAL,
    numTrades    INTEGER,
    profitFactor REAL,
    summary      TEXT,
    code         TEXT,
    equityCurve  TEXT,
    trades       TEXT
)
""")
conn.execute("CREATE INDEX IF NOT EXISTS idx_createdAt ON BacktestRun(createdAt)")
conn.execute("CREATE INDEX IF NOT EXISTS idx_success ON BacktestRun(success)")
conn.commit()
print("Database initialized successfully.")