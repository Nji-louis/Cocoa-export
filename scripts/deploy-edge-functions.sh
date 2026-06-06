#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") <PROJECT_REF>

Deploys all Edge Functions under supabase/functions to the given Supabase project
and sets required secrets (SERVICE_ROLE_KEY and SUPABASE_URL) using the
Supabase CLI. The script expects the following environment variables to be set:

  SUPABASE_SERVICE_ROLE_KEY  - service role key from Supabase Dashboard
  SUPABASE_URL               - project API URL, e.g. https://zsyawtkrkjvulrjhgbyn.supabase.co
  ALLOWED_ORIGINS            (optional)  - comma-separated browser origins for Edge Functions

Example:
  SUPABASE_SERVICE_ROLE_KEY="<service_key>" SUPABASE_URL="https://xyz.supabase.co" \
    ALLOWED_ORIGINS="https://nji-louis.github.io,http://localhost:5500" \
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
  if [ -z "${SERVICE_ROLE_KEY:-}" ]; then
    if [ -t 0 ]; then
      printf 'Supabase service role key: '
      read -r -s SERVICE_ROLE_KEY
      printf '\n'
    fi
    if [ -z "${SERVICE_ROLE_KEY:-}" ]; then
      echo "ERROR: SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY environment variable is required."
      exit 3
    fi
  fi
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
    case "$fn_name" in
      _*)
        echo "-> Skipping helper directory: $fn_name"
        continue
        ;;
    esac
    echo "-> Deploying function: $fn_name"
    "${SUPABASE_CMD[@]}" functions deploy "$fn_name" --project-ref "$PROJECT_REF"
  fi
done

echo "Setting secrets in Supabase project (service role key + url)"
SERVICE_ROLE_KEY_VALUE="${SERVICE_ROLE_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}"
if [ -z "$SERVICE_ROLE_KEY_VALUE" ]; then
  echo "ERROR: missing service role key value."
  exit 3
fi
SECRETS_FILE="$(mktemp /tmp/cocoabridge-supabase-secrets.XXXXXX.env)"
cat > "$SECRETS_FILE" <<EOF
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY_VALUE
SUPABASE_URL=$SUPABASE_URL
EOF
if [ -n "${ALLOWED_ORIGINS:-}" ]; then
  echo "Setting allowed origins in Supabase project"
  printf 'ALLOWED_ORIGINS=%s\n' "$ALLOWED_ORIGINS" >> "$SECRETS_FILE"
else
  echo "ALLOWED_ORIGINS not set; Edge Functions will allow all origins. Set it for production."
fi
"${SUPABASE_CMD[@]}" secrets set --env-file "$SECRETS_FILE" --project-ref "$PROJECT_REF"
rm -f "$SECRETS_FILE"

echo "Listing deployed functions:" 
"${SUPABASE_CMD[@]}" functions list --project-ref "$PROJECT_REF"

echo "Function base URL:"
echo "  https://${PROJECT_REF}.functions.supabase.co"

echo "Edge functions deployed and secrets set. Verify function behavior via scripts/test-functions.sh or Supabase dashboard."
