#!/usr/bin/env bash
set -euo pipefail

# Non-interactive tester for Supabase Edge Functions
# Usage (env vars):
# SUPABASE_URL, ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD are required
# Optional: FUNC_BASE (functions base URL), INQUIRY_ID (to test update-inquiry-status)

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${ANON_KEY:-}" ] || [ -z "${ADMIN_EMAIL:-}" ] || [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "Required environment variables: SUPABASE_URL, ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD" >&2
  echo "Optional: FUNC_BASE, INQUIRY_ID" >&2
  exit 2
fi

FUNC_BASE=${FUNC_BASE:-}
if [ -z "$FUNC_BASE" ]; then
  if [[ "$SUPABASE_URL" =~ \.supabase\.co$ ]]; then
    FUNC_BASE="${SUPABASE_URL/\.supabase\.co/.functions.supabase.co}"
  else
    echo "FUNC_BASE not provided and SUPABASE_URL isn't a supabase.co domain. Set FUNC_BASE." >&2
    exit 2
  fi
fi

PARSE_TOKEN(){
  local json="$1"
  if command -v jq >/dev/null 2>&1; then
    echo "$json" | jq -r '.access_token // .data.access_token // .access_token'
  else
    if command -v python3 >/dev/null 2>&1; then
      echo "$json" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('access_token') or d.get('data',{}).get('access_token') or d.get('access_token',''))"
    else
      echo ""
    fi
  fi
}

echo "Requesting access token for $ADMIN_EMAIL"
TOKEN_RESP=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
ACCESS_TOKEN=$(PARSE_TOKEN "$TOKEN_RESP")
if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to obtain access token" >&2
  echo "$TOKEN_RESP" >&2
  exit 1
fi

echo "Access token obtained"

INVITE_TEST_EMAIL="ci-invite-$(date +%s)@example.com"
echo "Calling invite-user for $INVITE_TEST_EMAIL"
curl -s -X POST "$FUNC_BASE/invite-user" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"$INVITE_TEST_EMAIL\",\"role\":\"buyer\"}" -o /tmp/ci_invite.json || true
cat /tmp/ci_invite.json || true

echo
echo "Calling admin-upsert-role to set role=admin for $INVITE_TEST_EMAIL"
curl -s -X POST "$FUNC_BASE/admin-upsert-role" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"$INVITE_TEST_EMAIL\",\"role\":\"admin\"}" -o /tmp/ci_upsert.json || true
cat /tmp/ci_upsert.json || true

if [ -n "${INQUIRY_ID:-}" ]; then
  echo
  echo "Calling update-inquiry-status for $INQUIRY_ID -> approved"
  curl -s -X POST "$FUNC_BASE/update-inquiry-status" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"id\":\"$INQUIRY_ID\",\"status\":\"approved\"}" -o /tmp/ci_status.json || true
  cat /tmp/ci_status.json || true
fi

echo "CI tests complete. Responses in /tmp/ci_*.json"
