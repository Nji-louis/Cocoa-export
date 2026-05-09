#!/usr/bin/env bash
# Simple tester for Supabase Edge Functions (invite-user, update-inquiry-status, admin-upsert-role)
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "Supabase Edge Functions tester"

read -p "Supabase URL (e.g. https://xyz.supabase.co): " SUPABASE_URL
read -p "Supabase ANON KEY: " ANON_KEY
read -p "Admin email (to obtain token): " ADMIN_EMAIL
read -s -p "Admin password: " ADMIN_PASSWORD
echo
read -p "Functions base URL (leave empty to auto-derive): " FUNC_BASE

if [ -z "$FUNC_BASE" ]; then
  # try to derive functions URL from supabase URL
  if [[ "$SUPABASE_URL" =~ \.supabase\.co$ ]]; then
    FUNC_BASE="${SUPABASE_URL/\.supabase\.co/.functions.supabase.co}"
  else
    echo "Cannot derive functions URL from SUPABASE_URL; please enter full functions base URL (e.g. https://<ref>.functions.supabase.co)"
    read -p "Functions base URL: " FUNC_BASE
  fi
fi

INVITE_TEST_EMAIL="test-invite-$(date +%s)@example.com"
DEFAULT_ROLE="buyer"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required. Install curl and try again." >&2
  exit 1
fi

PARSE_TOKEN()
{
  local json="$1"
  # prefer jq if available
  if command -v jq >/dev/null 2>&1; then
    echo "$json" | jq -r '.access_token // .data.access_token // .access_token'
  else
    # fallback to python for JSON parsing
    if command -v python3 >/dev/null 2>&1; then
      echo "$json" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token') or json.load(sys.stdin).get('data',{}).get('access_token') or json.load(sys.stdin).get('access_token',''))"
    else
      echo ""
    fi
  fi
}

echo "Requesting access token for $ADMIN_EMAIL..."
TOKEN_RESP=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

ACCESS_TOKEN=$(PARSE_TOKEN "$TOKEN_RESP")
if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to obtain access token. Response:" >&2
  echo "$TOKEN_RESP"
  exit 1
fi

echo "Access token obtained. Running tests against functions base: $FUNC_BASE"

echo
echo "1) invite-user"
INVITE_PAYLOAD=$(printf '{"email":"%s","role":"%s"}' "$INVITE_TEST_EMAIL" "$DEFAULT_ROLE")
curl -s -o /tmp/test_invite_resp.json -w "%{http_code}" -X POST "$FUNC_BASE/invite-user" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "$INVITE_PAYLOAD" || true
INVITE_HTTP=$?
echo "Response saved to /tmp/test_invite_resp.json"
cat /tmp/test_invite_resp.json || true

echo
echo "2) admin-upsert-role (set role for $INVITE_TEST_EMAIL -> admin)"
UPSR_PAYLOAD=$(printf '{"email":"%s","role":"admin"}' "$INVITE_TEST_EMAIL")
curl -s -o /tmp/test_upsert_resp.json -w "%{http_code}" -X POST "$FUNC_BASE/admin-upsert-role" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "$UPSR_PAYLOAD" || true
echo "Response saved to /tmp/test_upsert_resp.json"
cat /tmp/test_upsert_resp.json || true

echo
read -p "(Optional) Enter an existing inquiry id to test update-inquiry-status (or press Enter to skip): " INQ_ID
if [ -n "$INQ_ID" ]; then
  echo "3) update-inquiry-status"
  STATUS_PAYLOAD=$(printf '{"id":"%s","status":"approved"}' "$INQ_ID")
  curl -s -o /tmp/test_status_resp.json -w "%{http_code}" -X POST "$FUNC_BASE/update-inquiry-status" \
    -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
    -d "$STATUS_PAYLOAD" || true
  echo "Response saved to /tmp/test_status_resp.json"
  cat /tmp/test_status_resp.json || true
else
  echo "Skipped update-inquiry-status test. Provide an inquiry id to test it."
fi

echo
echo "Tests complete. Review the JSON responses in /tmp/test_*.json"
