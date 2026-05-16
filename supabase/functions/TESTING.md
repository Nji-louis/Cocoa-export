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

5) Call `submit-inquiry` and verify inquiry emails

`submit-inquiry` is public (`verify_jwt = false`) because the website forms submit anonymous buyer requests. It saves to Supabase first, then sends the admin notification and buyer confirmation through Resend.

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/submit-inquiry" \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "Test Buyer",
    "companyName": "Example Cocoa Imports",
    "workEmail": "buyer@example.com",
    "phoneWhatsApp": "+237 600 000 000",
    "countryRegion": "Cameroon",
    "inquiryTopic": "Forastero Cocoa Beans",
    "requiredVolumeMt": 25,
    "message": "Please quote FOB Douala for 25 MT.",
    "sourceChannel": "buyer_quote_form"
  }'
```

Expected response includes the saved inquiry details and an `emailStatus` object:

```json
{
  "inquiryId": "...",
  "requestNumber": "...",
  "status": "new",
  "createdAt": "...",
  "emailStatus": {
    "adminNotification": "sent",
    "buyerConfirmation": "sent"
  }
}
```

Notes
-----
- Use an admin or super admin user's access token when calling these functions. The functions verify the caller's role server-side through the newer `user_profiles` / `user_role_assignments` model before performing privileged operations.
- The function runtime must be provisioned with `SUPABASE_URL` and `SERVICE_ROLE_KEY` in Supabase function settings.
- Inquiry emails also require `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ADMIN_NOTIFICATION_EMAIL` secrets. Missing or failed email delivery is logged, but the saved inquiry still succeeds.
- For local testing with the Supabase CLI, you can run `supabase functions serve <name>` and call `http://localhost:54321/<name>` (check current CLI docs for exact local URL).
