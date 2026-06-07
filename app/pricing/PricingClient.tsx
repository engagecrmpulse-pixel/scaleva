"use client";

import { useState } from "react";
import Link from "next/link";

interface FlatPlan {
  id: "starter" | "growth" | "pro";
  name: string;
  price: number;
  customerLimit: string;
  messageLimit: string;
  features: string[];
  highlight: boolean;
}

const FLAT_PLANS: FlatPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    customerLimit: "500 customers",
    messageLimit: "2,000 messages/mo",
    features: [
      "CSV & manual entry",
      "Basic analytics",
      "AI-generated messages",
      "Email support",
    ],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 399,
    customerLimit: "1,500 customers",
    messageLimit: "6,000 messages/mo",
    features: [
      "All integrations (Square, Stripe, Shopify…)",
      "Full analytics",
      "Autopilot scheduling",
      "Two-way SMS",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 699,
    customerLimit: "5,000 customers",
    messageLimit: "25,000 messages/mo",
    features: [
      "Everything in Growth",
      "Revenue tracking",
      "Data export",
      "Priority support",
      "Dedicated onboarding",
    ],
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

interface PricingClientProps {
  currentPlan: string | null;
  isPastDue: boolean;
}

export function PricingClient({ currentPlan, isPastDue }: PricingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(planId: string) {
    setLoading(planId);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });

    const data = (await res.json()) as { url?: string; error?: string };

    if (!res.ok || !data.url) {
      setError(data.error ?? "Failed to start checkout");
      setLoading(null);
      return;
    }

    window.location.href = data.url;
  }

  const isCurrent = (planId: string) => currentPlan === planId;

  return (
    <div className="min-h-screen bg-base">
      {isPastDue && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5 text-center">
          <p className="text-sm text-yellow-400">
            Your payment failed. Update your billing info to keep Scaleva running.{" "}
            <Link href="/settings" className="font-medium underline">
              Manage billing →
            </Link>
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <Link href="/" className="font-heading text-sm font-semibold text-content-muted hover:text-content">
            Scaleva
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-content">
            Simple, transparent pricing
          </h1>
          <p className="mt-2 text-sm text-content-muted">
            Start automating customer re-engagement today. Upgrade or downgrade anytime.
          </p>
        </div>

        {error && (
          <p className="mb-6 text-center text-sm text-danger">{error}</p>
        )}

        {/* Flat plans grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {FLAT_PLANS.map((plan) => {
            const current = isCurrent(plan.id);
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-card border p-6 ${
                  plan.highlight
                    ? "border-accent bg-accent/5 shadow-lg"
                    : "border-line bg-surface"
                }`}
              >
                {plan.highlight && !current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
                    Current plan
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="font-heading text-base font-semibold text-content">{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-mono text-3xl font-semibold text-content">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-content-muted">/month</span>
                  </div>
                  <p className="mt-1 text-xs text-content-muted">
                    {plan.customerLimit} &middot; {plan.messageLimit}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-content-muted">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>

                {current ? (
                  <Link
                    href="/settings"
                    className="flex h-10 items-center justify-center rounded-btn border border-green-500/40 text-sm font-medium text-green-400 hover:bg-green-500/5 transition-colors"
                  >
                    Manage subscription
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => subscribe(plan.id)}
                    disabled={loading !== null}
                    className={`h-10 rounded-btn text-sm font-medium transition-colors disabled:opacity-60 ${
                      plan.highlight
                        ? "bg-accent text-white hover:bg-accent-hover"
                        : "border border-line text-content hover:bg-base"
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        Redirecting…
                      </span>
                    ) : currentPlan ? (
                      "Switch plan"
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise card */}
        <div
          className={`relative rounded-card border p-8 ${
            isCurrent("enterprise")
              ? "border-green-500/40 bg-surface"
              : "border-line bg-surface"
          }`}
        >
          {isCurrent("enterprise") && (
            <div className="absolute -top-3 left-8 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-white">
              Current plan
            </div>
          )}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-content">
                Enterprise — Pay as you go
              </h2>
              <p className="mt-1 text-sm text-content-muted">
                No hard limits. Billed monthly based on actual usage.
              </p>
              <div className="mt-3 flex flex-wrap gap-6">
                <div>
                  <span className="font-mono text-2xl font-semibold text-content">$0.02</span>
                  <span className="ml-1 text-sm text-content-muted">/ message sent</span>
                </div>
                <div>
                  <span className="font-mono text-2xl font-semibold text-content">$0.01</span>
                  <span className="ml-1 text-sm text-content-muted">/ customer stored/mo</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <ul className="space-y-1.5">
                {[
                  "Everything in Pro",
                  "Unlimited customers & messages",
                  "Dedicated account manager",
                  "SLA & uptime guarantee",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-content-muted">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent("enterprise") ? (
                <Link
                  href="/settings"
                  className="mt-2 flex h-10 items-center justify-center rounded-btn border border-green-500/40 px-6 text-sm font-medium text-green-400 hover:bg-green-500/5 transition-colors"
                >
                  Manage subscription
                </Link>
              ) : (
                <a
                  href="mailto:hello@scaleva.com?subject=Enterprise%20Plan%20Inquiry"
                  className="mt-2 flex h-10 items-center justify-center rounded-btn bg-content px-6 text-sm font-medium text-base hover:bg-content/90 transition-colors"
                >
                  Get started
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-content-muted">
          {currentPlan ? (
            <>
              <Link href="/dashboard" className="text-accent hover:underline">
                ← Back to dashboard
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
