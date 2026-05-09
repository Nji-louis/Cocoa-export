Integration tests for Supabase Edge Functions
=============================================

This document explains how to run the included integration tests locally and in CI.

Required environment variables (local & CI)
- `SUPABASE_URL` - e.g. `https://xyz.supabase.co`
- `ANON_KEY` - Supabase anon public key
- `ADMIN_EMAIL` - an admin user email in your Auth users
- `ADMIN_PASSWORD` - admin user password (use a CI-only account)

Optional:
- `FUNC_BASE` - functions base URL (usually derived from `SUPABASE_URL`)
- `INQUIRY_ID` - existing inquiry id to test `update-inquiry-status`

Local
-----
1. Copy `scripts/.env.example` to `scripts/.env` and fill values.
2. Make the helper executable and run it:

```bash
chmod +x scripts/run-ci-tests-local.sh
./scripts/run-ci-tests-local.sh
```

This calls `scripts/test-functions-ci.sh` which will:
- obtain an access token for `ADMIN_EMAIL`
- call `invite-user` and `admin-upsert-role`
- optionally call `update-inquiry-status` when `INQUIRY_ID` is set

CI (GitHub Actions)
--------------------
1. Add the following repository secrets in Settings → Secrets:
   - `SUPABASE_URL`
   - `ANON_KEY`
   - `CI_ADMIN_EMAIL` (or `ADMIN_EMAIL` depending on the workflow)
   - `CI_ADMIN_PASSWORD`
   - `FUNC_BASE` (optional)
   - `TEST_INQUIRY_ID` (optional)

2. Trigger the workflow `Test Supabase Edge Functions` (file: `.github/workflows/test-edge-functions.yml`).

Notes & safety
- Use a dedicated CI admin account to avoid locking your real admin out in tests.
- Do not store `SUPABASE_SERVICE_ROLE_KEY` in repo secrets for the frontend; only set it in Supabase function secrets.
