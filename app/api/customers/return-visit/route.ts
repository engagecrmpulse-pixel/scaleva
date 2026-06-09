import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTwilioClient } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, business_id, return_visit_count, name, phone, ltv, consent_given, opted_out, last_review_request_at")
    .eq("id", body.customerId)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, config")
    .eq("id", customer.business_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newCount = (customer.return_visit_count ?? 0) + 1;
  const today = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("customers")
    .update({ return_visit_count: newCount, last_return_date: today })
    .eq("id", body.customerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("interactions").insert({
    customer_id: body.customerId,
    type: "return_visit",
    notes: `Marked as returned (visit #${newCount})`,
  });

  // ── Revenue attribution ───────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: recentMsg } = await supabase
    .from("messages")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("direction", "outbound")
    .neq("status", "failed")
    .gte("sent_at", thirtyDaysAgo)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentMsg) {
    const avgVisitValue =
      newCount > 0 && (customer.ltv ?? 0) > 0
        ? Math.round((customer.ltv ?? 0) / newCount)
        : 0;
    await supabase
      .from("messages")
      .update({ attributed: true, attributed_revenue: avgVisitValue })
      .eq("id", recentMsg.id);
  }

  // ── Exit win-back sequence on return ─────────────────────────────────────
  await supabase
    .from("sequence_enrollments")
    .update({ completed: true, exited_reason: "returned" })
    .eq("customer_id", customer.id)
    .eq("completed", false);

  // ── Review request automation ─────────────────────────────────────────────
  const config = business.config ?? {};
  const reviewEnabled = config.reviewRequestEnabled === true;
  const reviewLink = config.reviewLink as string | undefined;

  if (reviewEnabled && reviewLink && customer.phone && !customer.opted_out) {
    const daysSinceReview = customer.last_review_request_at
      ? Math.floor((Date.now() - new Date(customer.last_review_request_at).getTime()) / 86400000)
      : Infinity;

    if (daysSinceReview > 60) {
      const firstName = customer.name.split(" ")[0];
      const reviewMsg =
        `${firstName}, thanks for coming back! If you have 30 seconds, a Google review ` +
        `would mean the world to us: ${reviewLink}`;

      try {
        const twilio = getTwilioClient();
        await twilio.messages.create({
          to: customer.phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: reviewMsg,
        });
        await supabase.from("messages").insert({
          customer_id: customer.id,
          business_id: customer.business_id,
          content: reviewMsg,
          status: "sent",
          direction: "outbound",
          sent_at: new Date().toISOString(),
          consent_verified: customer.consent_given ?? false,
        });
        await supabase
          .from("customers")
          .update({ last_review_request_at: new Date().toISOString() })
          .eq("id", customer.id);
      } catch {
        // best-effort
      }
    }
  }

  return NextResponse.json({ customer: updated });
}
