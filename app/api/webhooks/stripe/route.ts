import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/database.types";
import { getResend, fromEmail } from "@/lib/resend";

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

  // ── Idempotency check ─────────────────────────────────────────────────────
  const { data: alreadyProcessed } = await supabase
    .from("processed_webhooks")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  await supabase.from("processed_webhooks").insert({ event_id: event.id }).throwOnError();

  try {
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
    else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;

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
    else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
    }

    // ── Billing cycle resets message usage counter ────────────────────────────
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripeSubId = (invoice as any).subscription as string | null;
      if (stripeSubId) {
        await supabase
          .from("subscriptions")
          .update({
            message_count_this_period: 0,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubId);
      }
    }

    // ── Payment failed — mark past_due and send dunning email ─────────────────
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripeSubId = (invoice as any).subscription as string | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const amountDue = ((invoice as any).amount_due as number ?? 0) / 100;

      if (stripeSubId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", stripeSubId);

        // Dunning email
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("business_id")
          .eq("stripe_subscription_id", stripeSubId)
          .maybeSingle();

        if (subRow?.business_id) {
          const { data: business } = await supabase
            .from("businesses")
            .select("owner_id, name")
            .eq("id", subRow.business_id)
            .maybeSingle();

          if (business) {
            const { data: authUser } = await supabase.auth.admin.getUserById(business.owner_id);
            const ownerEmail = authUser?.user?.email;
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";

            if (ownerEmail) {
              const resend = getResend();
              await resend?.emails.send({
                from: fromEmail(),
                to: ownerEmail,
                subject: "Action required: Your Scaleva payment failed",
                text: [
                  `Your payment of $${amountDue.toFixed(2)} for ${business.name} failed.`,
                  "",
                  "Please update your billing information to keep your account active.",
                  "",
                  `Manage billing: ${appUrl}/settings`,
                ].join("\n"),
              }).catch(() => null);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
  }

  return NextResponse.json({ received: true });
}
