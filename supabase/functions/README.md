Edge Function examples
======================

These example Deno functions are intended for Supabase Edge Functions. They require the following environment variables in the function runtime:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (keep this secret; do NOT expose to browsers)

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
	```

- The public function URL will be: `https://<project-ref>.functions.supabase.co/<function-name>`

- Ensure the function runtime has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured (Project -> Settings -> API -> Service role key).
- Add `SUPABASE_ANON_KEY` too if the function needs to inspect the caller's auth session via `auth.getUser()`. Anonymous form submissions that only use the service client do not require it.

- See `TESTING.md` for example curl commands to test locally or call the deployed functions.
