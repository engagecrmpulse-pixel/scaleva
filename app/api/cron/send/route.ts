import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { sendSms } from "@/lib/twilio";
import { isValidPhone, normalizePhone, totalSpend, formatCurrency } from "@/utils/helpers";
import { nextContactDate } from "@/lib/cadence";
import type { Database, SpendHistoryEntry } from "@/utils/database.types";

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

const SEND_TIME_HOUR: Record<string, number> = {
  "8 AM": 8,
  "9 AM": 9,
  "12 PM": 12,
  "3 PM": 15,
  "6 PM": 18,
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .lte("next_contact_date", today);

    if (!customers?.length) { skipped++; continue; }

    for (const customer of customers) {
      if (!customer.phone || !isValidPhone(customer.phone)) continue;

      const history: SpendHistoryEntry[] = customer.spend_history ?? [];
      const totalSpendAmt = totalSpend(history);
      const firstName = customer.name.split(" ")[0];

      const systemPrompt =
        `You are an SMS copywriter for ${business.name} (${business.industry ?? "small business"}). ` +
        `Voice: ${business.voice ?? "friendly"}. Write one personalized SMS under 160 characters. ` +
        `Address customer by first name (${firstName}) only. Never sound like a template.` +
        (business.config?.customInstructions ? ` ${business.config.customInstructions}` : "");

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

      let status = "sent";
      try {
        const result = await sendSms({ to: normalizePhone(customer.phone), body: messageText });
        status = result.status;
      } catch {
        status = "failed";
      }

      await supabase.from("messages").insert({
        customer_id: customer.id,
        business_id: business.id,
        content: messageText,
        status: status as "sent" | "failed",
        direction: "outbound",
        sent_at: new Date().toISOString(),
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

  return NextResponse.json({ sent, skipped });
}
