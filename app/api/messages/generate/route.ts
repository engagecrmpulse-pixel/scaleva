import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOutreachMessage, type OutreachParams } from "@/lib/claude";
import { formatCurrency, totalSpend } from "@/utils/helpers";

/**
 * POST /api/messages/generate
 *
 * Two modes (auth required for both):
 *
 * 1. DB mode — Body: { customerId: string }
 *    Looks the customer + business up in the database (ownership enforced via
 *    RLS) and generates a personalized outreach message.
 *
 * 2. Preview mode — Body: { preview: OutreachParams }
 *    Generates a message directly from the supplied params without touching
 *    the database. Used by the onboarding wizard's "Preview AI Message" step,
 *    where the business and customers only exist in client state and have not
 *    been persisted yet.
 *
 * Either way the response is { message: string } or an { error, detail }.
 */
interface GenerateRequestBody {
  customerId?: string;
  preview?: Partial<OutreachParams>;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ---- Mode 2: inline preview (no DB lookup) ----------------------------
  if (body.preview) {
    const { customerName, businessName, industry, voice, goal, context } =
      body.preview;

    if (!customerName || !businessName) {
      return NextResponse.json(
        { error: "preview requires at least customerName and businessName" },
        { status: 400 }
      );
    }

    try {
      const message = await generateOutreachMessage({
        customerName,
        businessName,
        industry: industry ?? "small business",
        voice: voice ?? "friendly",
        goal: goal ?? "re-engage the customer",
        context,
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

  // ---- Mode 1: existing DB-backed path ----------------------------------
  if (!body.customerId) {
    return NextResponse.json(
      { error: "customerId or preview is required" },
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
