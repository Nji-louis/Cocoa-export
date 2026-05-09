Supabase deployment & secure config
=================================

This file explains secure ways to provide Supabase credentials to the frontend without committing keys.

Options
-------

1) Server-side rendered meta tags (templated)

 - Render `meta` tags into your HTML layout at deploy-time using a secret from your CI or hosting environment.
 - Example (server template):

   <meta name="supabase-url" content="{{SUPABASE_URL}}">
   <meta name="supabase-anon-key" content="{{SUPABASE_ANON_KEY}}">

 - Pros: no client-side script required; values come from your server/template.
 - Cons: anon keys still live in page source (acceptable for public anon key), do NOT expose service role keys.

2) Inject via inline script from server (recommended for static hosts)

 - In your HTML layout, add before importing app JS:

   <script>
     window.__SUPABASE_CONFIG__ = {
       url: 'https://your-project.supabase.co',
       anonKey: 'eyJ...'
     }
   </script>

 - Then app code calls `initSupabase(window.__SUPABASE_CONFIG__)`.

3) Use environment-specific builds

 - During CI/CD, inject credentials into a small JSON file or into the page using your hosting provider's templating features.

Security notes
--------------

- The Supabase anon key is intended for public usage in the browser and can be embedded in client code; never expose the service role key.
- Enforce RLS on the database to prevent unauthorized reads/writes even if anon key is leaked.
- Prefer Edge Functions for admin-level operations.

Quick checklist
---------------

- [ ] Add `profiles` and `inquiries` tables (see `supabase/migrations`).
- [ ] Apply RLS policies from `supabase/policies/rls_examples.sql`.
- [ ] Render `meta` tags or `window.__SUPABASE_CONFIG__` at deploy time.

Deployment snippet: replace meta tags at deploy time
--------------------------------------------------

If your hosting or CI supports templating (Netlify, Vercel, GitHub Pages via a build step, etc.), inject the values into your HTML layout. Examples:

1) Templated meta tags (example for a static templating engine):

   <meta name="supabase-url" content="{{SUPABASE_URL}}">
   <meta name="supabase-anon-key" content="{{SUPABASE_ANON_KEY}}">

2) Inline runtime script (safer for some static hosts):

   <script>
     window.__SUPABASE_CONFIG__ = {
       url: '{{SUPABASE_URL}}',
       anonKey: '{{SUPABASE_ANON_KEY}}'
     };
   </script>

3) CI example (GitHub Actions) — inject into files during build:

   - In your workflow, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` as repository secrets.
   - Use a step to replace placeholders in your built HTML (simple sed example):

     ```bash
     sed -i 's|https://YOUR_SUPABASE_URL|${{ secrets.SUPABASE_URL }}|g' public/index.html
     sed -i 's|YOUR_SUPABASE_ANON_KEY|${{ secrets.SUPABASE_ANON_KEY }}|g' public/index.html
     ```

Recommendations
---------------
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in Supabase secrets / server-side runtime; never inject it into client pages.
- If you have server-side rendering, prefer server-side injection of `window.__SUPABASE_CONFIG__` so your client code can call `initSupabase()` early.
- After deployment, verify the runtime config by opening the page and checking `document.querySelector('meta[name="supabase-url"]').content` or `window.__SUPABASE_CONFIG__` in the browser console.

