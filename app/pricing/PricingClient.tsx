"use client";

import { useState } from "react";
import Link from "next/link";

interface FlatPlan {
  id: "starter" | "growth" | "pro";
  name: string;
  price: number;
  annualPrice: number;
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
    annualPrice: 159,
    customerLimit: "500 customers",
    messageLimit: "2,000 messages/mo",
    features: ["CSV & manual entry", "AI-generated messages", "Basic analytics", "Email support"],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 399,
    annualPrice: 319,
    customerLimit: "1,500 customers",
    messageLimit: "6,000 messages/mo",
    features: ["All integrations (Square, Stripe, Shopify…)", "Full analytics", "Autopilot scheduling", "Two-way SMS", "Priority support"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 699,
    annualPrice: 559,
    customerLimit: "5,000 customers",
    messageLimit: "25,000 messages/mo",
    features: ["Everything in Growth", "Revenue tracking", "Data export", "Dedicated onboarding"],
    highlight: false,
  },
];

const COMPARISON: { label: string; starter: string | boolean; growth: string | boolean; pro: string | boolean; enterprise: string | boolean }[] = [
  { label: "Customers", starter: "500", growth: "1,500", pro: "5,000", enterprise: "Unlimited" },
  { label: "Messages / month", starter: "2,000", growth: "6,000", pro: "25,000", enterprise: "Unlimited" },
  { label: "AI message generation", starter: true, growth: true, pro: true, enterprise: true },
  { label: "Square / Stripe / Shopify", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Autopilot scheduling", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Two-way SMS", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Full analytics", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Revenue tracking", starter: false, growth: false, pro: true, enterprise: true },
  { label: "Data export", starter: false, growth: false, pro: true, enterprise: true },
  { label: "Dedicated onboarding", starter: false, growth: false, pro: true, enterprise: true },
  { label: "Account manager", starter: false, growth: false, pro: false, enterprise: true },
  { label: "SLA & uptime guarantee", starter: false, growth: false, pro: false, enterprise: true },
  { label: "Support", starter: "Email", growth: "Priority", pro: "Priority", enterprise: "Dedicated" },
];

function CheckIcon() {
  return (
    <svg className="mx-auto h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="mx-auto h-4 w-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Cell({ val }: { val: string | boolean }) {
  if (val === true) return <CheckIcon />;
  if (val === false) return <XIcon />;
  return <span className="text-xs font-medium text-gray-700">{val}</span>;
}

function PlanCheckIcon({ highlight }: { highlight: boolean }) {
  return (
    <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 ${highlight ? "text-blue-200" : "text-blue-500"}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
  const [annual, setAnnual] = useState(false);

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
    <div className="min-h-screen" style={{ background: "#f0f2f8" }}>
      {isPastDue && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <p className="text-sm text-amber-700">
            Your payment failed. Update your billing info to keep Scaleva running.{" "}
            <Link href="/settings" className="font-semibold underline">Manage billing →</Link>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200/60 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-heading text-sm font-semibold tracking-tight text-gray-900">Scaleva</Link>
          {currentPlan && (
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">← Back to dashboard</Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Title */}
        <div className="mb-4 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-[-0.03em] text-gray-900">Simple, transparent pricing</h1>
          <p className="mt-3 text-gray-500">Start automating customer re-engagement today. Upgrade or downgrade anytime.</p>
        </div>

        {/* Annual toggle */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-gray-200">
            <span className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-11 rounded-full transition-colors ${annual ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-400"}`}>
              Annual <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">-20%</span>
            </span>
          </div>
        </div>

        {error && <p className="mb-6 text-center text-sm text-red-500">{error}</p>}

        {/* Plan cards */}
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {FLAT_PLANS.map((plan) => {
            const current = isCurrent(plan.id);
            const price = annual ? plan.annualPrice : plan.price;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.highlight
                    ? "bg-blue-600 text-white shadow-xl ring-2 ring-blue-500"
                    : "bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-md"
                }`}
              >
                {plan.highlight && !current && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-900 px-4 py-1 text-xs font-bold text-white shadow">
                    Most Popular
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-4 py-1 text-xs font-bold text-white shadow">
                    Current plan
                  </div>
                )}

                <h2 className={`font-heading text-lg font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`font-mono text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>${price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>/month</span>
                </div>
                <p className={`mt-1 text-xs ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>
                  {plan.customerLimit} · {plan.messageLimit}
                </p>

                <ul className="mb-6 mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <PlanCheckIcon highlight={plan.highlight} />
                      <span className={plan.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {current ? (
                  <Link
                    href="/settings"
                    className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                      plan.highlight ? "bg-white/20 text-white hover:bg-white/30" : "border border-green-300 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    Manage subscription
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => subscribe(plan.id)}
                    disabled={loading !== null}
                    className={`h-11 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                      plan.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        Redirecting…
                      </span>
                    ) : currentPlan ? "Switch plan" : `Start with ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise */}
        <div className={`mb-16 rounded-2xl p-7 md:flex md:items-center md:justify-between ${isCurrent("enterprise") ? "bg-white ring-2 ring-green-400" : "bg-white ring-1 ring-gray-200 shadow-sm"}`}>
          {isCurrent("enterprise") && (
            <div className="mb-4 inline-flex rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white md:mb-0">Current plan</div>
          )}
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">Enterprise — Pay as you go</h2>
            <p className="mt-1 text-sm text-gray-500">No hard limits. Billed monthly based on actual usage.</p>
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <span><span className="font-mono font-bold text-gray-900">$0.02</span> <span className="text-gray-400">/ message sent</span></span>
              <span><span className="font-mono font-bold text-gray-900">$0.01</span> <span className="text-gray-400">/ customer/mo</span></span>
            </div>
          </div>
          <div className="mt-5 flex flex-col items-start gap-3 md:mt-0 md:items-end">
            <ul className="space-y-1.5">
              {["Everything in Pro", "Unlimited customers & messages", "Dedicated account manager", "SLA & uptime guarantee"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <PlanCheckIcon highlight={false} />
                  {f}
                </li>
              ))}
            </ul>
            {isCurrent("enterprise") ? (
              <Link href="/settings" className="mt-2 flex h-11 items-center justify-center rounded-xl border border-green-300 px-6 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors">
                Manage subscription
              </Link>
            ) : (
              <a
                href="mailto:hello@scaleva.com?subject=Enterprise%20Plan%20Inquiry"
                className="mt-2 flex h-11 items-center justify-center rounded-xl bg-gray-900 px-6 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Contact us
              </a>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-[-0.02em] text-gray-900">Full feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Feature</th>
                  {["Starter", "Growth", "Pro", "Enterprise"].map((h, i) => (
                    <th key={h} className={`py-4 px-4 text-center text-xs font-bold uppercase tracking-wider ${i === 1 ? "text-blue-600" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="py-3.5 pl-6 pr-4 font-medium text-gray-700">{row.label}</td>
                    <td className="py-3.5 px-4 text-center"><Cell val={row.starter} /></td>
                    <td className="py-3.5 px-4 text-center"><Cell val={row.growth} /></td>
                    <td className="py-3.5 px-4 text-center"><Cell val={row.pro} /></td>
                    <td className="py-3.5 px-4 text-center"><Cell val={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          {currentPlan ? (
            <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to dashboard</Link>
          ) : (
            <>Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
