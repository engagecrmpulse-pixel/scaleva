import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/twilio";
import { isValidPhone, normalizePhone } from "@/utils/helpers";

/**
 * POST /api/messages/send
 * Body: { customerId: string; content: string }
 * Sends an SMS via Twilio and logs it to the messages table.
 */
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

  if (!customer.phone || !isValidPhone(customer.phone)) {
    return NextResponse.json(
      { error: "Customer has no valid phone number" },
      { status: 400 }
    );
  }

  let status = "sent";
  try {
    const result = await sendSms({
      to: normalizePhone(customer.phone),
      body: body.content,
    });
    status = result.status;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    // Log the failed attempt so it shows up in history.
    await supabase.from("messages").insert({
      customer_id: customer.id,
      business_id: customer.business_id,
      content: body.content,
      status: "failed",
      direction: "outbound",
      sent_at: new Date().toISOString(),
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

  return NextResponse.json({ message: logged });
}
