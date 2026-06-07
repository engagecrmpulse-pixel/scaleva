"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import type { BusinessConfig, SpendHistoryEntry } from "@/utils/database.types";
import type { StepProps } from "../Wizard";

interface StepLaunchProps extends StepProps {
  onBack: () => void;
}

export function StepLaunch({ state, onBack }: StepLaunchProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const config: BusinessConfig = {
      autopilot: false,
      cadence: state.cadence,
      goals: state.goals,
      customInstructions: state.customInstructions,
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

    if (state.customers.length > 0) {
      const rows = state.customers.map((c) => {
        const spend_history: SpendHistoryEntry[] =
          c.spend_amount > 0
            ? [
                {
                  date: c.last_purchase || new Date().toISOString(),
                  amount: c.spend_amount,
                },
              ]
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

      const { error: customersError } = await supabase
        .from("customers")
        .insert(rows);

      if (customersError) {
        setLoading(false);
        setError(
          `Business created, but importing customers failed: ${customersError.message}`
        );
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
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
        <SummaryRow
          label="Customers imported"
          value={String(state.customers.length)}
        />
        <SummaryRow label="Message cadence" value={state.cadence} />
        <SummaryRow
          label="Goals"
          value={state.goals.length ? state.goals.join(", ") : "—"}
        />
      </dl>

      {error && <p className="mt-4 text-xs text-danger">{error}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button size="lg" onClick={goLive} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden
              />
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
