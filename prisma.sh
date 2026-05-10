#!/bin/bash
# Wrapper script to run prisma commands with proper cache directory
# Usage: ./prisma.sh <command> [args...]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export HOME="$SCRIPT_DIR/.prisma-home"
mkdir -p "$HOME/.cache"

python3 -m prisma "$@"
