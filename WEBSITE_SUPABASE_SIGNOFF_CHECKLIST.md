# Website + Supabase Sign-Off Checklist

Updated for the current site flows on April 8, 2026.

## Automated Preflight Already Completed

Status on April 8, 2026:
- `PASS` Main smoke pages returned `200` locally: `index.html`, `about.html`, `product.html`, `product_detail.html`, `blog.html`, `blog_detail.html`, `contact.html`, `services.html`, `terms_and_conditions.html`, `privacy_policy.html`, `buyer-portal/dashboard.html`, `search_results.html`, `admin/dashboard.html`.
- `PASS` All scanned local HTML asset references resolved after repairs: `44` HTML files scanned, `155` unique local refs checked, `0` failures.
- `PASS` JavaScript syntax check: `59` JS files checked with `node --check`, `0` failures.
- `PASS` Broken local image references fixed before this checklist was updated.
- `BLOCKED IN THIS ENVIRONMENT` Headless Chrome console/runtime capture could not be completed because the local Chrome runtime is broken on this machine.

Use the remaining sections below for the real browser + Supabase sign-off.

## 0) Local Setup

1. Start a local server from repo root:
   `python3 -m http.server 5500`
2. Open:
   `http://127.0.0.1:5500/index.html`
3. Confirm `js/supabase/config.min.js` points to the live project and anon key.
4. Confirm migrations and edge functions are already deployed to Supabase project `zsyawtkrkjvulrjhgbyn`.
5. Open browser DevTools before testing and keep the Console visible.
6. In Supabase Dashboard `Authentication > URL Configuration`, confirm `Site URL` is `https://cocoabridge.com` and these redirect URLs are allowed: `https://cocoabridge.com/auth/login.html`, `https://cocoabridge.com/admin/login.html`, and any staging/local URL used for testing.
7. In Supabase Dashboard `Authentication > Email`, confirm the email provider is enabled, buyer email confirmation is enabled, and the sender/SMTP configuration is healthy before testing signup emails.

## 1) Public Pages Smoke Test

Open each page and confirm:
- Page renders normally.
- No blank sections.
- No blocking console errors.
- Core navigation works.

Pages to open:
- `index.html`
- `about.html`
- `product.html`
- `product_detail.html?variety=forastero`
- `blog.html`
- `blog_detail.html?slug=cameroon-cocoa-vs-ghana-cocoa-key-differences`
- `contact.html`
- `services.html`
- `terms_and_conditions.html`
- `privacy_policy.html`
- `search_results.html`

## 2) Auth Flow Test

Page:
- `auth/login.html`

Run these checks in order.

### Buyer signup
1. Fill all buyer signup fields with a new email.
2. Submit the form.
3. Pass if you see one of these:
   - `Account created for you@example.com. Please confirm your email. If it does not arrive, use Resend Confirmation Email.`
   - `Account created. Redirecting...`
4. Open Supabase Auth and confirm the user exists.
5. Pass only if the confirmation email arrives in inbox or spam. If it does not, stop here and fix Supabase Dashboard `Authentication > Email` sender settings before continuing.

### Login before confirmation
1. Try signing in before email verification.
2. Pass if you see:
   `Please verify your email before logging in.`

### Resend confirmation
1. Click `Resend Confirmation Email`.
2. Pass if you see:
   `Confirmation email sent to you@example.com. Check inbox and spam.`

### Confirm email and sign in
1. Complete email confirmation.
2. Sign in again.
3. Pass if you see:
   `Signed in. Redirecting...`
4. Confirm the user lands in the buyer area.

### Password reset
1. On `login.html`, enter the email and click `Forgot Password?`
2. Pass if you see:
   `Password reset email sent.`
3. Open the reset link from email.
4. Enter a new password.
5. Pass if you see:
   `Password updated. Redirecting...`

### Logout
1. Open `buyer-portal/dashboard.html` while signed in.
2. Click `Logout`.
3. Pass if you are returned to guest state or back to the homepage.

## 3) Inquiry Flow Test

### Homepage inquiry
Page:
- `index.html`

1. In the `Export Inquiry` block, choose a topic and enter name/email.
2. Click `SUBMIT INQUIRY`.
3. Pass if you see:
   `Inquiry submitted. We will respond by email.`

### Contact page inquiry
Page:
- `contact.html`

1. Fill the export inquiry fields.
2. Click `SUBMIT INQUIRY`.
3. Pass if you see:
   `Inquiry submitted. Our export desk will contact you shortly.`

### Product inquiry
Page:
- `product_detail.html?variety=forastero`

1. Fill `Send Product Inquiry`.
2. Click `SUBMIT INQUIRY`.
3. Pass if you see:
   `Product inquiry submitted successfully.`

### Database verification
Check Supabase tables:
- `inquiry_requests`: 3 new rows exist.
- `inquiry_events`: creation events exist for those requests.

## 4) Newsletter Subscription Test

Pages:
- Footer form on `index.html`
- Footer form on `contact.html`
- Footer form on `product_detail.html`

1. Submit a new email.
2. Pass if you see:
   `Subscription updated successfully.`
