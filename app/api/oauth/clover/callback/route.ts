import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";
import { exchangeCloverToken, extractCloverCustomers } from "@/lib/oauth/clover";

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
    return NextResponse.redirect(new URL("/settings?oauth_error=clover", request.url));
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";
  let tokenJson: string;
  try {
    tokenJson = await exchangeCloverToken(code, `${appUrl}/api/oauth/clover/callback`);
  } catch {
    return NextResponse.redirect(new URL("/settings?oauth_error=clover_token", request.url));
  }

  const customers = await extractCloverCustomers(tokenJson).catch(() => []);
  let customersSynced = 0;

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

    for (let i = 0; i < rows.length; i += 100) {
      const { error: upsertError } = await supabase.from("customers").upsert(
        rows.slice(i, i + 100),
        { onConflict: "business_id,phone", ignoreDuplicates: false }
      );
      if (!upsertError) customersSynced += rows.slice(i, i + 100).length;
    }
  }

  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};

  oauthTokens.clover = tokenJson;
  integrations.clover = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced,
  };

  await supabase
    .from("businesses")
    .update({ config: { ...existingConfig, oauthTokens, integrations } })
    .eq("id", business.id);

  return NextResponse.redirect(
    new URL(`/settings?oauth_connected=clover&synced=${customersSynced}`, request.url)
  );
}
