#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") <admin-email> [role] [DATABASE_URL]

Upserts a `public.profiles` row for the auth user with the given email.
Requires the user to already exist in `auth.users` (create via Supabase Auth if needed).

You may pass the database URL as the third argument or via the DATABASE_URL env var.

Example:
  DATABASE_URL="postgresql://user:pass@host:5432/db" \
    $(basename "$0") admin@example.com super_admin
EOF
}

if [ "${1:-}" = "" ] || [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

EMAIL="$1"
ROLE="${2:-super_admin}"
DB_URL="${3:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not provided. Pass as third arg or set DATABASE_URL env var."
  usage
  exit 2
fi

SQL=$(cat <<'SQL'
WITH u AS (
  SELECT id, email FROM auth.users WHERE email = :email
)
INSERT INTO public.profiles (id, email, role, created_at)
SELECT id, email, :role, now() FROM u
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      email = EXCLUDED.email,
      updated_at = now();
SQL
)

echo "Upserting profile for $EMAIL with role '$ROLE'..."
psql "$DB_URL" -v email="$EMAIL" -v role="$ROLE" -c "$SQL"

echo "Done. Verify in Supabase Console → Database → public.profiles or by running:\n  psql '$DB_URL' -c \"select id,email,role,created_at,updated_at from public.profiles where email='$EMAIL'\""
