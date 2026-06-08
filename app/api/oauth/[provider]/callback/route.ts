import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";
import { exchangeSquareToken, extractSquareCustomers } from "@/lib/oauth/square";
import { exchangeStripeToken, extractStripeCustomers } from "@/lib/oauth/stripe";
import { exchangeHubSpotToken, extractHubSpotCustomers } from "@/lib/oauth/hubspot";
import type { ExtractedCustomer } from "@/lib/oauth/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";

async function getAccessToken(
  provider: string,
  code: string,
  redirectUri: string
): Promise<string> {
  switch (provider) {
    case "square":
      return exchangeSquareToken(code, redirectUri);
    case "stripe":
      return exchangeStripeToken(code);
    case "hubspot":
      return exchangeHubSpotToken(code, redirectUri);
    default:
      return code; // passthrough for unimplemented providers
  }
}

async function extractCustomers(
  provider: string,
  accessToken: string
): Promise<ExtractedCustomer[]> {
  switch (provider) {
    case "square":
      return extractSquareCustomers(accessToken);
    case "stripe":
      return extractStripeCustomers(accessToken);
    case "hubspot":
      return extractHubSpotCustomers(accessToken);
    default:
      return [];
  }
}

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

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const provider = params.provider.toLowerCase();

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${provider}`, request.url)
    );
  }

  const redirectUri = `${APP_URL}/api/oauth/${provider}/callback`;

  // Exchange auth code for access token
  let accessToken: string;
  try {
    accessToken = await getAccessToken(provider, code, redirectUri);
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard?oauth_error=${provider}_token`, request.url)
    );
  }

  // Check if a business already exists (dashboard flow) or not (onboarding flow)
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, config")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];

  if (!business) {
    // Onboarding flow: stage the access token in user metadata so the wizard
    // can read it after redirect without losing its state.
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const staged = (currentUser?.user_metadata?.oauth_staged as Record<string, string>) ?? {};
    staged[provider] = accessToken;
    await supabase.auth.updateUser({ data: { oauth_staged: staged } });

    return NextResponse.redirect(
      new URL(`/onboarding?oauth_connected=${provider}`, request.url)
    );
  }

  // Dashboard flow: exchange token, pull all customer data, upsert to Supabase
  let customers: ExtractedCustomer[] = [];
  try {
    customers = await extractCustomers(provider, accessToken);
  } catch {
    // Token exchanged successfully but data fetch failed — still mark connected
  }

  const existingConfig: BusinessConfig =
    (business.config as BusinessConfig) ?? {};
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};

  oauthTokens[provider] = accessToken;
  integrations[provider] = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced: customers.length,
  };

  await supabase
    .from("businesses")
    .update({
      config: { ...existingConfig, oauthTokens, integrations },
    })
    .eq("id", business.id);

  // Upsert customers — deduplicate by phone/email within this business
  if (customers.length > 0) {
    const rows = customers.map((c) => ({
      business_id: business.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      last_purchase: c.last_purchase,
      spend_history: c.spend_history,
      return_visit_count: c.return_visit_count,
      last_return_date: c.last_return_date,
      status: c.status,
    }));

    // Batch upsert in chunks of 100 to avoid payload limits
    for (let i = 0; i < rows.length; i += 100) {
      await supabase.from("customers").upsert(rows.slice(i, i + 100), {
        onConflict: "business_id,phone",
        ignoreDuplicates: false,
      });
    }
  }

  return NextResponse.redirect(
    new URL(`/dashboard?oauth_connected=${provider}`, request.url)
  );
}
