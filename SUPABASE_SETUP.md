Setup and push Supabase schema (local -> remote)

1) Install CLI (if you don't have it):

```bash
npm install -g supabase
# or use npx: npx supabase --help
```

2) Ensure you linked the project (you have):

```bash
npx supabase link --project-ref zsyawtkrkjvulrjhgbyn
```

3) To push the migration to the remote DB (CONFIRM first):

```bash
# This will apply SQL in supabase/migrations/ to your linked project
npx supabase db push
```

4) To run seed data after push:

```bash
# Execute seed SQL
psql "$(npx supabase secrets get DATABASE_URL)" -f supabase/seed/seed.sql
# Or use the Supabase SQL editor in the dashboard to run supabase/seed/seed.sql
```

5) Add env vars locally (create `.env` from `.env.example`) and set the public values in your HTML templates:

In your site's `<head>` (example):

```html
<script>
  window.SUPABASE_URL = "https://<your-project>.supabase.co";
  window.SUPABASE_ANON_KEY = "<your-anon-key>";
</script>
<script src="/js/supabase-client.js" type="module"></script>
```

6) Notes & safety:
- `SUPABASE_SERVICE_ROLE_KEY` is sensitive. Keep it on the server only.
- Test migrations in a staging database before pushing to production.
