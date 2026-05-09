#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") <PROJECT_REF>

Deploys all Edge Functions under supabase/functions to the given Supabase project
and sets required secrets (SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL) using the
Supabase CLI. The script expects the following environment variables to be set:

  SUPABASE_SERVICE_ROLE_KEY  (required) - your Supabase service_role key
  SUPABASE_URL               (required) - https://<project>.supabase.co

Example:
  SUPABASE_SERVICE_ROLE_KEY="<service_key>" SUPABASE_URL="https://xyz.supabase.co" \
    ./scripts/deploy-edge-functions.sh your-project-ref

Requirements:
  - supabase CLI must be installed and logged in (`supabase login`), or
    available through `npx supabase` from this repository.
  - Run from the repository root that contains `supabase/functions/`.
EOF
}

if [ "${1:-}" = "" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

PROJECT_REF="$1"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
elif command -v npx >/dev/null 2>&1; then
  SUPABASE_CMD=(npx supabase)
else
  echo "ERROR: supabase CLI not found. Install from https://supabase.com/docs/guides/cli or use Node/npm."
  exit 2
fi

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required."
  exit 3
fi
if [ -z "${SUPABASE_URL:-}" ]; then
  echo "ERROR: SUPABASE_URL environment variable is required."
  exit 4
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "ERROR: functions directory not found: $FUNCTIONS_DIR"
  exit 5
fi

echo "Deploying Edge Functions from $FUNCTIONS_DIR to project $PROJECT_REF"

for fn_path in "$FUNCTIONS_DIR"/*; do
  if [ -d "$fn_path" ]; then
    fn_name=$(basename "$fn_path")
    echo "-> Deploying function: $fn_name"
    "${SUPABASE_CMD[@]}" functions deploy "$fn_name" --project-ref "$PROJECT_REF"
  fi
done

echo "Setting secrets in Supabase project (service role key + url)"
"${SUPABASE_CMD[@]}" secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" --project-ref "$PROJECT_REF"
"${SUPABASE_CMD[@]}" secrets set SUPABASE_URL="$SUPABASE_URL" --project-ref "$PROJECT_REF"

echo "Listing deployed functions:" 
"${SUPABASE_CMD[@]}" functions list --project-ref "$PROJECT_REF"

echo "Function base URL:"
echo "  https://${PROJECT_REF}.functions.supabase.co"

echo "Edge functions deployed and secrets set. Verify function behavior via scripts/test-functions.sh or Supabase dashboard."
