import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // 5 signups per hour per IP
  const rl = rateLimit(`signup:${ip}`, 5, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many signups from this IP. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = sanitizeEmail(body.email ?? "");
  if (!email) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!body.password || body.password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createClient();
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data, error } = await supabase.auth.signUp({
    email,
    password: body.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    hasSession: !!data.session,
    needsEmailConfirmation: !data.session,
  });
}
