import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import twilio from "twilio";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function serviceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const authClient = createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user?.email || !getAdminEmails().includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessId, customerId, content } = (await request.json()) as {
    businessId: string; customerId: string; content: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const supabase = serviceClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id, phone, name")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (!customer.phone) {
    return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  }

  const client = twilio(accountSid, authToken);
  try {
    await client.messages.create({ body: content, from: fromNumber, to: customer.phone });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Twilio error";
    return NextResponse.json({ error: "Failed to send", detail }, { status: 502 });
  }

  const { data: message } = await supabase
    .from("messages")
    .insert({
      customer_id: customerId,
      business_id: businessId,
      content,
      direction: "outbound",
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  return NextResponse.json({ ok: true, messageId: message?.id });
}
