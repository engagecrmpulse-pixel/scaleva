import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";

const PROVIDER_AUTH_URLS: Record<
  string,
  (redirectUri: string, state: string) => string
> = {
  square: (redirectUri, state) =>
    `https://connect.squareup.com/oauth2/authorize?client_id=${process.env.SQUARE_CLIENT_ID}&scope=CUSTOMERS_READ+CUSTOMERS_WRITE+ORDERS_READ+LOYALTY_READ&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,

  stripe: (redirectUri, state) =>
    `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CONNECT_CLIENT_ID}&scope=read_only&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,

  shopify: (_redirectUri, _state) => `/onboarding?shopify_pending=1`,

  toast: (_redirectUri, _state) => `/onboarding?toast_pending=1`,

  hubspot: (redirectUri, state) =>
    `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=crm.objects.contacts.read+crm.objects.deals.read+crm.objects.companies.read+sales-email-read&state=${state}`,
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
