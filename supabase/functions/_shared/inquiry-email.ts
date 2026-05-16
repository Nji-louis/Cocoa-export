import { getEnv } from "./env.ts";

type InquiryEmailPayload = {
  formType: string;
  buyerName: string | null;
  buyerEmail: string;
  buyerPhone: string | null;
  companyName: string | null;
  productName: string | null;
  country: string | null;
  message: string | null;
  requestNumber: string | null;
  submittedAt: string;
};

type ResendEmail = {
  from: string;
  to: string[];
  reply_to?: string[];
  subject: string;
  html: string;
};

type InquiryEmailResult = {
  adminNotification: "sent" | "skipped" | "failed";
  buyerConfirmation: "sent" | "skipped" | "failed";
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_ADMIN_EMAIL = "info@cocoabridge.com";
const DEFAULT_FROM_EMAIL = "CocoaBridge <info@cocoabridge.com>";

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function valueOrDash(value: string | null | undefined): string {
  const normalized = String(value ?? "").trim();
  return normalized ? escapeHtml(normalized) : "&mdash;";
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Douala",
  }).format(date);
}

function renderShell(title: string, body: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f1ea;color:#2b2118;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e4d8c8;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:#3b2416;color:#ffffff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0;">CocoaBridge</div>
                <div style="font-size:13px;margin-top:4px;color:#eadfce;">CAMCOCOA buyer communications</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fbf8f3;color:#6b5b4a;font-size:12px;line-height:1.5;">
                COCOABRIDGE Ltd / CAMCOCOA<br>
                Cocoa export sourcing, traceability, and buyer support.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderAdminEmail(payload: InquiryEmailPayload): string {
  const rows = [
    ["Form type", payload.formType],
    ["Buyer full name", payload.buyerName],
    ["Buyer email", payload.buyerEmail],
    ["Buyer phone number", payload.buyerPhone],
    ["Company name", payload.companyName],
    ["Product name", payload.productName],
    ["Country", payload.country],
    ["Request number", payload.requestNumber],
    ["Submission date and time", formatSubmittedAt(payload.submittedAt)],
  ];

  const tableRows = rows
    .map(([label, value]) =>
      `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#6b5b4a;width:38%;font-size:14px;">${
        escapeHtml(label)
      }</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#2b2118;font-size:14px;font-weight:600;">${
        valueOrDash(value)
      }</td>
      </tr>`
    )
    .join("");

  return renderShell(
    "New buyer inquiry",
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#2b2118;">New ${
      escapeHtml(payload.formType)
    } submitted</h1>
     <p style="margin:0 0 18px;color:#4d4034;font-size:15px;line-height:1.6;">A buyer submitted a website form. The inquiry has already been saved in Supabase.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #eee5da;">
       ${tableRows}
     </table>
     <h2 style="margin:22px 0 8px;font-size:16px;color:#2b2118;">Message / inquiry details</h2>
     <div style="white-space:pre-wrap;border:1px solid #eee5da;background:#fbf8f3;border-radius:6px;padding:14px;color:#2b2118;font-size:14px;line-height:1.6;">${
      valueOrDash(payload.message)
    }</div>`,
  );
}

function renderBuyerEmail(payload: InquiryEmailPayload): string {
  const greeting = payload.buyerName
    ? `Dear ${escapeHtml(payload.buyerName)},`
    : "Dear buyer,";

  return renderShell(
    "Inquiry received",
    `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#2b2118;">Your inquiry has been received</h1>
     <p style="margin:0 0 14px;color:#2b2118;font-size:15px;line-height:1.7;">${greeting}</p>
     <p style="margin:0 0 14px;color:#2b2118;font-size:15px;line-height:1.7;">Thank you for contacting CAMCOCOA / CocoaBridge. We have received your ${
      escapeHtml(payload.formType.toLowerCase())
    } and our team will review the details carefully.</p>
     <p style="margin:0 0 18px;color:#2b2118;font-size:15px;line-height:1.7;">A member of our cocoa export team will respond soon with the next steps, including product availability, documentation, logistics, or quotation details where applicable.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #eee5da;margin:18px 0;">
       <tr>
         <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#6b5b4a;font-size:14px;">Request number</td>
         <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#2b2118;font-size:14px;font-weight:600;">${
      valueOrDash(payload.requestNumber)
    }</td>
       </tr>
       <tr>
         <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#6b5b4a;font-size:14px;">Submitted</td>
         <td style="padding:10px 12px;border-bottom:1px solid #eee5da;color:#2b2118;font-size:14px;font-weight:600;">${
      escapeHtml(formatSubmittedAt(payload.submittedAt))
    }</td>
       </tr>
     </table>
     <p style="margin:0;color:#4d4034;font-size:14px;line-height:1.7;">Best regards,<br><strong>The CAMCOCOA / CocoaBridge Team</strong></p>`,
  );
}

async function sendResendEmail(
  email: ResendEmail,
): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = getEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("Inquiry email skipped: RESEND_API_KEY is not configured.");
    return "skipped";
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Resend email failed", {
        status: response.status,
        details,
      });
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error("Resend email request failed", error);
    return "failed";
  }
}

export async function sendInquiryEmails(
  payload: InquiryEmailPayload,
): Promise<InquiryEmailResult> {
  const from = getEnv("RESEND_FROM_EMAIL") ?? DEFAULT_FROM_EMAIL;
  const adminEmail = getEnv("ADMIN_NOTIFICATION_EMAIL") ?? DEFAULT_ADMIN_EMAIL;
  const subjectPrefix = getEnv("EMAIL_SUBJECT_PREFIX") ?? "CocoaBridge";
  const adminSubject = `${subjectPrefix}: New ${payload.formType} from ${
    payload.buyerName ?? payload.buyerEmail
  }`;
  const buyerSubject = "CAMCOCOA / CocoaBridge has received your inquiry";

  const [adminNotification, buyerConfirmation] = await Promise.all([
    sendResendEmail({
      from,
      to: [adminEmail],
      reply_to: [payload.buyerEmail],
      subject: adminSubject,
      html: renderAdminEmail(payload),
    }),
    sendResendEmail({
      from,
      to: [payload.buyerEmail],
      subject: buyerSubject,
      html: renderBuyerEmail(payload),
    }),
  ]);

  return {
    adminNotification,
    buyerConfirmation,
  };
}
