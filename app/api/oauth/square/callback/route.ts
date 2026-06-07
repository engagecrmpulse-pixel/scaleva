import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";

interface SquareTokenResponse {
  access_token?: string;
  error?: string;
  message?: string;
}

interface SquareCustomer {
  id: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  email_address?: string;
  created_at?: string;
}

interface SquareCustomersResponse {
  customers?: SquareCustomer[];
  cursor?: string;
  errors?: { detail: string }[];
}

async function fetchAllSquareCustomers(accessToken: string): Promise<SquareCustomer[]> {
  const customers: SquareCustomer[] = [];
  let cursor: string | undefined;
  const SQUARE_VERSION = "2024-01-17";

  for (let page = 0; page < 10; page++) {
    const url = new URL("https://connect.squareup.com/v2/customers");
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) break;

    const data: SquareCustomersResponse = await res.json();
    if (data.customers) customers.push(...data.customers);
    if (!data.cursor) break;
    cursor = data.cursor;
  }

  return customers;
}

export async function GET(request: NextRequest) {
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

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?oauth_error=square", request.url));
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, config")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];
  if (!business) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Exchange auth code for access token
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2024-01-17",
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/oauth/square/callback`,
      }),
    });

    const tokenData: SquareTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/settings?oauth_error=square_token", request.url));
    }
    accessToken = tokenData.access_token;
  } catch {
    return NextResponse.redirect(new URL("/settings?oauth_error=square_network", request.url));
  }

  // Fetch customers from Square
  const squareCustomers = await fetchAllSquareCustomers(accessToken).catch(() => []);

  // Upsert customers into Supabase
  let customersSynced = 0;
  if (squareCustomers.length > 0) {
    const rows = squareCustomers
      .filter((c) => c.given_name || c.family_name)
      .map((c) => ({
        business_id: business.id,
        name: [c.given_name, c.family_name].filter(Boolean).join(" "),
        phone: c.phone_number ?? null,
        email: c.email_address ?? null,
        last_purchase: c.created_at ?? null,
        spend_history: [],
      }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("customers").insert(rows);
      if (!insertError) customersSynced = rows.length;
    }
  }

  // Store token + integration info in business config
  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};

  oauthTokens.square = accessToken;
  integrations.square = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced,
  };

  await supabase
    .from("businesses")
    .update({ config: { ...existingConfig, oauthTokens, integrations } })
    .eq("id", business.id);

  return NextResponse.redirect(
    new URL(`/settings?oauth_connected=square&synced=${customersSynced}`, request.url)
  );
}
