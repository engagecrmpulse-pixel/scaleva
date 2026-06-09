"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import type { BusinessConfig, SpendHistoryEntry } from "@/utils/database.types";
import type { StepProps } from "../Wizard";

interface StepLaunchProps extends StepProps {
  onBack: () => void;
  onClearStorage?: () => void;
}

function firstSendDate(cadence: string): string {
  const now = new Date();
  let daysOut = 7;
  if (cadence === "Daily") daysOut = 1;
  else if (cadence === "Every 3 days") daysOut = 3;
  else if (cadence === "Bi-weekly") daysOut = 14;
  else if (cadence === "Monthly") daysOut = 30;
  const d = new Date(now.getTime() + daysOut * 86400000);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function StepLaunch({ state, onBack, onClearStorage }: StepLaunchProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);

  async function goLive() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Prevent duplicate business creation
    const { data: existingBiz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingBiz) {
      onClearStorage?.();
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const config: BusinessConfig = {
      autopilot: false,
      cadence: state.cadence,
      goals: state.goals,
      customInstructions: state.customInstructions,
      businessHours: Object.fromEntries(
        Object.entries(state.businessHours).map(([day, h]) => [
          day, { open: h.open, close: h.close, closed: h.closed },
        ])
      ) as BusinessConfig["businessHours"],
      businessPhone: state.businessPhone || undefined,
      businessAddress: state.businessAddress || undefined,
      specialOffer: state.specialOffer || undefined,
      bookingLink: state.bookingLink || undefined,
      loyaltyProgram: state.loyaltyProgram || undefined,
      faq: state.faq
        .filter((f) => f.question.trim() && f.answer.trim())
        .map((f) => ({ question: f.question, answer: f.answer })),
    };

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: state.businessName,
        industry: state.industry,
        voice: state.voice,
        goals: state.goals.join(", "),
        data_source: state.dataSource ?? "manual",
        config,
      })
      .select("id")
      .single();

    if (businessError || !business) {
      setLoading(false);
      setError(businessError?.message ?? "Could not create your business.");
      return;
    }

    // Save menu / service items
    const validItems = state.menuItems.filter((i) => i.name.trim());
    if (validItems.length > 0) {
      await supabase.from("menu_items").insert(
        validItems.map((item, idx) => ({
          business_id: business.id,
          name: item.name.trim(),
          category: item.category || null,
          price: item.price ? parseFloat(item.price) : null,
          description: item.description.trim() || null,
          sort_order: idx,
        }))
      );
    }

    if (state.customers.length > 0) {
      const rows = state.customers.map((c) => {
        const spend_history: SpendHistoryEntry[] =
          c.spend_amount > 0
            ? [{ date: c.last_purchase || new Date().toISOString(), amount: c.spend_amount }]
            : [];
        return {
          business_id: business.id,
          name: c.name,
          phone: c.phone || null,
          email: c.email || null,
          last_purchase: c.last_purchase || null,
          spend_history,
        };
      });

      const { error: customersError } = await supabase.from("customers").insert(rows);

      if (customersError) {
        setLoading(false);
        setError(`Business created, but importing customers failed: ${customersError.message}`);
        return;
      }
    }

    setLoading(false);
    setLaunched(true);
    onClearStorage?.();
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2200);
  }

  if (launched) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg
            className="h-20 w-20 animate-[spin_0.6s_ease-out_forwards]"
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#3B82F6"
              strokeWidth="4"
              strokeDasharray="226"
              strokeDashoffset="0"
              className="animate-[draw_0.6s_ease-out_forwards]"
              style={{ strokeDashoffset: 0 }}
            />
          </svg>
          <svg
            className="absolute h-10 w-10 animate-[fadeIn_0.3s_ease-out_0.4s_both]"
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="mt-5 font-heading text-xl font-semibold tracking-tight text-content">
          {state.businessName} is live!
        </h2>
        <p className="mt-1.5 text-sm text-content-muted">
          Scaleva is now monitoring your customers and building your retention engine.
        </p>

        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-card border border-accent/20 bg-accent/5 p-4 text-center">
            <p className="font-mono text-2xl font-bold text-accent">{state.customers.length}</p>
            <p className="mt-0.5 text-xs text-content-muted">customers imported</p>
          </div>
          <div className="rounded-card border border-green-500/20 bg-green-500/5 p-4 text-center">
            <p className="font-mono text-2xl font-bold text-green-400">{firstSendDate(state.cadence).split(",")[0]}</p>
            <p className="mt-0.5 text-xs text-content-muted">first send</p>
          </div>
        </div>

        <div className="mt-4 w-full max-w-sm rounded-card border border-line bg-base p-4 text-left">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-content-muted">
            What happens next
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Your dashboard is ready to explore", desc: "See your customers, analytics, and controls" },
              { label: "Enable autopilot to go hands-free", desc: "Scaleva will reach customers on your schedule" },
              { label: `First outreach on ${firstSendDate(state.cadence)}`, desc: "AI-personalized messages for every customer" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent/15">
                  <svg className="h-2.5 w-2.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-medium text-content">{item.label}</p>
                  <p className="text-[10px] text-content-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-content-muted">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Ready to launch
      </h2>
      <p className="mt-1.5 text-sm text-content-muted">
        Review your setup, then go live.
      </p>

      <dl className="mt-6 divide-y divide-line rounded-card border border-line bg-base">
        <SummaryRow label="Business name" value={state.businessName || "—"} />
        <SummaryRow label="Industry" value={state.industry} />
        <SummaryRow label="Customers imported" value={String(state.customers.length)} />
        {state.menuItems.filter((i) => i.name.trim()).length > 0 && (
          <SummaryRow label="Items on file" value={String(state.menuItems.filter((i) => i.name.trim()).length)} />
        )}
        {state.specialOffer.trim() && (
          <SummaryRow label="Current offer" value={state.specialOffer.length > 40 ? `${state.specialOffer.slice(0, 40)}…` : state.specialOffer} />
        )}
        <SummaryRow label="Message cadence" value={state.cadence} />
        <SummaryRow label="Goals" value={state.goals.length ? state.goals.join(", ") : "—"} />
        <SummaryRow label="First send date" value={firstSendDate(state.cadence)} />
      </dl>

      {error && <p className="mt-4 text-xs text-danger">{error}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button size="lg" onClick={goLive} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              Launching...
            </span>
          ) : (
            "Go live"
          )}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm text-content-muted">{label}</dt>
      <dd className="text-sm font-medium text-content">{value}</dd>
    </div>
  );
}
