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
  // ── Live integrations ─────────────────────────────────────────────────────
  square: (redirectUri, state) =>
    `https://connect.squareup.com/oauth2/authorize?client_id=${process.env.SQUARE_CLIENT_ID}&scope=CUSTOMERS_READ+CUSTOMERS_WRITE+ORDERS_READ+LOYALTY_READ&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,

  stripe: (redirectUri, state) =>
    `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CONNECT_CLIENT_ID}&scope=read_only&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,

  hubspot: (redirectUri, state) =>
    `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=crm.objects.contacts.read+crm.objects.deals.read+crm.objects.companies.read+sales-email-read&state=${state}`,

  clover: (_redirectUri, _state) =>
    `${CLOVER_BASE}/oauth/authorize?client_id=${process.env.CLOVER_APP_ID}&response_type=code`,

  // ── Coming soon — redirect back with pending flag ─────────────────────────
  shopify: (_redirectUri, _state) => `/onboarding?integration_pending=shopify`,
  toast: (_redirectUri, _state) => `/onboarding?integration_pending=toast`,
  lightspeed: (_redirectUri, _state) => `/onboarding?integration_pending=lightspeed`,
  revel: (_redirectUri, _state) => `/onboarding?integration_pending=revel`,
  mindbody: (_redirectUri, _state) => `/onboarding?integration_pending=mindbody`,
  vagaro: (_redirectUri, _state) => `/onboarding?integration_pending=vagaro`,
  fresha: (_redirectUri, _state) => `/onboarding?integration_pending=fresha`,
  acuity: (_redirectUri, _state) => `/onboarding?integration_pending=acuity`,
  woocommerce: (_redirectUri, _state) => `/onboarding?integration_pending=woocommerce`,
  bigcommerce: (_redirectUri, _state) => `/onboarding?integration_pending=bigcommerce`,
  salesforce: (_redirectUri, _state) => `/onboarding?integration_pending=salesforce`,
  pipedrive: (_redirectUri, _state) => `/onboarding?integration_pending=pipedrive`,
  jobber: (_redirectUri, _state) => `/onboarding?integration_pending=jobber`,
  housecall: (_redirectUri, _state) => `/onboarding?integration_pending=housecall`,
  servicetitan: (_redirectUri, _state) => `/onboarding?integration_pending=servicetitan`,
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
