import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { sendSms } from "@/lib/twilio";
import { isValidPhone, normalizePhone, totalSpend, formatCurrency } from "@/utils/helpers";
import { nextContactDate } from "@/lib/cadence";
import type { Database, MessageStatus, SpendHistoryEntry } from "@/utils/database.types";

const TEST_MODE = process.env.TEST_MODE === "true";
const BATCH_SIZE = 10;

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function dayOfWeekName(d: Date): string {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][d.getDay()];
}

function currentHourIn(timezone: string): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    return parseInt(formatted, 10);
  } catch {
    return new Date().getHours();
  }
}

function currentDayIn(timezone: string): string {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
    }).format(new Date());
    return formatted.toLowerCase();
  } catch {
    return dayOfWeekName(new Date());
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const SEND_TIME_HOUR: Record<string, number> = {
  "8 AM": 8,
  "9 AM": 9,
  "12 PM": 12,
  "3 PM": 15,
  "6 PM": 18,
};

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const supabase = getServiceClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: businesses } = await supabase
      .from("businesses")
      .select("*");

    if (!businesses?.length) {
      return NextResponse.json({ sent: 0, skipped: 0 });
    }

    let sent = 0;
    let skipped = 0;

    for (const business of businesses) {
      const config = business.config ?? {};
      if (!config.autopilot) { skipped++; continue; }

      const tz = config.autopilotTimezone ?? "America/New_York";
      const sendDay = (config.autopilotSendDay ?? "monday").toLowerCase();
      const sendTimeLabel = config.autopilotSendTime ?? "9 AM";
      const targetHour = SEND_TIME_HOUR[sendTimeLabel] ?? 9;
      const currentDay = currentDayIn(tz);
      const currentHour = currentHourIn(tz);

      if (currentDay !== sendDay || currentHour !== targetHour) {
        skipped++;
        continue;
      }

      // Quiet hours check (should never fire since we control the send hour, but safety net)
      if (currentHour < 8 || currentHour >= 21) {
        skipped++;
        continue;
      }

      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", business.id)
        .eq("opted_out", false)
        .lte("next_contact_date", today);

      if (!customers?.length) { skipped++; continue; }

      // Process in batches of BATCH_SIZE with 500ms between batches
      for (let batchStart = 0; batchStart < customers.length; batchStart += BATCH_SIZE) {
        if (batchStart > 0) {
          await sleep(500);
        }

        const batch = customers.slice(batchStart, batchStart + BATCH_SIZE);

        for (const customer of batch) {
          if (!customer.phone || !isValidPhone(customer.phone)) continue;

          const history: SpendHistoryEntry[] = customer.spend_history ?? [];
          const totalSpendAmt = totalSpend(history);
          const firstName = customer.name.split(" ")[0];

          // Build personality-aware prompt from config
          const tone = config.aiTone ?? business.voice ?? "friendly";
          const language = config.aiLanguage ?? "English";
          const signature = config.aiSignature ? `End with: ${config.aiSignature}` : "";
          const forbidden = config.aiForbiddenWords ? `Never use: ${config.aiForbiddenWords}.` : "";
          const offerNote = config.aiIncludeOffers && config.aiCurrentOffer
            ? `If relevant, mention: ${config.aiCurrentOffer}.`
            : "";
          const customOpener = config.aiCustomOpener ?? "";

          const systemPrompt =
            `You are an SMS copywriter for ${business.name} (${business.industry ?? "small business"}). ` +
            `Tone: ${tone}. Write one personalized SMS under 160 characters. ` +
            `Address customer by first name (${firstName}) only. Never sound like a template. ` +
            `Write in ${language}. ${signature} ${forbidden} ${offerNote} ${customOpener}` +
            (config.customInstructions ? ` ${config.customInstructions}` : "");

          const userMsg = [
            `Customer: ${firstName}`,
            `Goals: ${business.goals ?? "re-engage"}`,
            totalSpendAmt > 0 ? `Lifetime spend: ${formatCurrency(totalSpendAmt)}` : null,
            customer.last_purchase ? `Last purchase: ${customer.last_purchase}` : null,
            "Write the SMS now.",
          ].filter(Boolean).join("\n");

          let messageText = "";
          try {
            const aiResp = await anthropic.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: 200,
              system: systemPrompt,
              messages: [{ role: "user", content: userMsg }],
            });
            const block = aiResp.content[0];
            messageText = block?.type === "text" ? block.text.trim() : "";
          } catch {
            continue;
          }

          if (!messageText) continue;

          let status: MessageStatus = "sent";
          let twilioSid: string | undefined;

          if (TEST_MODE) {
            status = "test_sent";
          } else {
            try {
              const result = await sendSms({ to: normalizePhone(customer.phone), body: messageText });
              status = result.status as MessageStatus;
              twilioSid = result.sid;
            } catch {
              status = "failed";
            }
          }

          await supabase.from("messages").insert({
            customer_id: customer.id,
            business_id: business.id,
            content: messageText,
            status,
            direction: "outbound",
            sent_at: new Date().toISOString(),
            twilio_sid: twilioSid ?? null,
            consent_verified: customer.consent_given ?? false,
          });

          const newNextDate = nextContactDate(
            Date.now(),
            config.cadence ?? "Weekly"
          );

          await supabase
            .from("customers")
            .update({ next_contact_date: newNextDate })
            .eq("id", customer.id);

          const { data: subRow } = await supabase
            .from("subscriptions")
            .select("message_count_this_period")
            .eq("business_id", business.id)
            .maybeSingle();
          if (subRow) {
            await supabase
              .from("subscriptions")
              .update({ message_count_this_period: (subRow.message_count_this_period ?? 0) + 1 })
              .eq("business_id", business.id);
          }

          sent++;
        }
      }
    }

    return NextResponse.json({ sent, skipped });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/cron/send error:", detail);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL" }, { status: 500 });
  }
}
