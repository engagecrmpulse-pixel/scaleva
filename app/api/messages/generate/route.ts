import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL, generateOutreachMessage, type OutreachParams } from "@/lib/claude";
import { formatCurrency, totalSpend } from "@/utils/helpers";
import { rateLimit } from "@/lib/rate-limit";
import type { SpendHistoryEntry } from "@/utils/database.types";

interface GenerateRequestBody {
  customerId?: string;
  preview?: Partial<OutreachParams>;
  segment?: string;
}

function daysSinceDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function calcAvgSpend(history: SpendHistoryEntry[]): number {
  if (!history?.length) return 0;
  return totalSpend(history) / history.length;
}

function visitFrequencyDays(history: SpendHistoryEntry[]): number | null {
  if (history.length < 2) return null;
  const sorted = history.map((h) => new Date(h.date).getTime()).sort((a, b) => a - b);
  const spanDays = (sorted[sorted.length - 1] - sorted[0]) / 86400000;
  if (spanDays === 0) return null;
  return Math.round(spanDays / (history.length - 1));
}

function visitFrequencyLabel(history: SpendHistoryEntry[]): string {
  const days = visitFrequencyDays(history);
  if (days === null) return "";
  if (days <= 7) return "weekly";
  if (days <= 14) return "every couple of weeks";
  if (days <= 35) return "roughly monthly";
  return "occasionally";
}

