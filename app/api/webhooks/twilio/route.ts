import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getTwilioClient } from "@/lib/twilio";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
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

const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const OPT_IN_KEYWORDS = new Set(["START"]);
const HELP_KEYWORDS = new Set(["HELP"]);

async function autoReply(to: string, body: string): Promise<void> {
  try {
    const client = getTwilioClient();
    await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    });
  } catch {
    // best-effort — don't fail the webhook
  }
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
  const messageSid = params.get("MessageSid") ?? "";

  const emptyResponse = new NextResponse("<?xml version='1.0'?><Response/>", {
    headers: { "Content-Type": "text/xml" },
  });

  if (!from || !messageBody) return emptyResponse;

  const supabase = getServiceClient();

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (messageSid) {
    const { data: alreadyProcessed } = await supabase
      .from("processed_webhooks")
      .select("id")
      .eq("event_id", messageSid)
      .maybeSingle();

    if (alreadyProcessed) return emptyResponse;

    await supabase.from("processed_webhooks").insert({ event_id: messageSid });
  }

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

  // ── Save inbound message ──────────────────────────────────────────────────
  await supabase.from("messages").insert({
    customer_id: customer.id,
    business_id: customer.business_id,
    content: messageBody,
    status: "received",
    direction: "inbound",
    sent_at: new Date().toISOString(),
    twilio_sid: messageSid || null,
    consent_verified: customer.consent_given ?? false,
  });

  // ── Opt-out / opt-in / help keyword handling ──────────────────────────────
  const keyword = messageBody.trim().toUpperCase();

  if (OPT_OUT_KEYWORDS.has(keyword)) {
    await supabase
      .from("customers")
      .update({ opted_out: true, status: "opted_out" })
      .eq("id", customer.id);

    await autoReply(
      from,
      "You have been unsubscribed and will receive no further messages. Reply START to resubscribe."
    );
    return emptyResponse;
  }

  if (OPT_IN_KEYWORDS.has(keyword)) {
    await supabase
      .from("customers")
      .update({ opted_out: false, status: "active" })
      .eq("id", customer.id);

    await autoReply(from, "You have been resubscribed.");
    return emptyResponse;
  }

  const [{ data: business }, { data: menuItemRows }] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, industry, voice, config")
      .eq("id", customer.business_id)
      .maybeSingle(),
    supabase
      .from("menu_items")
      .select("id, name, category, price, description")
      .eq("business_id", customer.business_id)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(40),
  ]);

  if (HELP_KEYWORDS.has(keyword)) {
    const bizName = business?.name ?? "the business";
    await autoReply(from, `For help contact ${bizName}. Reply STOP to unsubscribe.`);
    return emptyResponse;
  }

  // ── Update customer status and create notification ────────────────────────
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

  // ── Track best reply hour ─────────────────────────────────────────────────
  const replyHour = new Date().getHours();
  const { data: existingInsight } = await supabase
    .from("customer_insights")
    .select("best_reply_hour")
    .eq("customer_id", customer.id)
    .maybeSingle();

  const newHour = existingInsight?.best_reply_hour !== null && existingInsight?.best_reply_hour !== undefined
    ? Math.round((existingInsight.best_reply_hour + replyHour) / 2)
    : replyHour;

  await supabase.from("customer_insights").upsert(
    { customer_id: customer.id, best_reply_hour: newHour, updated_at: new Date().toISOString() },
    { onConflict: "customer_id" }
  );

  // ── Email notification ────────────────────────────────────────────────────
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

  // ── Exit win-back sequence on reply ───────────────────────────────────────
  await supabase
    .from("sequence_enrollments")
    .update({ completed: true, exited_reason: "replied" })
    .eq("customer_id", customer.id)
    .eq("completed", false);

  // ── Autonomous AI reply ───────────────────────────────────────────────────
  if (business?.config?.autoReplyEnabled === true) {
    try {
      const { data: recentMessages } = await supabase
        .from("messages")
        .select("content, direction, sent_at")
        .eq("customer_id", customer.id)
        .order("sent_at", { ascending: false })
        .limit(10);

      const history = (recentMessages ?? []).reverse();
      const firstName = customer.name.split(" ")[0];
      const cfg = business.config ?? {};

      // Build rich business context for the AI
      const menuItems = menuItemRows ?? [];
      const menuSection = menuItems.length > 0
        ? `\n\nYOUR ${business.industry === "Restaurant" ? "MENU" : business.industry === "Salon" ? "SERVICES" : "OFFERINGS"} (reference when relevant):\n` +
          menuItems.map((i) => {
            let line = `- ${i.name}`;
            if (i.category) line += ` [${i.category}]`;
            if (i.price) line += ` — $${i.price}`;
            if (i.description) line += `: ${i.description}`;
            return line;
          }).join("\n")
        : "";

      const hoursSection = cfg.businessHours
        ? `\n\nHOURS:\n` + Object.entries(cfg.businessHours)
            .map(([day, h]) => h.closed ? `${day}: Closed` : `${day}: ${h.open} – ${h.close}`)
            .join(", ")
        : "";

      const faqSection = cfg.faq && cfg.faq.length > 0
        ? `\n\nFREQUENT QUESTIONS YOU KNOW HOW TO ANSWER:\n` +
          cfg.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
        : "";

      const offerSection = cfg.specialOffer
        ? `\n\nCURRENT OFFER: ${cfg.specialOffer}`
        : "";

      const bookingSection = cfg.bookingLink
        ? `\n\nBOOKING LINK: ${cfg.bookingLink}`
        : "";

      const addressSection = cfg.businessAddress
        ? `\n\nADDRESS: ${cfg.businessAddress}`
        : "";

      const systemPrompt =
        `You are the owner of ${business.name}, a ${business.industry ?? "local business"}. ` +
        `Reply to your customer ${firstName} in a ${business.voice ?? "friendly"} tone. ` +
        `Keep replies under 160 characters when possible — this is SMS. Sound like a real person, never reveal you are AI. ` +
        `Only mention the booking link, address, or hours if directly relevant to what they asked.` +
        menuSection + hoursSection + offerSection + faqSection + bookingSection + addressSection;

      const historyText = history
        .map((m) => `${m.direction === "inbound" ? firstName : business.name}: ${m.content}`)
        .join("\n");

      const userContent = historyText
        ? `Conversation so far:\n${historyText}\n\n${firstName}: ${messageBody}\n\nReply as ${business.name}:`
        : `${firstName}: ${messageBody}\n\nReply as ${business.name}:`;

      const timeoutSignal = AbortSignal.timeout(12_000);
      const aiResp = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        },
        { signal: timeoutSignal }
      );

      const replyText =
        aiResp.content[0]?.type === "text" ? aiResp.content[0].text.trim() : null;

      if (replyText) {
        await autoReply(from, replyText);
        await supabase.from("messages").insert({
          customer_id: customer.id,
          business_id: customer.business_id,
          content: replyText,
          status: "sent",
          direction: "outbound",
          sent_at: new Date().toISOString(),
          consent_verified: customer.consent_given ?? false,
        });
      }
    } catch {
      // best-effort
    }
  }

  // ── Menu mention detection (restaurant/salon/retail) ─────────────────────
  if ((menuItemRows ?? []).length > 0) {
    try {
      const lowerMsg = messageBody.toLowerCase();
      const mentions: { menu_item_id: string; sentiment: "positive" | "negative" | "neutral" }[] = [];

      const POSITIVE_WORDS = ["love", "loved", "great", "amazing", "best", "delicious", "perfect", "favorite", "excellent", "fantastic", "good", "wonderful", "enjoyed", "recommend"];
      const NEGATIVE_WORDS = ["bad", "awful", "terrible", "horrible", "worst", "disgusting", "disappointed", "cold", "overpriced", "wrong", "missing", "wait", "slow", "gross"];

      for (const item of menuItemRows ?? []) {
        if (lowerMsg.includes(item.name.toLowerCase())) {
          const posCnt = POSITIVE_WORDS.filter((w) => lowerMsg.includes(w)).length;
          const negCnt = NEGATIVE_WORDS.filter((w) => lowerMsg.includes(w)).length;
          const sentiment: "positive" | "negative" | "neutral" =
            posCnt > negCnt ? "positive" : negCnt > posCnt ? "negative" : "neutral";
          mentions.push({ menu_item_id: item.id, sentiment });
        }
      }

      if (mentions.length > 0) {
        const { data: savedMsg } = await supabase
          .from("messages")
          .select("id")
          .eq("twilio_sid", messageSid)
          .maybeSingle();

        await supabase.from("menu_item_mentions").insert(
          mentions.map((m) => ({
            business_id: customer.business_id,
            menu_item_id: m.menu_item_id,
            message_id: savedMsg?.id ?? null,
            sentiment: m.sentiment,
          }))
        );
      }
    } catch {
      // best-effort
    }
  }

  return emptyResponse;
}
