#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/scripts/.env"
LOAD_ENV="$ROOT_DIR/scripts/load_env.sh"

if [ -f "$ENV_FILE" ]; then
  echo "Loading env from $ENV_FILE"
  # Load the same key/value format handled by the Node helpers.
  # shellcheck source=/dev/null
  source "$LOAD_ENV"
  load_env_file "$ENV_FILE"
else
  echo "Env file $ENV_FILE not found. Copy scripts/.env.example -> scripts/.env and fill values."
  exit 2
fi

echo "Running non-interactive CI tests..."
chmod +x "$ROOT_DIR/scripts/test-functions-ci.sh"
"$ROOT_DIR/scripts/test-functions-ci.sh"
