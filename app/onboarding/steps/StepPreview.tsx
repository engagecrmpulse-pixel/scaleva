"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { OutreachParams } from "@/lib/claude";
import type { StepProps } from "../Wizard";

/** Builds the inline preview payload from wizard state + first customer. */
function buildPreviewParams(
  state: StepProps["state"]
): OutreachParams | null {
  const customer = state.customers[0];
  if (!customer) return null;

  const goal =
    state.goals.length > 0
      ? state.goals.join(", ")
      : "re-engage the customer";

  const contextParts = [
    `Lifetime spend: ${formatCurrency(customer.spend_amount || 0)}`,
    `Last purchase: ${customer.last_purchase || "unknown"}`,
  ];
  if (state.customInstructions.trim()) {
    contextParts.push(`Extra instructions: ${state.customInstructions.trim()}`);
  }

  return {
    customerName: customer.name,
    businessName: state.businessName || "our business",
    industry: state.industry,
    voice: state.voice,
    goal,
    context: contextParts.join(". "),
  };
}

export function StepPreview({ state, update }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const customer = state.customers[0];

  const generate = useCallback(async () => {
    const preview = buildPreviewParams(state);
    if (!preview) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok || !data.message) {
        throw new Error(data.error ?? "Failed to generate message");
      }
      update({ previewMessage: data.message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate message");
    } finally {
      setLoading(false);
    }
  }, [state, update]);

  // Auto-generate the first time we land on this step with no message yet.
  useEffect(() => {
    if (customer && !state.previewMessage && !loading) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!customer) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm text-gray-600">
          No customers imported yet. Go back to the connect step and add at
          least one customer to preview a message.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Preview your first message</h2>
      <p className="mt-1 text-sm text-gray-500">
        Here&apos;s how the AI will write to your customers.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{customer.name}</p>
            <p className="text-xs text-gray-500">
              Last purchase: {formatDate(customer.last_purchase || null)} ·{" "}
              {formatCurrency(customer.spend_amount || 0)}
            </p>
          </div>
        </div>

        {/* Chat bubble */}
        <div className="flex justify-start">
          <div className="max-w-md rounded-2xl rounded-bl-sm bg-brand-600 px-4 py-3 text-sm text-white">
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Writing…
              </span>
            ) : editing ? (
              <textarea
                autoFocus
                rows={4}
                className="w-full resize-none rounded-md bg-white/10 p-2 text-white placeholder:text-white/60 focus:outline-none"
                value={state.previewMessage}
                onChange={(e) => update({ previewMessage: e.target.value })}
              />
            ) : (
              state.previewMessage || "No message yet."
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={generate}
            disabled={loading}
          >
            Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
            disabled={loading || !state.previewMessage}
          >
            {editing ? "Done editing" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden
    />
  );
}
