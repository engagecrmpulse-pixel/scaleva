import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/utils/database.types";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function phoneVariants(phone: string): string[] {
  const digits = phone.replace(/\D/g, "");
  return [
    phone,
    `+${digits}`,
    digits,
    digits.length === 11 && digits.startsWith("1") ? `+${digits}` : null,
    digits.length === 10 ? `+1${digits}` : null,
  ].filter((v): v is string => v !== null);
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const params = new URLSearchParams(body);
  const from = params.get("From") ?? "";
  const messageBody = params.get("Body") ?? "";

  const emptyResponse = new NextResponse("<?xml version='1.0'?><Response/>", {
    headers: { "Content-Type": "text/xml" },
  });

  if (!from || !messageBody) return emptyResponse;

  const supabase = getServiceClient();

  let customer = null;
  for (const variant of phoneVariants(from)) {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", variant)
      .maybeSingle();
    if (data) { customer = data; break; }
  }

  if (!customer) return emptyResponse;

  await supabase.from("messages").insert({
    customer_id: customer.id,
    business_id: customer.business_id,
    content: messageBody,
    status: "received",
    direction: "inbound",
    sent_at: new Date().toISOString(),
  });

  await supabase
    .from("customers")
    .update({ status: "replied" })
    .eq("id", customer.id);

  const excerpt = messageBody.length > 100
    ? `${messageBody.slice(0, 100)}…`
    : messageBody;

  await supabase.from("notifications").insert({
    business_id: customer.business_id,
    type: "reply",
    content: `${customer.name} replied: "${excerpt}"`,
  });

  const { data: business } = await supabase
    .from("businesses")
    .select("config")
    .eq("id", customer.business_id)
    .maybeSingle();

  if (
    business?.config?.emailNotifyReply !== false &&
    process.env.RESEND_API_KEY &&
    process.env.NOTIFICATION_FROM_EMAIL
  ) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.NOTIFICATION_FROM_EMAIL,
      to: process.env.NOTIFICATION_FROM_EMAIL,
      subject: `${customer.name} replied to your Scaleva message`,
      text: `Customer ${customer.name} replied: ${messageBody}`,
    }).catch(() => null);
  }

  return emptyResponse;
}
