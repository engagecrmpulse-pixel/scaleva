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

function extractDescriptions(history: SpendHistoryEntry[], limit = 4): string {
  const items = history
    .filter((h) => h.description?.trim())
    .slice(-limit)
    .map((h) => h.description!.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i);
  return items.join(", ");
}

function visitFrequency(history: SpendHistoryEntry[]): string {
  if (history.length < 2) return "";
  const sorted = history.map((h) => new Date(h.date).getTime()).sort((a, b) => a - b);
  const spanDays = (sorted[sorted.length - 1] - sorted[0]) / 86400000;
  if (spanDays === 0) return "";
  const avgGap = Math.round(spanDays / (history.length - 1));
  if (avgGap <= 7) return "weekly";
  if (avgGap <= 14) return "every couple of weeks";
  if (avgGap <= 35) return "roughly monthly";
  return "occasionally";
}

function currentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
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
  totalSpendAmount: number,
  history: SpendHistoryEntry[]
): string {
  const firstName = customerFirstName.split(" ")[0];
  const goalList = goals.toLowerCase();
  const hasLoyalty = goalList.includes("loyalty");
  const ind = industry.toLowerCase();
  const items = extractDescriptions(history);
  const freq = visitFrequency(history);
  const season = currentSeason();

  let industryGuidance = "";

  if (ind === "restaurant") {
    const dishNote = items
      ? `Their recent orders include: ${items}. Reference a specific dish by name in the message.`
      : "Reference the food experience.";
    const freqNote = freq ? `They usually come in ${freq}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `It has been ${daysSinceLastVisit} days since their last visit.` : "";
    industryGuidance =
      `This is a restaurant. ${daysNote} ${freqNote} ${dishNote} ` +
      `Avg transaction: ${formatCurrency(avgSpendAmount)}. ` +
      `Sound like a staff member or manager texting personally — never generic. ` +
      `${hasLoyalty ? "Mention loyalty rewards or a perk. " : ""}` +
      `NEVER say "we miss you" or "valued customer." NEVER sound like a newsletter.`;
  } else if (ind === "salon") {
    const serviceNote = items
      ? `Their last services: ${items}.`
      : "Reference their last salon visit.";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since their last appointment.` : "";
    const freqNote = freq ? `They usually come in ${freq}.` : "";
    industryGuidance =
      `This is a salon or beauty business. ${daysNote} ${freqNote} ${serviceNote} ` +
      `Write exactly like their personal stylist or esthetician texting — warm, casual, first name only. ` +
      `Suggest booking their next appointment naturally. ` +
      `${hasLoyalty ? "Mention a loyalty perk or discount. " : ""}` +
      `NEVER say "we miss you" or "valued customer." NEVER use formal business language.`;
  } else if (ind === "construction") {
    const projectNote = items
      ? `Last project type: ${items}. Avg project value: ${formatCurrency(avgSpendAmount)}.`
      : `Avg project value: ${formatCurrency(avgSpendAmount)}.`;
    industryGuidance =
      `This is a construction or contracting business. Current season: ${season}. ${projectNote} ` +
      `Suggest a seasonal follow-up, maintenance check, or new project idea relevant to ${season}. ` +
      `Reference the type of work they've had done. Professional but warm tone. ` +
      `Total relationship value: ${formatCurrency(totalSpendAmount)}. ` +
      `Sound like the owner or contractor checking in personally.`;
  } else if (ind === "retail") {
    const itemNote = items
      ? `Recent purchases: ${items}.`
      : "Reference their shopping history.";
    const freqNote = freq ? `They shop ${freq}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `Last visited ${daysSinceLastVisit} days ago.` : "";
    industryGuidance =
      `This is a retail store. ${daysNote} ${freqNote} ${itemNote} ` +
      `Sound like a friend who works at the store and just saw something they'd love. ` +
      `Reference the specific item(s) they've bought before. Avg purchase: ${formatCurrency(avgSpendAmount)}. ` +
      `${hasLoyalty ? "Mention a member perk or exclusive deal. " : ""}` +
      `NEVER say "valued customer" or use any formal marketing language.`;
  } else if (ind === "fitness") {
    const classNote = items ? `Their usual activities: ${items}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `They haven't checked in for ${daysSinceLastVisit} days.` : "";
    const streakNote = history.length > 1 ? `They've visited ${history.length} times total.` : "";
    industryGuidance =
      `This is a gym or fitness business. ${daysNote} ${streakNote} ${classNote} ` +
      `Be motivating and energetic — never shaming or guilt-tripping. ` +
      `Sound like their trainer or coach texting. Reference their routine or favorite class if known. ` +
      `${hasLoyalty ? "Mention a member benefit or class perk. " : ""}` +
      `NEVER say "we miss you." Make them feel excited to come back, not guilty for leaving.`;
  } else if (ind === "healthcare") {
    const typeNote = items ? `Last interaction: ${items}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last visit.` : "";
    industryGuidance =
      `This is a healthcare provider (medical, dental, therapy, etc.). ${daysNote} ${typeNote} ` +
      `Professional and warm tone. Suggest a follow-up appointment or check-in naturally. ` +
      `Keep it brief and non-clinical. Sound like the office reaching out personally.`;
  } else if (ind === "legal") {
    const typeNote = items ? `Last matter type: ${items}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last interaction.` : "";
    industryGuidance =
      `This is a legal practice. ${daysNote} ${typeNote} ` +
      `Professional, warm, and concise. Reference their last interaction type. ` +
      `Suggest a check-in or follow-up. Sound like the attorney or paralegal reaching out personally.`;
  } else if (ind === "real estate") {
    const typeNote = items ? `Last interaction: ${items}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last contact.` : "";
    industryGuidance =
      `This is a real estate business. ${daysNote} ${typeNote} ` +
      `Professional, personable, brief. Market context: it's ${season}. ` +
      `Reference their last interaction and suggest a natural check-in or market update. ` +
      `Sound like the agent reaching out to a valued client personally.`;
  } else {
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last visit.` : "";
    industryGuidance =
      `${daysNote} Personalize this re-engagement message based on their purchase history. ` +
      `Total spend: ${formatCurrency(totalSpendAmount)}. ` +
      (items ? `Their interests/purchases: ${items}. ` : "") +
      `Make it feel personal, not like a mass text.`;
  }

  const spendContext =
    totalSpendAmount > 0
      ? `Customer lifetime spend: ${formatCurrency(totalSpendAmount)}. Avg transaction: ${formatCurrency(avgSpendAmount)}.`
      : "";

  const customNote = customInstructions
    ? `\n\nAdditional business rules (always follow these): ${customInstructions}`
    : "";

  return (
    `You are an expert SMS copywriter for local businesses. Write ONE personalized SMS under 160 characters. ` +
    `Voice/tone: ${voice}. Address customer by first name only (${firstName}). ` +
    `Never sound like a template, mass text, or marketing email. No markdown, no placeholders, no emojis unless they feel natural. ` +
    `Return ONLY the message body — nothing else.\n\n` +
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
    totalSpendAmount,
    history
  );

  const userContent = [
    `Business: ${business.name} (${business.industry ?? "small business"})`,
    `Customer first name: ${firstName}`,
    `Goals: ${goals || "re-engage the customer"}`,
    daysSinceLastVisit !== null ? `Days since last visit: ${daysSinceLastVisit}` : null,
    customer.last_purchase ? `Last purchase date: ${customer.last_purchase}` : null,
    totalSpendAmount > 0 ? `Total lifetime spend: ${formatCurrency(totalSpendAmount)}` : null,
    history.length > 0 ? `Visit count: ${history.length}` : null,
    "",
    "Write the SMS message now. Under 160 characters. First name only. Must feel personal and specific.",
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
