"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Plan {
  id: "starter" | "growth" | "pro";
  name: string;
  price: number;
  customers: string;
  messages: string;
  features: string[];
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    customers: "500 customers",
    messages: "2,000 messages/mo",
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
    customers: "1,500 customers",
    messages: "6,000 messages/mo",
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
    customers: "5,000 customers",
    messages: "25,000 messages/mo",
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

export default function PricingPage() {
  const router = useRouter();
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

    const data = await res.json() as { url?: string; error?: string };

    if (!res.ok || !data.url) {
      setError(data.error ?? "Failed to start checkout");
      setLoading(null);
      return;
    }

    router.push(data.url);
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <Link href="/" className="font-heading text-sm font-semibold text-content-muted hover:text-content">
            Scaleva
          </Link>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-content">
            Simple, transparent pricing
          </h1>
          <p className="mt-2 text-sm text-content-muted">
            Start automating customer re-engagement today.
          </p>
        </div>

        {error && (
          <p className="mb-6 text-center text-sm text-danger">{error}</p>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-card border p-6 ${
                plan.highlight
                  ? "border-accent bg-accent/5 shadow-lg"
                  : "border-line bg-surface"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </div>
              )}

              <div className="mb-4">
                <h2 className="font-heading text-base font-semibold text-content">
                  {plan.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-semibold text-content">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-content-muted">/month</span>
                </div>
                <p className="mt-1 text-xs text-content-muted">
                  {plan.customers} &middot; {plan.messages}
                </p>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-content-muted">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

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
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-content-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
