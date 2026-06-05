import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOutreachMessage } from "@/lib/claude";
import { formatCurrency, totalSpend } from "@/utils/helpers";

/**
 * POST /api/messages/generate
 * Body: { customerId: string }
 * Generates (but does not send) a personalized outreach message for a
 * customer using Claude. Auth + ownership are enforced via RLS.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.customerId) {
    return NextResponse.json(
      { error: "customerId is required" },
      { status: 400 }
    );
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", body.customerId)
    .maybeSingle();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", customer.business_id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  try {
    const message = await generateOutreachMessage({
      customerName: customer.name,
      businessName: business.name,
      industry: business.industry ?? "small business",
      voice: business.voice ?? "friendly",
      goal: business.goals ?? "re-engage the customer",
      context: `Lifetime spend: ${formatCurrency(
        totalSpend(customer.spend_history)
      )}. Last purchase: ${customer.last_purchase ?? "unknown"}.`,
    });

    return NextResponse.json({ message });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate message", detail },
      { status: 502 }
    );
  }
}
