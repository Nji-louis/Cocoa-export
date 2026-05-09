#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") [DATABASE_URL]

Runs the migrations and RLS policy SQL files against a Postgres database using psql.

Provide the connection string either as the first argument or via the DATABASE_URL environment variable.

Example:
  DATABASE_URL="postgresql://user:pass@host:5432/db" $(basename "$0")
  or
  $(basename "$0") "postgresql://user:pass@host:5432/db"
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

DB_URL="${1:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not provided. Pass as first arg or set DATABASE_URL env var."
  usage
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/supabase/migrations/20260505120000_create_profiles_inquiries.sql"
RLS_FILE="$ROOT_DIR/supabase/policies/rls_examples.sql"

for f in "$MIGRATION_FILE" "$RLS_FILE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: required file not found: $f"
    exit 3
  fi
done

echo "Applying migration: $MIGRATION_FILE"
psql "$DB_URL" -f "$MIGRATION_FILE"

echo "Applying RLS policies: $RLS_FILE"
psql "$DB_URL" -f "$RLS_FILE"

echo "Migrations and RLS policies applied successfully."
