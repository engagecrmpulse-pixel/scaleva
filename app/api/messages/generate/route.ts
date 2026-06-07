import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL, generateOutreachMessage, type OutreachParams } from "@/lib/claude";
import { formatCurrency, totalSpend } from "@/utils/helpers";
import { rateLimit } from "@/lib/rate-limit";
import type { SpendHistoryEntry } from "@/utils/database.types";

interface GenerateRequestBody {
  customerId?: string;
  preview?: Partial<OutreachParams>;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function avgSpend(history: SpendHistoryEntry[]): number {
  if (!history?.length) return 0;
  return totalSpend(history) / history.length;
}

function buildSystemPrompt(
  industry: string,
  voice: string,
  goals: string,
  customInstructions: string | undefined,
  customerFirstName: string,
  daysSinceLastVisit: number | null,
  lastPurchase: string | null,
  avgSpendAmount: number,
  totalSpendAmount: number
): string {
  const goalList = goals.toLowerCase();
  const hasLoyalty = goalList.includes("loyalty");
  const firstName = customerFirstName.split(" ")[0];
  const visitNote = daysSinceLastVisit !== null
    ? `It has been ${daysSinceLastVisit} days since their last visit.`
    : "";

  let industryGuidance = "";
  const ind = industry.toLowerCase();

  if (ind === "restaurant") {
    industryGuidance = `This is a restaurant. ${visitNote} Encourage ${firstName} to come back${hasLoyalty ? " and mention loyalty rewards" : ""}. Reference their last visit warmly.`;
  } else if (ind === "construction") {
    industryGuidance = `This is a construction business. Reference their last project${lastPurchase ? ` (around ${lastPurchase})` : ""}. Suggest seasonal follow-up or maintenance check.`;
  } else if (ind === "salon") {
    industryGuidance = `This is a salon. ${visitNote} Suggest booking their next appointment${hasLoyalty ? " and mention loyalty rewards" : ""}. Reference their last service.`;
  } else if (ind === "retail") {
    industryGuidance = `This is a retail business. Reference their last purchase and suggest related products or a return visit.`;
  } else if (ind === "fitness") {
    industryGuidance = `This is a fitness business. ${visitNote} Motivate ${firstName} to re-engage and get back on track.`;
  } else if (ind === "healthcare") {
    industryGuidance = `This is a healthcare provider. Use a professional tone. Reference their last interaction and suggest a follow-up appointment.`;
  } else if (ind === "legal") {
    industryGuidance = `This is a legal practice. Use a professional tone. Reference their last interaction and suggest a follow-up.`;
  } else if (ind === "real estate") {
    industryGuidance = `This is a real estate business. Use a professional tone. Reference their last interaction and suggest a check-in.`;
  } else {
    industryGuidance = `Personalize this re-engagement message based on their purchase history. ${visitNote}`;
  }

  const spendContext = totalSpendAmount > 0
    ? `Customer lifetime spend: ${formatCurrency(totalSpendAmount)}. Average transaction: ${formatCurrency(avgSpendAmount)}.`
    : "";

  const customNote = customInstructions
    ? `\n\nAdditional business instructions: ${customInstructions}`
    : "";

  return (
    `You are an expert SMS copywriter. Write ONE personalized SMS message under 160 characters total. ` +
    `Voice/tone: ${voice}. Always address the customer by first name only (${firstName}). ` +
    `Never sound like a template or mass text. No markdown, no placeholders. Return only the message body.\n\n` +
    `${industryGuidance} ${spendContext}${customNote}`
  );
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

  // ---- Preview mode -------------------------------------------------------
  if (body.preview) {
    const { customerName, businessName, industry, voice, goal, context } = body.preview;

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

  // ---- DB mode ------------------------------------------------------------
  if (!body.customerId) {
    return NextResponse.json(
      { error: "customerId or preview is required" },
      { status: 400 }
    );
  }

  // Rate limit: 100 generates/min per user
  const rl = rateLimit(`generate:${user.id}`, 100);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
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

  const history: SpendHistoryEntry[] = customer.spend_history ?? [];
  const totalSpendAmount = totalSpend(history);
  const avgSpendAmount = avgSpend(history);
  const daysSinceLastVisit = daysSince(customer.last_purchase);
  const firstName = customer.name.split(" ")[0];
  const customInstructions = business.config?.customInstructions;
  const goals = business.goals ?? "";

  const systemPrompt = buildSystemPrompt(
    business.industry ?? "small business",
    business.voice ?? "friendly",
    goals,
    customInstructions,
    customer.name,
    daysSinceLastVisit,
    customer.last_purchase,
    avgSpendAmount,
    totalSpendAmount
  );

  const userContent = [
    `Business: ${business.name}`,
    `Customer first name: ${firstName}`,
    `Goals for this message: ${goals || "re-engage the customer"}`,
    daysSinceLastVisit !== null
      ? `Days since last visit: ${daysSinceLastVisit}`
      : null,
    customer.last_purchase ? `Last purchase date: ${customer.last_purchase}` : null,
    totalSpendAmount > 0
      ? `Total lifetime spend: ${formatCurrency(totalSpendAmount)}`
      : null,
    customer.next_contact_date
      ? `Next contact date: ${customer.next_contact_date}`
      : null,
    "",
    "Write the SMS message now. Under 160 characters. First name only. Not a template.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const block = response.content[0];
    const message = block?.type === "text" ? block.text.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate message", detail },
      { status: 502 }
    );
  }
}
