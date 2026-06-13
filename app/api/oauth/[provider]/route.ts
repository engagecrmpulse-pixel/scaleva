import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";

const CLOVER_BASE =
  process.env.CLOVER_ENV === "sandbox"
    ? "https://sandbox.dev.clover.com"
    : "https://www.clover.com";

const PROVIDER_AUTH_URLS: Record<
  string,
  (redirectUri: string, state: string) => string
> = {
  square: (redirectUri, state) =>
    `https://connect.squareup.com/oauth2/authorize?client_id=${process.env.SQUARE_CLIENT_ID}&scope=CUSTOMERS_READ+CUSTOMERS_WRITE+ORDERS_READ+LOYALTY_READ&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,

  clover: (_redirectUri, _state) =>
    `${CLOVER_BASE}/oauth/authorize?client_id=${process.env.CLOVER_CLIENT_ID}&response_type=code`,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const provider = params.provider.toLowerCase();
  const buildUrl = PROVIDER_AUTH_URLS[provider];

  if (!buildUrl) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id, provider })).toString("base64");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app"}/api/oauth/${provider}/callback`;

  const url = buildUrl(redirectUri, state);

  return NextResponse.redirect(url);
}
