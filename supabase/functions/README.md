Edge Function examples
======================

These example Deno functions are intended for Supabase Edge Functions. They require the following environment variables in the function runtime:

- `SUPABASE_URL` — your Supabase project URL
- `SERVICE_ROLE_KEY` — service role key (keep this secret; do NOT expose to browsers)
- `RESEND_API_KEY` — Resend API key for transactional inquiry emails
- `RESEND_FROM_EMAIL` — verified sender, for example `CocoaBridge <info@cocoabridge.com>`
- `ADMIN_NOTIFICATION_EMAIL` — admin inbox for buyer inquiry alerts, defaults to `info@cocoabridge.com`
- `EMAIL_SUBJECT_PREFIX` — optional subject prefix, defaults to `CocoaBridge`

Deploy tips
-----------

- Use `supabase functions deploy <name>` (Supabase CLI) or your preferred deployment method.
- Configure the required environment variables in the function settings on Supabase or via your CI.

Security
--------

- These functions authenticate the caller by reading the caller's access token from the `Authorization` header and calling `supabaseAdmin.auth.getUser(token)`.
- They then resolve the caller's primary role through `get_primary_role`, which is backed by `user_profiles` and `user_role_assignments`.
- The functions still sync the legacy `profiles` table where needed so the existing browser flows keep working, but the authorization path now comes from the newer role model.
- The functions use the service role key to perform privileged DB operations while still enforcing a server-side role check.

Testing & Deploy
-----------------

- Deploy a function using the Supabase CLI:

	```bash
	supabase functions deploy admin-manage-users
	supabase functions deploy invite-user
	supabase functions deploy update-inquiry-status
	supabase functions deploy admin-upsert-role
	supabase functions deploy submit-blog-comment
	```

- The public function URL will be: `https://<project-ref>.functions.supabase.co/<function-name>`

- Ensure the function runtime has `SUPABASE_URL` and `SERVICE_ROLE_KEY` configured (Project -> Settings -> API -> Service role key).
- Add `SUPABASE_ANON_KEY` too if the function needs to inspect the caller's auth session via `auth.getUser()`. Anonymous form submissions that only use the service client do not require it.
- For inquiry email notifications, configure Resend secrets before deploying or testing:

	```bash
	supabase secrets set RESEND_API_KEY='re_GRv9KUCU_BK32Au5DPXCm2rtgHHXPymHH'
	supabase secrets set RESEND_FROM_EMAIL='CocoaBridge <info@cocoabridge.com>'
	supabase secrets set ADMIN_NOTIFICATION_EMAIL=info@cocoabridge.com
	```

- Deploy the updated inquiry function:

	```bash
	supabase functions deploy submit-inquiry
	```

- Email delivery is best-effort. `submit-inquiry` saves the inquiry first, then sends the admin notification and buyer confirmation through Resend. If Resend is unavailable or a secret is missing, the saved inquiry response still succeeds and the function logs the email error.

- See `TESTING.md` for example curl commands to test locally or call the deployed functions.
