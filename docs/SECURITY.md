# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within AlgoBacktest, please report it responsibly.

**Preferred method:** Open a GitHub Security Advisory at [github.com/kanishcancode/algobacktest/security/advisories/new](https://github.com/kanishcancode/algobacktest/security/advisories/new)

**Alternative:** Email the maintainer at the contact listed in the repository.

You should receive a response within 7 days. If for some reason you do not, please follow up via email to ensure we received your original message.

## Supported Versions

| Version | Supported |
|---|---|
| ≥ 1.0.0 | ✅ Yes |
| < 1.0.0 | ❌ No |

## Disclosure Policy

We ask that you:

1. **Give us a reasonable amount of time** to fix the issue before any disclosure to the public or a third party.
2. **Do not exploit** the vulnerability or problem you have discovered.
3. **Do not reveal** the problem to others until it has been resolved.

We will:

1. Confirm the vulnerability and determine its impact.
2. Develop a fix and release a patch as soon as possible.
3. Publish a GitHub Security Advisory with details of the vulnerability.
4. Credit the reporter (unless they prefer to remain anonymous).

## Known Security Considerations

### Production Deployment Checklist

Before deploying to production:

- [ ] Change the default admin credentials (`admin/admin`)
- [ ] Set a strong, random `SECRET_KEY` environment variable
- [ ] Restrict `CORS_ORIGINS` to your specific domain(s)
- [ ] Use HTTPS — the app sets HSTS headers in production mode
- [ ] Use PostgreSQL instead of SQLite for data durability and access control
- [ ] Set `DEBUG=false` / `NODE_ENV=production`
- [ ] Rate limiting is enabled by default (30 req/min, burst 10) — adjust as needed
- [ ] Add authentication middleware (JWT, OAuth, etc.) for API endpoints
- [ ] Rotate the OpenRouter API key periodically

### Code Execution Sandboxing

The backtest code runs in a subprocess with:
- **90-second timeout** to prevent denial of service
- **Temporary file execution** — cleaned up after each run
- **No network access** beyond the data fetch libraries (yfinance / Binance)

⚠️ **Warning:** The subprocess is not fully sandboxed. For untrusted environments, consider:
- Running the executor in a Docker container
- Using Linux namespaces / seccomp
- Implementing a whitelist of allowed Python packages

### Data Privacy

- **API keys** (`OPENROUTER_API_KEY`, `SECRET_KEY`) are loaded from `.env` only — never committed
- **User strategies** are stored in the database in plaintext
- **Generated code** is saved with each run and displayed in the UI — users can view/download it
- The `.gitignore` file excludes `.env` and `backtest.db`

## Dependencies

This project depends on third-party packages. Keep dependencies updated to receive security patches:

```bash
pip install --upgrade -r requirements.txt
npm update
```

Periodically audit for known vulnerabilities:

```bash
# Python
pip audit
# or
safety check

# Node.js
npm audit
```