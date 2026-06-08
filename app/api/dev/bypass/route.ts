import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only available outside production
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { code } = await request.json() as { code: string };

  const expected = process.env.DEV_BYPASS_CODE;
  const email = process.env.DEV_EMAIL;
  const password = process.env.DEV_PASSWORD;

  if (!expected || !email || !password) {
    return NextResponse.json(
      { error: "DEV_BYPASS_CODE, DEV_EMAIL, and DEV_PASSWORD must be set in .env.local" },
      { status: 500 }
    );
  }

  if (code !== expected) {
    return NextResponse.json({ error: "Invalid bypass code" }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Sign-in failed" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
