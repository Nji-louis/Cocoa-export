# Website + Supabase Sign-Off Checklist

Use this exactly in order. Mark each step `PASS` or `FAIL`.

## 0) Pre-check

1. Start local site server (example): `python3 -m http.server 5500`
2. Open: `http://127.0.0.1:5500/index.html`
3. Confirm `js/supabase/config.js` has your real project URL + anon key.
4. Confirm migrations/functions are already deployed to project `qnepxdyvfctreegcduxj`.

## 1) Public Pages Smoke Test

1. Open each page and confirm no blank page / no broken layout:
`index.html`, `about.html`, `product.html`, `product_cundeamor.html`, `product_detail.html`, `blog.html`, `blog_detail.html`, `contact.html`, `services.html`, `terms_and_conditions.html`, `privacy_policy.html`.
2. Open browser DevTools Console.
3. Confirm no blocking JS errors (warnings are acceptable if non-breaking).

## 2) Auth Flow Test

1. Click `Login / Register` in nav.
2. Register a new test buyer account.
Expected: account created, confirmation/login flow works.
3. Login with that buyer.
Expected: nav updates, logout visible.
4. Logout.
Expected: returns to guest state.
5. Password reset:
Expected: reset request accepted (email flow handled by Supabase Auth).

## 3) Inquiry Flow Test

1. Submit inquiry from `index.html` consultation form.
Expected: success message from UI.
2. Submit inquiry from `contact.html` inquiry form.
Expected: success message.
3. Submit inquiry from one product page inquiry form.
Expected: success message.
4. In Supabase table `inquiry_requests`, verify 3 new rows.
5. In Supabase table `inquiry_events`, verify creation events logged.

## 4) Newsletter Subscription Test

1. Submit newsletter form in footer with a new email.
Expected: `Subscription updated successfully.`
2. Submit same email again.
Expected: still succeeds (upsert behavior, no duplicate failure).
3. Verify row in `newsletter_subscriptions`.

## 5) Blog Data + Comment Test

1. Open `blog.html`.
Expected: posts load dynamically (not static placeholders).
2. Open a post from blog list.
Expected: `blog_detail.html?slug=...` loads content dynamically.
3. Submit a comment from blog detail.
Expected: `Comment submitted for moderation.`
4. Verify row appears in `blog_comments` with `status = pending`.

## 6) Admin Console Access Control Test

1. Open `admin_console.html` while logged out.
Expected: sign-in required message.
2. Login as normal buyer and reopen admin console.
Expected: access denied (no staff/admin operations usable).
3. Login as staff/admin and open admin console.
Expected: protected panels load and are usable.

## 7) Admin Product CMS Test (CRUD)

1. In `admin_console.html`, create product.
Expected: row appears in product table.
2. Edit same product.
Expected: updated values persist.
3. Add specification to that product.
Expected: spec appears in spec table.
4. Upload media image OR set external URL.
Expected: media row appears.
5. Set as primary image.
Expected: `is_primary` correctly set.
6. Delete spec/media row.
Expected: row removed.
7. Delete product.
Expected: product soft-deleted (archived / hidden from active list).

## 8) Role + RLS Security Test

1. Using buyer session, attempt direct updates on admin tables in browser console (products/listings).
Expected: denied by RLS.
2. Using admin session, same actions via console/admin page.
Expected: allowed where policy permits.

## 9) Edge Function Test (Dashboard)

Run in Supabase SQL editor to confirm functions and policies exist:

1. `consume_edge_rate_limit(...)` callable by service role only.
2. `update_inquiry_status(...)` works for staff/admin only.
3. `search_catalog(...)` returns published products.

## 10) Production Finalization

1. Ensure secrets set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `RATE_LIMIT_PEPPER`

2. Deploy commands:
- `npx supabase db push`
- `npx supabase functions deploy submit-inquiry`
- `npx supabase functions deploy subscribe-buyer-updates`
- `npx supabase functions deploy submit-blog-comment`
- `npx supabase functions deploy generate-document-signed-url`
- `npx supabase functions deploy admin-upsert-listing`

3. Configure Supabase Auth URL settings to your real domain.
4. Confirm no secrets are committed (`js/supabase/config.js` and `supabase/.env` are gitignored).

## Sign-Off

Release only when all sections are `PASS`.
