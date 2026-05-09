Supabase setup notes — CAMCOCOA
=================================

This document contains minimal setup instructions, schema notes, and RLS guidance for integrating the website with Supabase.

1) Quick environment

- Create a Supabase project and copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` into your frontend config (see `js/supabaseClient.js`).
- Create the database objects (run migrations in `supabase/migrations/...`).

2) Core tables (migration provided)

- `public.profiles` — columns: `id` (uuid, same as `auth.users.id`), `email`, `role` (default `buyer`), `company_name`, timestamps
- `public.inquiries` — columns: `id`, `user_id` (profiles.id), `product`, `quantity`, `message`, `status` (default `pending`), timestamps

3) Recommended RLS policies

- See `supabase/policies/rls_examples.sql` for a working baseline. Key rules:
  - Buyers may select only their own `inquiries` (WHERE user_id = auth.uid()).
  - Admins (profiles.role = 'admin') can view and update all inquiries.
  - Inserts require `user_id = auth.uid()` so the browser cannot spoof another user's id.

4) Edge Functions

- For admin-only actions (bulk updates, signed URLs, role changes) prefer creating Edge Functions and protecting them with admin-level checks rather than granting direct DB writes from the browser.

5) Frontend notes

- `js/supabaseClient.js` is the single client entrypoint. Replace the placeholders with your project values.
- `js/authGuard.js` enforces session and role checks on dashboard pages.
- `js/forms.js::submitInquiry()` maps common site form fields into inserts to `public.inquiries` and attaches `auth.uid()` as `user_id`.

6) Minimal SQL to create a default admin user (run in SQL editor)

-- After creating a Supabase user via the dashboard or signup flow, set their role in `profiles`:
-- update public.profiles set role = 'admin' where email = 'admin@example.com';

7) Migration / deploy tips

- Run migrations in order. If using the Supabase CLI, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment and run `supabase db push` or `supabase migration run` depending on your workflow.

Functions (deploy & test)
------------------------

- Deploy Edge Functions using the Supabase CLI:

  ```bash
  supabase login
  supabase link --project-ref <project-ref>
  supabase functions deploy admin-manage-users
  supabase functions deploy invite-user
  supabase functions deploy update-inquiry-status
  supabase functions deploy admin-upsert-role
  ```

- Add required function environment variables in Supabase (Project -> Functions -> <function> -> Settings):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- Test functions with `curl` using an admin user's access token. See `supabase/functions/TESTING.md` for examples.

GitHub Actions secrets
----------------------

To run the CI workflow `.github/workflows/test-edge-functions.yml` you'll need to add the following repository secrets (Settings → Secrets → Actions):

- `SUPABASE_URL` — your Supabase project URL (e.g. `https://<ref>.supabase.co`)
- `SUPABASE_ANON_KEY` — the anon key used for auth/token requests in tests (do NOT use the service role key here)
- `CI_ADMIN_EMAIL` — email of the admin user used for testing (prefer a dedicated test account)
- `CI_ADMIN_PASSWORD` — password of the admin test account (store securely)
- `FUNC_BASE` — optional: base URL for deployed functions (e.g. `https://<ref>.functions.supabase.co`); if omitted the test script will attempt to derive it from `SUPABASE_URL`
- `TEST_INQUIRY_ID` — optional inquiry UUID used to exercise `update-inquiry-status` during tests

Security notes:

- Use a dedicated, limited-scope test admin account for CI and rotate credentials regularly.
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` as a repo secret for Actions that run in untrusted contexts. Service-role key must only be used in function runtime settings or secure server environments.
- Review the function responses and logs after a run to ensure no sensitive data is leaked into workflow logs.

