import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAN_LIMITS: Record<string, { customers: number; messages: number }> = {
  starter: { customers: 500, messages: 2000 },
  growth: { customers: 1500, messages: 6000 },
  pro: { customers: 5000, messages: 25000 },
};

export async function POST(request: NextRequest) {
  const { code, plan } = (await request.json()) as { code?: string; plan?: string };

  const ownerCode = process.env.OWNER_PAY_CODE;
  if (!ownerCode || code !== ownerCode) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const targetPlan = (plan && PLAN_LIMITS[plan]) ? plan : "pro";
  const limits = PLAN_LIMITS[targetPlan];

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  const businessId = businesses?.[0]?.id;
  if (!businessId) {
    return NextResponse.json({ error: "No business found — complete onboarding first" }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        business_id: businessId,
        stripe_customer_id: "bypass_owner",
        stripe_subscription_id: `bypass_${Date.now()}`,
        plan: targetPlan,
        status: "active",
        current_period_end: periodEnd,
        message_count_this_period: 0,
        customer_limit: limits.customers,
        message_limit: limits.messages,
        updated_at: now.toISOString(),
      },
      { onConflict: "business_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: targetPlan });
}
