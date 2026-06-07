import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export function fromEmail(): string {
  return process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@scaleva.app";
}

export function welcomeEmailHtml(name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Scaleva</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#0f1117;padding:28px 32px;">
          <span style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">Scaleva</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
            Welcome to Scaleva — your AI-powered SMS re-engagement tool. You're one step away from
            sending personalized messages that actually get responses.
          </p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">Get started in 3 steps:</p>
          <ol style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
            <li>Complete your onboarding wizard</li>
            <li>Import your customers (CSV, Square, or Stripe)</li>
            <li>Hit "Send" and watch replies come in</li>
          </ol>
          <table cellpadding="0" cellspacing="0"><tr><td>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app"}/dashboard"
               style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
              Go to dashboard →
            </a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You're receiving this because you created a Scaleva account.
            Questions? Reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
