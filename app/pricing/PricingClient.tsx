"use client";

import { useState, useEffect } from "react";
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
    price: 499,
    annualPrice: 399,
    customerLimit: "2,000 customers",
    messageLimit: "8,000 messages/mo",
    features: ["All integrations (Square, Stripe, Shopify…)", "AI Conversation Engine — 24/7 replies", "Industry-specific onboarding", "Full analytics", "Autopilot scheduling", "Priority support"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 899,
    annualPrice: 719,
    customerLimit: "7,500 customers",
    messageLimit: "30,000 messages/mo",
    features: ["Everything in Growth", "Menu & service intelligence", "Revenue tracking", "Data export", "Dedicated onboarding"],
    highlight: false,
  },
];

const COMPARISON: { label: string; starter: string | boolean; growth: string | boolean; pro: string | boolean; enterprise: string | boolean }[] = [
  { label: "Customers", starter: "500", growth: "2,000", pro: "7,500", enterprise: "Unlimited" },
  { label: "Messages / month", starter: "2,000", growth: "8,000", pro: "30,000", enterprise: "Unlimited" },
  { label: "AI message generation", starter: true, growth: true, pro: true, enterprise: true },
  { label: "Industry-specific onboarding", starter: true, growth: true, pro: true, enterprise: true },
  { label: "Square / Stripe / Shopify", starter: false, growth: true, pro: true, enterprise: true },
  { label: "AI Conversation Engine", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Autopilot scheduling", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Full analytics", starter: false, growth: true, pro: true, enterprise: true },
  { label: "Menu & service intelligence", starter: false, growth: false, pro: true, enterprise: true },
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
  const [unlocked, setUnlocked] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [gateCode, setGateCode] = useState("");
  const [gateVerifying, setGateVerifying] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [bypassCode, setBypassCode] = useState("");
  const [bypassPlan, setBypassPlan] = useState("pro");
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [bypassSuccess, setBypassSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pricing_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  async function verifyGateCode() {
    if (!gateCode.trim()) return;
    setGateVerifying(true);
    setGateError(null);
    try {
      const res = await fetch("/api/pricing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: gateCode.trim() }),
      });
      if (!res.ok) {
        setGateError("Invalid access code.");
        setGateVerifying(false);
        return;
      }
      localStorage.setItem("pricing_unlocked", "1");
      setUnlocked(true);
    } catch {
      setGateError("Something went wrong. Try again.");
    }
    setGateVerifying(false);
  }

  async function applyBypass() {
    setBypassLoading(true);
    setBypassError(null);
    const res = await fetch("/api/stripe/bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: bypassCode, plan: bypassPlan }),
    });
    const data = (await res.json()) as { ok?: boolean; plan?: string; error?: string };
    setBypassLoading(false);
    if (!res.ok || !data.ok) {
      setBypassError(data.error ?? "Invalid code");
      return;
    }
    setBypassSuccess(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
  }

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

  // Existing subscribers skip the gate — they need access for subscription management
  const showPricing = currentPlan || unlocked;

  if (!showPricing) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: "#f0f2f8" }}>
        <div className="border-b border-gray-200/60 bg-white px-6 py-5">
          <div className="mx-auto max-w-5xl">
            <Link href="/" className="font-heading text-sm font-semibold tracking-tight text-gray-900">Scaleva</Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900">
            Scaleva is in private development
          </h1>
          <p className="mt-3 max-w-sm text-gray-500">
            We&apos;re still building. Pricing is not publicly available yet — we&apos;re in a closed iteration phase and not accepting new signups at this time.
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Check back soon, or reach out at{" "}
            <a href="mailto:engagecrmpulse@gmail.com" className="text-blue-600 hover:underline">engagecrmpulse@gmail.com</a>
            {" "}if you&apos;re interested.
          </p>

          {!showCodeInput ? (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="mt-12 text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
            >
              Have an access code?
            </button>
          ) : (
            <div className="mt-8 w-full max-w-xs">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 text-left">
                <p className="mb-3 text-sm font-semibold text-gray-900">Enter access code</p>
                <input
                  type="text"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void verifyGateCode(); }}
                  placeholder="Access code"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                {gateError && <p className="mt-2 text-xs text-red-500">{gateError}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowCodeInput(false); setGateCode(""); setGateError(null); }}
                    className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void verifyGateCode()}
                    disabled={!gateCode.trim() || gateVerifying}
                    className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {gateVerifying ? "Checking…" : "Unlock"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <p className="mt-3 text-gray-500">14-day free trial. Cancel anytime.</p>
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
                {!current && (
                  <p className={`mt-1 text-xs font-medium ${plan.highlight ? "text-blue-200" : "text-green-600"}`}>
                    14-day free trial included
                  </p>
                )}

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

        {/* Owner access bypass */}
        <div className="mb-8 text-center">
          {!showBypass ? (
            <button
              type="button"
              onClick={() => setShowBypass(true)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Have an access code?
            </button>
          ) : bypassSuccess ? (
            <p className="text-sm font-semibold text-green-600">
              Access granted — redirecting to dashboard…
            </p>
          ) : (
            <div className="mx-auto max-w-sm rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 text-left">
              <p className="mb-3 text-sm font-semibold text-gray-900">Enter access code</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={bypassCode}
                  onChange={(e) => setBypassCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void applyBypass(); }}
                  placeholder="Code"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <select
                  value={bypassPlan}
                  onChange={(e) => setBypassPlan(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="starter">Starter plan</option>
                  <option value="growth">Growth plan</option>
                  <option value="pro">Pro plan</option>
                </select>
                {bypassError && <p className="text-xs text-red-500">{bypassError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowBypass(false); setBypassCode(""); setBypassError(null); }}
                    className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void applyBypass()}
                    disabled={!bypassCode.trim() || bypassLoading}
                    className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bypassLoading ? "Applying…" : "Apply"}
                  </button>
                </div>
              </div>
            </div>
          )}
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
              <span><span className="font-mono font-bold text-gray-900">Unlimited</span> <span className="text-gray-400">AI conversations</span></span>
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
                href="mailto:engagecrmpulse@gmail.com?subject=Enterprise%20Plan%20Inquiry"
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
