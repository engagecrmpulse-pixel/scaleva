import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { getTwilioClient } from "@/lib/twilio";
import type { Database } from "@/utils/database.types";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const STEP_HINTS = [
  "Re-engage gently. Reference what they usually purchase or do. Show you remember them personally.",
  "Try a different angle — mention something seasonal, new arrivals, or something the customer would love.",
  "Final win-back message. Warm but with a light sense of why now is a great time to come back.",
];

// Days to wait before each subsequent step fires
const NEXT_STEP_DELAY_DAYS = [0, 14, 24] as const;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Fetch enrollments that are due and not complete
  const { data: enrollments } = await supabase
    .from("sequence_enrollments")
    .select(`
      id, step, customer_id, business_id, next_step_at,
      customers ( id, name, phone, opted_out, consent_given, spend_history, last_purchase ),
      businesses ( name, industry, voice, config, goals )
    `)
    .lte("next_step_at", now)
    .eq("completed", false)
    .limit(50);

  if (!enrollments?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  const twilio = getTwilioClient();

  for (let i = 0; i < enrollments.length; i++) {
    if (i > 0) await sleep(300);

    const enrollment = enrollments[i];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customer = enrollment.customers as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const business = enrollment.businesses as any;

    if (!customer || !business || !customer.phone || customer.opted_out) {
      await supabase
        .from("sequence_enrollments")
        .update({ completed: true, exited_reason: "invalid" })
        .eq("id", enrollment.id);
      continue;
    }

    const stepIdx = (enrollment.step ?? 1) - 1;
    const hint = STEP_HINTS[Math.min(stepIdx, STEP_HINTS.length - 1)];
    const isLastStep = stepIdx >= STEP_HINTS.length - 1;
    const firstName = (customer.name as string).split(" ")[0];

    try {
      const timeoutSignal = AbortSignal.timeout(10_000);
      const aiResp = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 200,
          system:
            `You are an expert SMS copywriter for ${business.name as string}, a ` +
            `${(business.industry as string | null) ?? "local business"}. ` +
            `Write one personalized win-back SMS to ${firstName}. ` +
            `${hint} ` +
            `Brand voice: ${(business.voice as string | null) ?? "friendly"}. ` +
            `Under 160 characters. Address by first name only. Never sound like a template. ` +
            `Return ONLY the message body.`,
          messages: [
            {
              role: "user",
              content: `Customer: ${customer.name as string}. Write the win-back SMS now.`,
            },
          ],
        },
        { signal: timeoutSignal }
      );

      const msgText =
        aiResp.content[0]?.type === "text" ? aiResp.content[0].text.trim() : null;
      if (!msgText) continue;

      const sent = await twilio.messages.create({
        to: customer.phone as string,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: msgText,
      });

      await supabase.from("messages").insert({
        customer_id: customer.id as string,
        business_id: enrollment.business_id,
        content: msgText,
        status: "sent",
        direction: "outbound",
        sent_at: new Date().toISOString(),
        twilio_sid: sent.sid ?? null,
        consent_verified: (customer.consent_given as boolean | null) ?? false,
      });

      if (isLastStep) {
        await supabase
          .from("sequence_enrollments")
          .update({ completed: true, exited_reason: "completed" })
          .eq("id", enrollment.id);
      } else {
        const delayDays = NEXT_STEP_DELAY_DAYS[Math.min(stepIdx + 1, NEXT_STEP_DELAY_DAYS.length - 1)];
        const nextStepAt = new Date(Date.now() + delayDays * 86400000).toISOString();
        await supabase
          .from("sequence_enrollments")
          .update({ step: (enrollment.step ?? 1) + 1, next_step_at: nextStepAt })
          .eq("id", enrollment.id);
      }

      processed++;
    } catch (err) {
      console.error("sequence step error:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ processed });
}
