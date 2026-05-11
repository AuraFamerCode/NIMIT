# Contributing to AlgoBacktest

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-strings)
5. [Testing](#testing)
6. [Pull Request Process](#pull-request-process)
7. [Issue Reporting](#issue-reporting)

## Code of Conduct

Please be respectful and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Git

### Setup

```bash
# 1. Fork the repository
# (Do this on GitHub: click "Fork" at the top right)

# 2. Clone your fork
git clone https://github.com/<YOUR_USERNAME>/algobacktest.git
cd algobacktest

# 3. Install dependencies
make install

# 4. Set up environment
cp .env.example .env
# Edit .env and add your OpenRouter API key

# 5. Set up the database
./prisma.sh generate
./prisma.sh db push

# 6. Verify everything works
make up
```

## Development Workflow

### Git Branching

- `main` — production-ready code (protected)
- `develop` — integration branch for features
- `feature/<name>` — new feature development
- `fix/<name>` — bugfixes
- `docs/<name>` — documentation changes

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Docker Compose setup
fix: resolve CORS issue with admin endpoints
docs: update README with quick start guide
refactor: extract validators into separate module
test: add unit tests for executor
```

### Before Committing

```bash
# Format Python code
make fmt

# Lint
make lint

# Type check
make typecheck

# Run tests
make test
```

## Coding Standards

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints wherever possible
- Use `ruff` for linting (see `ruff.toml` for rules)
- Docstrings should follow Google style
- Keep functions small and focused (single responsibility)
- Prefer f-strings over `str.format()` or `%` formatting

### JavaScript / TypeScript / React

- Follow [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/)
- Use `prettier` for formatting (see `.prettierrc.json`)
- Use `eslint` for linting (see `.eslintrc.json`)
- Use React hooks consistently
- Avoid inline styles for non-dynamic values (extract to constants)

### General

- Write meaningful commit messages
- Add comments for non-obvious logic
- Don't add features beyond what's needed (YAGNI)
- Include tests for new functionality

## Testing

### Running Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests only
make test-integration
```

### Writing Tests

- Use `pytest` for Python tests
- Use `pytest-asyncio` for async tests
- Place tests in `backend/tests/` following the existing structure
- Include docstrings explaining what each test validates
- Use fixtures from `conftest.py` for shared setup

```python
# Example test structure
def test_example_feature():
    """Test that [feature] does [expected behavior]."""
    # Setup
    # Execute
    # Assert
```

### Coverage

We aim for meaningful test coverage of:
- Input validation / sanitization
- Error handling paths
- Core business logic (strategy parsing, DB operations)
- Edge cases (empty inputs, timeouts, malformed data)

## Pull Request Process

1. **Ensure all tests pass** locally
2. **Update the README** if your change affects user-facing behavior
3. **Update the CHANGELOG** with your changes
4. **Create a PR** against `develop` (not `main`)
5. **Fill out the PR template** completely
6. **Request review** from at least one maintainer

### PR Requirements

- Code compiles and tests pass
- No linting errors (or justified exceptions)
- Adequate test coverage for new code
- No sensitive data (keys, passwords) in code
- Documentation updated where relevant

### Review Process

- A maintainer will review your PR within a reasonable timeframe
- Address feedback by pushing new commits (not force-pushing)
- Once approved, the PR will be merged into `develop`
- Periodically, `develop` is merged into `main` for release

## Issue Reporting

### Bug Reports

- Check existing [issues](../../issues) first
- Use the bug report template if available
- Include: steps to reproduce, expected behavior, actual behavior, environment details

### Feature Requests

- Check existing [issues](../../issues) first
- Describe the problem the feature solves, not just the implementation
- Be open to alternative approaches

### Questions

- Use [GitHub Discussions](../../discussions) for questions
- Be specific about what you're trying to achieve
- Include relevant code snippets and error messages

## Acknowledgments

- Thanks to all contributors!
- Special thanks to early adopters and testers