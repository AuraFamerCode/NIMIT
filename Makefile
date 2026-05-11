#!/usr/bin/env bash
# Makefile for AlgoBacktest
# Run: make <target>

.PHONY: help install up down build test lint fmt clean migrate seed logs restart

PROJECT_NAME := algobacktest
PYTHON := python3
NPM := npm
DOCKER_COMPOSE := docker compose

# ── Default ────────────────────────────────────────────────
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Backend Setup ──────────────────────────────────────────
install: ## Install all dependencies (Python + Node)
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt
	$(NPM) install

# ── Database ───────────────────────────────────────────────
migrate: ## Run Prisma migrations
	./prisma.sh generate
	./prisma.sh db push

seed: ## Seed database with sample data
	$(PYTHON) -c "from init_db import *"
	@echo "Database seeded"

reset-db: ## Reset database (destructive!)
	rm -f backtest.db backtest.db-shm backtest.db-wal
	@echo "Database reset"

# ── Server ─────────────────────────────────────────────────
up: ## Start backend with hot-reload
	uvicorn app.main:app --reload --port 8000

up-frontend: ## Start Vue dev server
	cd .. && $(NPM) run dev

up-all: ## Start both backend and frontend
	$(MAKE) up &
	sleep 2 && $(MAKE) up-frontend

down: ## Stop all services
	@echo "Backend runs in foreground — Ctrl+C to stop"

restart: down up ## Restart backend

logs: ## Tail application logs
	@echo "Backend runs in foreground — logs shown in terminal"

# ── Testing ────────────────────────────────────────────────
test: ## Run all tests
	$(PYTHON) -m pytest backend/tests/ -v --tb=short

test-unit: ## Run unit tests only
	$(PYTHON) -m pytest backend/tests/unit/ -v --tb=short

test-integration: ## Run integration tests
	$(PYTHON) -m pytest backend/tests/integration/ -v --tb=short

# ── Code Quality ───────────────────────────────────────────
lint: ## Lint Python code
	ruff check backend/
	eslint frontend/

fmt: ## Format Python code
	ruff format backend/
	prettier --write frontend/

fmt-check: ## Check formatting without modifying
	ruff format --check backend/
	prettier --check frontend/

typecheck: ## Type-check Python code
	mypy backend/ --ignore-missing-imports

# ── Frontend ───────────────────────────────────────────────
build: ## Build frontend for production
	$(NPM) run build

preview: ## Preview production build
	$(NPM) run preview

# ── Docker ─────────────────────────────────────────────────
docker-build: ## Build Docker image
	docker build -t $(PROJECT_NAME) .

docker-up: ## Start with Docker Compose
	$(DOCKER_COMPOSE) up -d --build

docker-down: ## Stop Docker Compose
	$(DOCKER_COMPOSE) down

docker-logs: ## View Docker logs
	$(DOCKER_COMPOSE) logs -f

# ── Cleanup ────────────────────────────────────────────────
clean: ## Remove build artifacts and caches
	rm -rf dist/ node_modules/ __pycache__/ .pytest_cache/ .mypy_cache/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
	find . -type f -name "*.pyc" -delete
	@echo "Cleaned"