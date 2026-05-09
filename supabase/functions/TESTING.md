Testing Edge Functions
======================

This file shows quick commands to test the Edge Functions locally or against the deployed endpoints.

1) Obtain a user access token (email/password)

Replace `SUPABASE_URL` and `ANON_KEY`.

```bash
curl -s -X POST "https://<YOUR_SUPABASE_URL>/auth/v1/token?grant_type=password" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

Response contains `access_token` which you will use in `Authorization: Bearer <token>` header.

2) Call `update-inquiry-status`

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/update-inquiry-status" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"id":"<INQUIRY_UUID>","status":"approved"}'
```

3) Call `invite-user`

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/invite-user" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","role":"buyer"}'
```

4) Call `admin-upsert-role`

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/admin-upsert-role" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"admin"}'
```

Notes
-----
- Use an admin or super admin user's access token when calling these functions. The functions verify the caller's role server-side through the newer `user_profiles` / `user_role_assignments` model before performing privileged operations.
- The function runtime must be provisioned with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Supabase function settings.
- For local testing with the Supabase CLI, you can run `supabase functions serve <name>` and call `http://localhost:54321/<name>` (check current CLI docs for exact local URL).
