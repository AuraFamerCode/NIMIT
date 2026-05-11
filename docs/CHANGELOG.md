# Changelog

All notable changes to this project are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 🏗️ Full project restructuring into modular Python backend
- 🔒 Security middleware: CORS, rate limiting, security headers
- 📝 Input validation and sanitization for all user inputs
- 🧪 Unit and integration test suite with pytest
- 📦 Dockerfile and docker-compose for containerized deployment
- 🔧 Makefile for common development tasks
- 📊 CI/CD pipeline (GitHub Actions)
- 📄 Professional documentation: README, SECURITY, CONTRIBUTING
- 🎨 Frontend dark theme with Tailwind-inspired inline styles
- 🌐 Admin dashboard for managing backtest runs
- 📎 Solana instruction generation with Jupiter Aggregator support
- 📡 Request ID tracking for debugging
- 📋 Structured JSON logging (production) / colored console logging (dev)

### Changed
- Refactored monolith `main.py` into modular package structure
- Pydantic v2 settings management with environment variable loading
- Improved error handling with custom exception hierarchy
- Enhanced API with proper HTTP status codes and response schemas
- Rate limiting: 30 requests/minute per IP (10 burst)

### Fixed
- Temp file cleanup guaranteed even on execution errors
- JSON parsing robustly handles multi-line stdout output
- CORS properly configured for development and production

### Deprecated
- Old monolithic `main.py` (now `backend/app/main.py`)

## [1.0.0] — 2026-05-11

### Initial Release
- AI-powered trading strategy backtester
- Supports stocks (via yfinance) and crypto (via Binance API)
- LLM-generated backtest code execution in sandbox
- Auto-extraction of trading instructions
- Solana DeFi transaction instruction generation
- React frontend with dark theme
- SQLite + Prisma ORM for persistence
- OpenRouter integration for LLM access