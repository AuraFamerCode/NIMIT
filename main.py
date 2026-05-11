#!/usr/bin/env python3
"""
AlgoBacktest — Professional entry point.

This is a thin shim that launches the modular backend.
Run: uvicorn main:app --reload --port 8000

This file imports and mounts the full application from backend.app.main.
"""

import sys
import os

# Ensure the project root is on the Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Re-export the app from the modular backend
from backend.app.main import app  # noqa: E402, F401