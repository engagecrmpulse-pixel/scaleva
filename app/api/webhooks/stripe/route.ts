import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/database.types";

const STRIPE_API_VERSION = "2026-05-27.dahlia" as const;

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Stripe v22 removed current_period_end from Subscription top level.
// Use a helper that accesses it safely regardless of API version.
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_end as number | undefined;
  if (raw) return new Date(raw * 1000).toISOString();
  // Fall back to billing_cycle_anchor (same day next period) if not present
  if (sub.billing_cycle_anchor) {
    return new Date(sub.billing_cycle_anchor * 1000).toISOString();
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION,
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.metadata?.businessId;
    const plan = session.metadata?.plan ?? "starter";

    if (businessId && session.customer && session.subscription) {
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;
      const stripeSubId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const sub = await stripe.subscriptions.retrieve(stripeSubId);
      const periodEnd = getPeriodEnd(sub);

      const existing = await supabase
        .from("subscriptions")
        .select("id")
        .eq("business_id", businessId)
        .maybeSingle();

      if (existing.data) {
        await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubId,
            plan,
            status: "active",
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("business_id", businessId);
      } else {
        await supabase.from("subscriptions").insert({
          business_id: businessId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubId,
          plan,
          status: "active",
          current_period_end: periodEnd,
        });
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({
        status: sub.status,
        current_period_end: getPeriodEnd(sub),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
