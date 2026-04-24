#!/bin/sh
set -eu

if [ ! -f package.json ]; then
  echo "package.json not found in /app"
  exit 1
fi

if [ ! -d node_modules/.pnpm ] || [ "${FORCE_PNPM_INSTALL:-0}" = "1" ]; then
  echo "Installing dependencies with pnpm..."
  pnpm install --no-frozen-lockfile
fi

exec "$@"
