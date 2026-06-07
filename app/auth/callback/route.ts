import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, fromEmail, welcomeEmailHtml } from "@/lib/resend";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Send welcome email on first signup confirmation
      if (type === "signup" && data.user?.email) {
        const resend = getResend();
        if (resend) {
          const name = data.user.email.split("@")[0];
          await resend.emails.send({
            from: fromEmail(),
            to: data.user.email,
            subject: "Welcome to Scaleva — let's get your first message sent",
            html: welcomeEmailHtml(name),
          }).catch(() => null);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
