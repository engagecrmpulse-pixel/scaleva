import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/database.types";

const STRIPE_API_VERSION = "2026-05-27.dahlia" as const;

const PLAN_LIMITS: Record<string, { customers: number | null; messages: number | null }> = {
  starter: { customers: 500, messages: 2000 },
  growth: { customers: 1500, messages: 6000 },
  pro: { customers: 5000, messages: 25000 },
  enterprise: { customers: null, messages: null },
};

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getPeriodEnd(sub: Stripe.Subscription): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (sub as any).current_period_end as number | undefined;
  if (raw) return new Date(raw * 1000).toISOString();
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

  // ── New subscription from checkout ────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.metadata?.businessId;
    const plan = session.metadata?.plan ?? "starter";
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    if (businessId && session.customer && session.subscription) {
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer.id;
      const stripeSubId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;

      const sub = await stripe.subscriptions.retrieve(stripeSubId);
      const periodEnd = getPeriodEnd(sub);

      const existing = await supabase
        .from("subscriptions")
        .select("id")
        .eq("business_id", businessId)
        .maybeSingle();

      const subPayload = {
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubId,
        plan,
        status: "active",
        current_period_end: periodEnd,
        message_count_this_period: 0,
        customer_limit: limits.customers,
        message_limit: limits.messages,
        updated_at: new Date().toISOString(),
      };

      if (existing.data) {
        await supabase
          .from("subscriptions")
          .update(subPayload)
          .eq("business_id", businessId);
      } else {
        await supabase.from("subscriptions").insert({
          business_id: businessId,
          ...subPayload,
        });
      }
    }
  }

  // ── Subscription plan changed (upgrade/downgrade) ─────────────────────────
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;

    // Try to find the plan from subscription metadata or items
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();

    const plan = existingSub?.plan ?? "starter";
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    await supabase
      .from("subscriptions")
      .update({
        status: sub.status,
        current_period_end: getPeriodEnd(sub),
        customer_limit: limits.customers,
        message_limit: limits.messages,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.id);
  }

  // ── Subscription cancelled ────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  // ── Billing cycle resets message usage counter ────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripeSubId = (invoice as any).subscription as string | null;
    if (stripeSubId) {
      await supabase
        .from("subscriptions")
        .update({
          message_count_this_period: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId);
    }
  }

  return NextResponse.json({ received: true });
}