3. Submit the same email again.
4. Pass if it still succeeds with the same message.
5. Verify the row in `newsletter_subscriptions`.

Note:
- The HTML still contains a Mailchimp fallback action, but with JS and Supabase configured the site should intercept the form and use the Supabase subscription flow.

## 5) Blog Data + Comment Test

### Blog list
Page:
- `blog.html`

1. Confirm the page loads actual blog cards, not a stuck loading message.
2. Pass if cards are visible and `READ MORE` links open a detail page.

### Blog detail
Page example:
- `blog_detail.html?slug=cameroon-cocoa-vs-ghana-cocoa-key-differences`

1. Confirm article content loads for the selected slug.
2. Confirm comment area loads instead of staying on `Loading comments...`.

### Blog comment submission
1. In `Leave a Reply`, enter Name, Email, and Message.
2. Click `SEND MESSAGE`.
3. Pass if you see one of these:
   - `Comment submitted and shown live (pending moderation).`
   - `Comment posted successfully.`
4. Verify a row appears in `blog_comments`.
5. Expected default status is usually `pending` unless moderation rules approve immediately.

## 6) Product Testimonial Flow Test

Page:
- `product_detail.html?variety=forastero`

### Testimonial load
1. Wait for the testimonial block to finish loading.
2. Pass if one of these is true:
   - Published testimonials load from Supabase.
   - A fallback note appears, such as:
     - `Displaying fallback testimonials.`
     - `No published testimonials yet for this variety. Showing verified buyer feedback.`
     - `Could not load live testimonials right now. Showing verified buyer feedback.`

### Voting
1. Click one vote button on a testimonial.
2. Pass if you see:
   `Thank you. Your feedback was recorded.`
3. Click the same testimonial vote again from the same browser.
4. Pass if you see:
   `You already voted on this testimonial from this browser.`
5. Verify the vote function and counters in Supabase if validating production.

### Reply form
1. Click `Reply` on a testimonial.
2. Submit the reply form.
3. Pass if you see:
   `Reply sent successfully. Our export desk will follow up.`
4. Verify a new inquiry row is created with topic `Reply to Buyer Testimonial`.

## 7) Buyer Portal Guard Test

Page:
- `buyer-portal/dashboard.html`

1. Open while logged out.
2. Pass if you are redirected to `auth/login.html`.
3. Sign in as a buyer.
4. Reopen the dashboard.
5. Pass if you see your email and role rendered in the header.
6. Sign in as staff/admin and try opening the buyer dashboard.
7. Pass if you are redirected away to the role-appropriate area.

## 8) Admin Console Access Control Test

Page:
- `admin/dashboard.html`

### Logged out
1. Open while logged out.
2. Pass if you see:
   `Sign in with a staff or admin account to use the admin console.`

### Buyer account
1. Log in as a normal buyer.
2. Reopen `admin/dashboard.html`.
3. Pass if you see:
   `Access denied: your account is not assigned a staff/admin role.`

### Staff or admin account
1. Log in as staff or admin.
2. Open `admin/dashboard.html`.
3. Pass if the console loads inquiries and protected panels normally.

## 9) Staff/Admin Workflow Test

Use a staff or admin account for this section.

### Inquiry status update
1. In `Recent Inquiries`, pick an inquiry.
2. Update its status.
3. Pass if you see:
   `Inquiry status updated successfully.`

### Listing upsert
1. In `Admin Listing Upsert`, submit a test listing.
2. Pass if you see:
   `Listing upserted: ...`

### Product CMS
1. Create a product in `Admin Product Manager`.
2. Pass if you see:
   `Product created: ...`
3. Edit the same product.
4. Pass if you see:
   `Product updated: ...`
5. Add a specification.
6. Pass if you see:
   `Specification created.`
7. Edit the specification.
8. Pass if you see:
   `Specification updated.`
9. Add media by file upload or external URL.
10. Pass if you see:
    `Media created.`
11. Edit the media.
12. Pass if you see:
    `Media updated.`
13. Delete the media row.
14. Pass if you see:
    `Media deleted.`
15. Delete the specification row.
16. Pass if you see:
    `Specification deleted.`
17. Delete the product.
18. Pass if you see:
    `Product deleted: ...`
19. Verify in the database whether delete is soft-delete/archive behavior as intended.

### Signed URL generation
1. In `Generate Document Signed URL`, submit a valid bucket/path.
2. Pass if you see:
   `Signed URL generated successfully.`

## 10) Security + RLS Test

1. With a buyer session, attempt admin table writes in the browser console.
2. Pass if RLS denies the action.
3. With a staff/admin session, confirm allowed operations succeed only where policy permits.
4. Confirm buyer users cannot access admin-only UI actions.

## 11) Evidence to Capture

For each section, record:
- URL tested
- account used
- exact message shown
- relevant Supabase row/function log
- `PASS` or `FAIL`
- screenshot if the result is ambiguous

## 12) Release Rule

Release only when:
- all manual sections above are `PASS`
- no blocking console errors remain
- Supabase writes are verified in the expected tables
- auth redirects and role guards behave correctly
