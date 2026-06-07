import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const PLAN_LIMITS: Record<string, { customers: number | null; messages: number | null }> = {
  starter: { customers: 500, messages: 2000 },
  growth: { customers: 1500, messages: 6000 },
  pro: { customers: 5000, messages: 25000 },
  enterprise: { customers: null, messages: null },
};

const FLAT_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  growth: process.env.STRIPE_GROWTH_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = body.plan ?? "starter";

  // Enterprise is handled via sales contact — not self-serve checkout.
  if (plan === "enterprise") {
    return NextResponse.json(
      { error: "Enterprise plans require contacting sales." },
      { status: 400 }
    );
  }

  const priceId = FLAT_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `No price configured for plan: ${plan}` },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-05-27.dahlia",
  });

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const businessId = businesses?.[0]?.id;
  const limits = PLAN_LIMITS[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
      businessId: businessId ?? "",
      plan,
      customerLimit: String(limits.customers ?? ""),
      messageLimit: String(limits.messages ?? ""),
    },
  });

  return NextResponse.json({ url: session.url });
}
