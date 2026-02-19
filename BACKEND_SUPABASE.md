# Supabase Backend Architecture (Production-Ready)

This backend was inferred from the existing frontend pages and flows in this repo:
- product catalog + product detail pages
- export listing/content pages
- contact/export inquiry forms
- blog listing + blog detail comment form
- subscription inputs in footer/contact pages
- login/register entry points in top nav

## 1) Applied Architecture

- **Database:** PostgreSQL (Supabase) with normalized schema and UUID PKs.
- **Auth:** Supabase Auth (email/password), profile bootstrap trigger, role assignments.
- **Authorization:** strict DB-level RLS across all tables.
- **Storage:** public image buckets + private document buckets with policy isolation.
- **Business logic:** Edge Functions for secure writes and privileged operations.
- **Data access layer:** reusable frontend modules in `js/supabase/`.

## 2) Files Added

- `supabase/config.toml`
- `supabase/.env.example`
- `supabase/migrations/20260214194000_core_schema.sql`
- `supabase/migrations/20260214194100_rls_and_storage.sql`
- `supabase/migrations/20260214194200_seed_catalog.sql`
- `supabase/functions/_shared/*`
- `supabase/functions/submit-inquiry/index.ts`
- `supabase/functions/subscribe-buyer-updates/index.ts`
- `supabase/functions/submit-blog-comment/index.ts`
- `supabase/functions/generate-document-signed-url/index.ts`
- `supabase/functions/admin-upsert-listing/index.ts`
- `js/supabase/*.js`

## 3) Schema Coverage

### Core commerce tables
- `product_categories`
- `products`
- `product_specifications`
- `product_media_assets`
- `inventory_listings`
- `export_documents`

### Workflow/inquiry tables
- `inquiry_requests`
- `inquiry_events`
- `workflow_tasks`

### Content/community tables
- `blog_categories`
- `blog_posts`
- `blog_comments`
- `buyer_testimonials`
- `newsletter_subscriptions`

### Auth/roles tables
- `user_profiles`
- `user_role_assignments`

All tables include `created_at`/`updated_at`; updates are handled with trigger `set_updated_at()`.

## 4) Security Model

- RLS enabled and forced on **all** app tables.
- Public read-only policies on published catalog/blog/testimonial content.
- No anonymous direct writes to application tables.
- Auth users constrained to own records where relevant.
- Staff/admin-only write policies for protected datasets.
- Role helper functions: `has_role()`, `is_staff_or_admin()`.
- Storage access isolated by bucket + role policies.

## 5) Auth + Role Mapping

- New users are auto-provisioned via `handle_new_user()` trigger on `auth.users`.
- Default role assignment: `buyer`.
- Elevated roles managed via `assign_user_role(target_user_id, target_role)` (admin only).

## 6) Edge Functions

- `submit-inquiry`: secure ingestion for contact/product/home inquiry forms.
- `subscribe-buyer-updates`: secure subscription upsert.
- `submit-blog-comment`: moderation-safe comment submission.
- `generate-document-signed-url`: staff/admin signed URL generation for private docs.
- `admin-upsert-listing`: protected inventory/listing mutation.

Hardening applied:
- origin allowlist enforcement via `ALLOWED_ORIGINS`
- payload/content-type validation for all function endpoints
- honeypot support (`website` field must stay empty)
- DB-backed rate limiting (`edge_rate_limits` + `consume_edge_rate_limit`)

## 7) Frontend Data Layer

Added under `js/supabase/`:
- `client.js`: Supabase client bootstrap
- `auth.js`: auth methods/session hooks
- `catalog.js`: product/blog/testimonial read APIs + pagination
- `inquiries.js`: inquiry submit + user inquiry listing + status RPC
- `subscriptions.js`: newsletter ops
- `blog.js`: comment submission/listing
- `forms.js`: binds existing DOM classes/IDs and existing data flow
- `errors.js`, `init.js`, `config.example.js`

## 8) Integrate Into Existing Pages

Add these scripts before `</body>` on pages where backend interaction is needed:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase/config.js"></script>
<script src="js/supabase/client.js"></script>
<script src="js/supabase/errors.js"></script>
<script src="js/supabase/auth.js"></script>
<script src="js/supabase/catalog.js"></script>
<script src="js/supabase/inquiries.js"></script>
<script src="js/supabase/subscriptions.js"></script>
<script src="js/supabase/blog.js"></script>
<script src="js/supabase/forms.js"></script>
<script src="js/supabase/init.js"></script>
```

Create `js/supabase/config.js` from `js/supabase/config.example.js`.

## 9) Deploy Steps (Supabase CLI)

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase secrets set --env-file supabase/.env
npx supabase functions deploy submit-inquiry
npx supabase functions deploy subscribe-buyer-updates
npx supabase functions deploy submit-blog-comment
npx supabase functions deploy generate-document-signed-url
npx supabase functions deploy admin-upsert-listing
```

## 10) Production Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` only in Edge Function secrets.
- Keep only anon key on frontend (`config.js`).
- Enable PITR backups and monitor query performance/index usage in Supabase dashboard.
- Set `ALLOWED_ORIGINS` and `RATE_LIMIT_PEPPER` in `supabase/.env` before `supabase secrets set`.
- Rotate any keys that were previously exposed in chat/logs.
