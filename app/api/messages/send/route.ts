import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/twilio";
import { isValidPhone, normalizePhone } from "@/utils/helpers";
import { rateLimit } from "@/lib/rate-limit";
import { nextContactDate } from "@/lib/cadence";
import { sanitizeText } from "@/lib/sanitize";
import type { MessageStatus } from "@/utils/database.types";

const TEST_MODE = process.env.TEST_MODE === "true";

const PLAN_LIMITS: Record<string, number> = {
  starter: 2000,
  growth: 6000,
  pro: 25000,
  enterprise: Infinity,
};

function toMessageStatus(twilioStatus: string): MessageStatus {
  switch (twilioStatus) {
    case "queued":
    case "delivered":
    case "failed":
    case "received":
      return twilioStatus;
    default:
      return "sent";
  }
}

function currentHourInTz(tz: string): number {
  try {
    return parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()),
      10
    );
  } catch {
    return new Date().getHours();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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

    let body: { customerId?: string; content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (!body.customerId || !body.content) {
      return NextResponse.json(
        { error: "customerId and content are required", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const content = sanitizeText(body.content);
    if (!content) {
      return NextResponse.json({ error: "Message content is empty", code: "BAD_REQUEST" }, { status: 400 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", body.customerId)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: "Customer not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // ── Opt-out check ─────────────────────────────────────────────────────────
    if (customer.opted_out) {
      return NextResponse.json(
        { error: "Customer has opted out of SMS messages", code: "OPTED_OUT" },
        { status: 422 }
      );
    }

    // ── Enforce plan message limit ────────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("message_count_this_period, plan, message_limit")
      .eq("business_id", customer.business_id)
      .maybeSingle();

    if (sub) {
      const planLimit = PLAN_LIMITS[sub.plan] ?? sub.message_limit ?? Infinity;
      if ((sub.message_count_this_period ?? 0) >= planLimit) {
        return NextResponse.json(
          { error: "Monthly message limit reached", code: "LIMIT_REACHED", upgradeUrl: "/pricing" },
          { status: 403 }
        );
      }
    }

    // ── Rate limit: 100 sends/min per business ────────────────────────────────
    const rl = rateLimit(`${customer.business_id}:/api/messages/send`, 100);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again shortly.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    if (!customer.phone) {
      return NextResponse.json(
        { error: "This customer has no phone number. Add one in their profile before sending.", code: "NO_PHONE" },
        { status: 400 }
      );
    }

    if (!isValidPhone(customer.phone)) {
      return NextResponse.json(
        { error: `Invalid phone number: ${customer.phone}. Use E.164 format (e.g. +14155551234).`, code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    // ── Fetch business config ─────────────────────────────────────────────────
    const { data: business } = await supabase
      .from("businesses")
      .select("config")
      .eq("id", customer.business_id)
      .maybeSingle();

    const config = business?.config ?? {};

    // ── Quiet hours check ─────────────────────────────────────────────────────
    const tz = (config.autopilotTimezone as string) ?? "America/New_York";
    const currentHour = currentHourInTz(tz);
    if (currentHour < 8 || currentHour >= 21) {
      await supabase.from("messages").insert({
        customer_id: customer.id,
        business_id: customer.business_id,
        content,
        status: "queued_quiet_hours",
        direction: "outbound",
        sent_at: new Date().toISOString(),
        consent_verified: customer.consent_given ?? false,
      });
      return NextResponse.json({
        status: "queued",
        reason: "quiet_hours",
        scheduledFor: "8AM in your business timezone",
      });
    }

    // ── TEST MODE: skip Twilio entirely ───────────────────────────────────────
    if (TEST_MODE) {
      const { data: logged, error: logError } = await supabase
        .from("messages")
        .insert({
          customer_id: customer.id,
          business_id: customer.business_id,
          content,
          status: "test_sent" as MessageStatus,
          direction: "outbound",
          sent_at: new Date().toISOString(),
          consent_verified: customer.consent_given ?? false,
        })
        .select()
        .single();

      if (logError) {
        return NextResponse.json({ error: "Failed to log test message", code: "DB_ERROR" }, { status: 500 });
      }

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ message_count_this_period: (sub.message_count_this_period ?? 0) + 1 })
          .eq("business_id", customer.business_id);
      }

      return NextResponse.json({ message: logged });
    }

    // ── Live Twilio send with retry (3 attempts, exponential backoff) ─────────
    let status: MessageStatus = "sent";
    let twilioSid: string | undefined;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) {
        await sleep(1000 * Math.pow(2, attempt - 2));
      }
      try {
        const result = await sendSms({ to: normalizePhone(customer.phone), body: content });
        status = toMessageStatus(result.status);
        twilioSid = result.sid;
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Unknown error");
        console.error(`/api/messages/send attempt ${attempt}:`, lastError.message);
      }
    }

    if (lastError) {
      await supabase.from("messages").insert({
        customer_id: customer.id,
        business_id: customer.business_id,
        content,
        status: "failed",
        direction: "outbound",
        sent_at: new Date().toISOString(),
        consent_verified: customer.consent_given ?? false,
      });
      await supabase.from("notifications").insert({
        business_id: customer.business_id,
        type: "failed",
        content: `Message to ${customer.name} failed to send after 3 attempts.`,
      });
      return NextResponse.json(
        { error: "Failed to send SMS after 3 attempts", code: "SMS_ERROR", detail: lastError.message },
        { status: 502 }
      );
    }

    const { data: logged, error: logError } = await supabase
      .from("messages")
      .insert({
        customer_id: customer.id,
        business_id: customer.business_id,
        content,
        status,
        direction: "outbound",
        sent_at: new Date().toISOString(),
        twilio_sid: twilioSid ?? null,
        consent_verified: customer.consent_given ?? false,
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json(
        { error: "Sent, but failed to log message", code: "DB_ERROR", detail: logError.message },
        { status: 207 }
      );
    }

    // ── Update message count and next contact date ────────────────────────────
    if (sub) {
      await supabase
        .from("subscriptions")
        .update({ message_count_this_period: (sub.message_count_this_period ?? 0) + 1 })
        .eq("business_id", customer.business_id);
    }

    const newNextDate = nextContactDate(Date.now(), (config.cadence as string) ?? "Weekly");
    await supabase
      .from("customers")
      .update({ next_contact_date: newNextDate })
      .eq("id", customer.id);

    // ── Enroll in win-back sequence ───────────────────────────────────────────
    if (config.sequenceEnabled) {
      const nextStepAt = new Date(Date.now() + 7 * 86400000).toISOString();
      await supabase.from("sequence_enrollments").upsert(
        {
          customer_id: customer.id,
          business_id: customer.business_id,
          step: 1,
          enrolled_at: new Date().toISOString(),
          next_step_at: nextStepAt,
          completed: false,
          exited_reason: null,
        },
        { onConflict: "customer_id" }
      );
    }

    return NextResponse.json({ message: logged });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/messages/send error:", detail);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL" }, { status: 500 });
  }
}
