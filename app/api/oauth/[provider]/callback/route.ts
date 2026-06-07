import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";

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

  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};

  oauthTokens[provider] = code;
  integrations[provider] = {
    connected: true,
    lastSync: new Date().toISOString(),
  };

  await supabase
    .from("businesses")
    .update({
      config: {
        ...existingConfig,
        oauthTokens,
        integrations,
      },
    })
    .eq("id", business.id);

  return NextResponse.redirect(
    new URL(`/dashboard?oauth_connected=${provider}`, request.url)
  );
}
