import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/twilio";
import { isValidPhone, normalizePhone } from "@/utils/helpers";
import type { MessageStatus } from "@/utils/database.types";

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

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customerId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.customerId || !body.content) {
    return NextResponse.json(
      { error: "customerId and content are required" },
      { status: 400 }
    );
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", body.customerId)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // ── Enforce message limit ─────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("message_limit, message_count_this_period, plan")
    .eq("business_id", customer.business_id)
    .maybeSingle();

  if (
    sub &&
    sub.message_limit !== null &&
    (sub.message_count_this_period ?? 0) >= sub.message_limit
  ) {
    return NextResponse.json(
      { error: "Monthly message limit reached. Upgrade your plan." },
      { status: 429 }
    );
  }

  if (!customer.phone || !isValidPhone(customer.phone)) {
    return NextResponse.json(
      { error: "Customer has no valid phone number" },
      { status: 400 }
    );
  }

  let status: MessageStatus = "sent";
  try {
    const result = await sendSms({
      to: normalizePhone(customer.phone),
      body: body.content,
    });
    status = toMessageStatus(result.status);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    await supabase.from("messages").insert({
      customer_id: customer.id,
      business_id: customer.business_id,
      content: body.content,
      status: "failed",
      direction: "outbound",
      sent_at: new Date().toISOString(),
    });

    // Notify business of failure
    await supabase.from("notifications").insert({
      business_id: customer.business_id,
      type: "failed",
      content: `Message to ${customer.name} failed to send.`,
    });

    return NextResponse.json(
      { error: "Failed to send SMS", detail },
      { status: 502 }
    );
  }

  const { data: logged, error: logError } = await supabase
    .from("messages")
    .insert({
      customer_id: customer.id,
      business_id: customer.business_id,
      content: body.content,
      status,
      direction: "outbound",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) {
    return NextResponse.json(
      { error: "Sent, but failed to log message", detail: logError.message },
      { status: 207 }
    );
  }

  // Increment message count for billing period
  if (sub) {
    await supabase
      .from("subscriptions")
      .update({
        message_count_this_period: (sub.message_count_this_period ?? 0) + 1,
      })
      .eq("business_id", customer.business_id);
  }

  return NextResponse.json({ message: logged });
}
