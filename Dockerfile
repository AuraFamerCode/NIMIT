FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Dependencies ──────────────────────────────────────────
FROM base AS deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── Prisma setup ──────────────────────────────────────────
FROM deps AS prisma
COPY prisma.sh schema.prisma ./
ENV HOME=/app/.prisma-home
RUN mkdir -p $HOME && ./prisma.sh generate && ./prisma.sh db push

# ── Application ───────────────────────────────────────────
FROM prisma AS runtime
COPY . .

EXPOSE 8000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["sh", "-c", "python3 -m prisma db push && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"]