function lastItemNames(history: SpendHistoryEntry[], limit = 2): string {
  return history
    .filter((h) => h.description?.trim())
    .slice(-limit)
    .map((h) => h.description!.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(" and ");
}

function allItemDescriptions(history: SpendHistoryEntry[], limit = 4): string {
  const items = history
    .filter((h) => h.description?.trim())
    .slice(-limit)
    .map((h) => h.description!.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i);
  return items.join(", ");
}

function currentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

interface PersonalityConfig {
  tone: string;
  length: string;
  emoji: string;
  signature: string;
  forbiddenWords: string;
  noCompetitors: boolean;
  includeOffers: boolean;
  currentOffer: string;
  language: string;
  customOpener: string;
}

function buildPersonalityInstructions(p: PersonalityConfig): string {
  const parts: string[] = [];
  parts.push(`Tone must be ${p.tone}.`);

  const lengthMap: Record<string, string> = {
    "Short (under 80 chars)": "under 80 characters",
    "Medium (80-120 chars)": "80-120 characters",
    "Full (120-160 chars)": "120-160 characters",
  };
  parts.push(`Message must be ${lengthMap[p.length] ?? "under 160 characters"}.`);

  const emojiMap: Record<string, string> = {
    Never: "never",
    Sparingly: "sparingly (1 max)",
    Often: "freely",
  };
  parts.push(`Use emojis ${emojiMap[p.emoji] ?? "sparingly"}.`);

  if (p.signature) parts.push(`End every message with: ${p.signature}`);
  if (p.forbiddenWords) parts.push(`Never use these words or phrases: ${p.forbiddenWords}.`);
  if (p.noCompetitors) parts.push("Never mention any competitors.");
  if (p.includeOffers && p.currentOffer) parts.push(`If relevant, mention this current offer: ${p.currentOffer}.`);
  parts.push(`Write entirely in ${p.language}.`);
  if (p.customOpener) parts.push(p.customOpener);

  return parts.join(" ");
}

function buildSystemPrompt(
  industry: string,
  businessName: string,
  goals: string,
  history: SpendHistoryEntry[],
  customerName: string,
  daysSinceLastVisit: number | null,
  avgSpendAmount: number,
  totalSpendAmount: number,
  personality: PersonalityConfig
): string {
  const firstName = customerName.split(" ")[0];
  const season = currentSeason();
  const freqDays = visitFrequencyDays(history);
  const freqLabel = visitFrequencyLabel(history);
  const isOverdue = freqDays !== null && daysSinceLastVisit !== null
    ? daysSinceLastVisit > freqDays * 1.2
    : false;
  const lastItems = lastItemNames(history, 2);
  const allItems = allItemDescriptions(history, 4);
  const goalList = goals.toLowerCase();
  const hasLoyalty = goalList.includes("loyalty");
  const ind = industry.toLowerCase();
  const personalityInstructions = buildPersonalityInstructions(personality);

  let industryPrompt = "";

  if (ind === "restaurant") {
    const freqNote = freqDays ? `usually every ${freqDays} days — ${isOverdue ? "they are overdue" : "on schedule"}` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days ago` : "";
    const itemNote = lastItems ? `Last ordered: ${lastItems}.` : allItems ? `Recent orders: ${allItems}.` : "";
    industryPrompt =
      `Write a personal SMS from the owner of ${businessName}. ` +
      `${firstName} last visited ${daysNote}${freqNote ? ` (${freqNote})` : ""}. ` +
      `${itemNote} Avg spend $${avgSpendAmount.toFixed(2)}. Lifetime $${totalSpendAmount.toFixed(2)}. ` +
      `${hasLoyalty ? "Mention a loyalty perk or reward. " : ""}` +
      `${personalityInstructions} Never sound like marketing.`;
  } else if (ind === "salon") {
    const freqNote = freqDays ? `every ${freqDays} days normally` : freqLabel;
    const itemNote = lastItems ? `last got ${lastItems}` : allItems ? `last had ${allItems}` : "last visited";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days ago` : "";
    industryPrompt =
      `Write a personal SMS from a stylist at ${businessName}. ` +
      `${firstName} ${itemNote} ${daysNote}${freqNote ? ` (${freqNote})` : ""}. ` +
      `Total spent $${totalSpendAmount.toFixed(2)}. ` +
      `${hasLoyalty ? "Mention a loyalty perk or discount. " : ""}` +
      `${personalityInstructions} Sound like their stylist texting them personally.`;
  } else if (ind === "construction") {
    const itemNote = lastItems
      ? `last had ${lastItems} done ${daysSinceLastVisit !== null ? `${daysSinceLastVisit} days ago` : ""} worth $${avgSpendAmount.toFixed(2)}`
      : `last project was ${daysSinceLastVisit !== null ? `${daysSinceLastVisit} days ago` : "a while back"}`;
    industryPrompt =
      `Write a personal SMS from the owner of ${businessName}. It is ${season}. ` +
      `${firstName} ${itemNote}. Suggest a relevant ${season} project or maintenance check. ` +
      `${personalityInstructions}`;
  } else if (ind === "retail") {
    const freqNote = freqDays ? `Usually shops every ${freqDays} days.` : freqLabel ? `Usually shops ${freqLabel}.` : "";
    const itemNote = lastItems ? `bought ${lastItems}` : allItems ? `bought ${allItems}` : "shopped with you";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days ago` : "";
    industryPrompt =
      `Write a personal SMS from ${businessName}. ` +
      `${firstName} ${itemNote} ${daysNote}. Total spent $${totalSpendAmount.toFixed(2)}. ${freqNote} ` +
      `${hasLoyalty ? "Mention a member perk or exclusive deal. " : ""}` +
      `${personalityInstructions} Sound like a friend at the store.`;
  } else if (ind === "fitness") {
    const itemNote = lastItems ? `Favorite: ${lastItems}.` : allItems ? `Activities: ${allItems}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${firstName} last came in ${daysSinceLastVisit} days ago.` : "";
    industryPrompt =
      `Write a personal SMS from a coach at ${businessName}. ` +
      `${daysNote} ${itemNote} Investment $${totalSpendAmount.toFixed(2)}/year. ` +
      `${hasLoyalty ? "Mention a member benefit or class perk. " : ""}` +
      `${personalityInstructions} Motivating, not shaming.`;
  } else if (ind === "healthcare") {
    const itemNote = lastItems ? `Last interaction: ${lastItems}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last visit.` : "";
    industryPrompt =
      `Write a professional, warm personal SMS from ${businessName}. ` +
      `${daysNote} ${itemNote} Suggest a follow-up appointment naturally. ` +
      `${personalityInstructions}`;
  } else if (ind === "legal") {
    const itemNote = lastItems ? `Last matter: ${lastItems}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last interaction.` : "";
    industryPrompt =
      `Write a personal SMS from ${businessName}. ` +
      `${daysNote} ${itemNote} Suggest a check-in or follow-up. ` +
      `${personalityInstructions} Sound like the attorney or paralegal.`;
  } else if (ind === "real estate") {
    const itemNote = lastItems ? `Last interaction: ${lastItems}.` : "";
    const daysNote = daysSinceLastVisit !== null ? `${daysSinceLastVisit} days since last contact.` : "";
    industryPrompt =
      `Write a personal SMS from ${businessName}. Market context: it's ${season}. ` +
      `${daysNote} ${itemNote} Reference their last interaction naturally. ` +
      `${personalityInstructions} Sound like the agent reaching out personally.`;
  } else {
    const daysNote = daysSinceLastVisit !== null ? `${firstName} last interacted ${daysSinceLastVisit} days ago.` : "";
    const itemNote = allItems ? `Their interests/purchases: ${allItems}.` : "";
    industryPrompt =
      `Write a personal SMS from ${businessName}. ` +
      `${daysNote} Total value $${totalSpendAmount.toFixed(2)}. ${itemNote} ` +
      `Goals: ${goals || "re-engage the customer"}. ` +
      `${personalityInstructions}`;
  }

  return (
    `You are an expert SMS copywriter for local businesses. Write ONE personalized SMS. ` +
    `Address customer by first name only (${firstName}). ` +
    `Never sound like a template, mass text, or marketing email. No markdown, no placeholders. ` +
    `Return ONLY the message body — nothing else.\n\n` +
    industryPrompt
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    let body: GenerateRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, { status: 400 });
    }

    // ---- Preview mode -------------------------------------------------------
    if (body.preview) {
      const { customerName, businessName, industry, voice, goal, context } = body.preview;

      if (!customerName || !businessName) {
        return NextResponse.json(
          { error: "preview requires at least customerName and businessName", code: "BAD_REQUEST" },
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
          { error: "Failed to generate message", code: "AI_ERROR", detail },
          { status: 502 }
        );
      }
    }

    // ---- DB mode ------------------------------------------------------------
    if (!body.customerId) {
      return NextResponse.json(
        { error: "customerId or preview is required", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", body.customerId)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // Rate limit: 100 generates/min per business
    const rl = rateLimit(`${customer.business_id}:/api/messages/generate`, 100);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", customer.business_id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const config = business.config ?? {};
    const history: SpendHistoryEntry[] = customer.spend_history ?? [];
    const totalSpendAmount = totalSpend(history);
    const avgSpendAmount = calcAvgSpend(history);
    const daysSinceLastVisit = daysSinceDate(customer.last_purchase);
    const goals = business.goals ?? "";

    const personality: PersonalityConfig = {
      tone: (config.aiTone as string) ?? business.voice ?? "Balanced",
      length: (config.aiLength as string) ?? "Medium (80-120 chars)",
      emoji: (config.aiEmoji as string) ?? "Sparingly",
      signature: (config.aiSignature as string) ?? "",
      forbiddenWords: (config.aiForbiddenWords as string) ?? "valued customer, just checking in, we miss you",
      noCompetitors: (config.aiNoCompetitors as boolean) ?? false,
      includeOffers: (config.aiIncludeOffers as boolean) ?? false,
      currentOffer: (config.aiCurrentOffer as string) ?? "",
      language: (config.aiLanguage as string) ?? "English",
      customOpener: (config.aiCustomOpener as string) ?? (config.customInstructions as string) ?? "",
    };

    // Fetch best reply hour for this customer
    const { data: insights } = await supabase
      .from("customer_insights")
      .select("best_reply_hour")
      .eq("customer_id", customer.id)
      .maybeSingle();

    const systemPrompt = buildSystemPrompt(
      business.industry ?? "small business",
      business.name,
      goals,
      history,
      customer.name,
      daysSinceLastVisit,
      avgSpendAmount,
      totalSpendAmount,
      personality
    );

    const firstName = customer.name.split(" ")[0];
    const freqDays = visitFrequencyDays(history);

    const userContent = [
      `Business: ${business.name} (${business.industry ?? "small business"})`,
      `Customer first name: ${firstName}`,
      `Goals: ${goals || "re-engage the customer"}`,
      daysSinceLastVisit !== null ? `Days since last visit: ${daysSinceLastVisit}` : null,
      freqDays !== null ? `Average days between visits: ${freqDays}` : null,
      customer.last_purchase ? `Last purchase date: ${customer.last_purchase}` : null,
      totalSpendAmount > 0 ? `Total lifetime spend: ${formatCurrency(totalSpendAmount)}` : null,
      avgSpendAmount > 0 ? `Average spend per visit: ${formatCurrency(avgSpendAmount)}` : null,
      history.length > 0 ? `Visit count: ${history.length}` : null,
      insights?.best_reply_hour != null
        ? `This customer typically responds around ${insights.best_reply_hour}:00.`
        : null,
      body.segment
        ? `Customer segment: ${body.segment.replace(/_/g, " ")}. Tailor urgency and tone accordingly.`
        : null,
      "",
      "Write the SMS message now. First name only. Must feel personal and specific.",
    ]
      .filter(Boolean)
      .join("\n");

    // 10-second timeout on Claude API call
    const timeoutSignal = AbortSignal.timeout(10_000);
    let response;
    try {
      response = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        },
        { signal: timeoutSignal }
      );
    } catch (aiErr) {
      const detail = aiErr instanceof Error ? aiErr.message : "Unknown error";
      console.error("/api/messages/generate AI error:", detail);
      return NextResponse.json(
        { error: "AI generation temporarily unavailable", code: "AI_UNAVAILABLE" },
        { status: 502 }
      );
    }

    const block = response.content[0];
    const message = block?.type === "text" ? block.text.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "AI generation temporarily unavailable", code: "AI_UNAVAILABLE" },
        { status: 502 }
      );
    }

    return NextResponse.json({ message });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/messages/generate error:", detail);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL" }, { status: 500 });
  }
}
