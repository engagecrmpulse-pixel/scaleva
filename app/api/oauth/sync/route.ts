import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractSquareCustomers } from "@/lib/oauth/square";
import { extractStripeCustomers } from "@/lib/oauth/stripe";
import { extractHubSpotCustomers } from "@/lib/oauth/hubspot";
import type { ExtractedCustomer } from "@/lib/oauth/types";

// Called by the onboarding wizard after an OAuth redirect to pull staged
// customer data using the access token stored in user metadata.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = (await request.json()) as { provider: string };

  const staged = (user.user_metadata?.oauth_staged as Record<string, string>) ?? {};
  const token = staged[provider];

  if (!token) {
    return NextResponse.json({ customers: [] });
  }

  let customers: ExtractedCustomer[] = [];
  try {
    switch (provider) {
      case "square":
        customers = await extractSquareCustomers(token);
        break;
      case "stripe":
        customers = await extractStripeCustomers(token);
        break;
      case "hubspot":
        customers = await extractHubSpotCustomers(token);
        break;
    }
  } catch {
    return NextResponse.json({ customers: [], tokenValid: false });
  }

  // Clear the staged token now that we've used it
  const remaining = { ...staged };
  delete remaining[provider];
  await supabase.auth.updateUser({ data: { oauth_staged: remaining } });

  return NextResponse.json({ customers, tokenValid: true });
}
