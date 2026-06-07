"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { OutreachParams } from "@/lib/claude";
import type { StepProps } from "../Wizard";

function buildPreviewParams(state: StepProps["state"]): OutreachParams | null {
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

  useEffect(() => {
    if (customer && !state.previewMessage && !loading) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!customer) {
    return (
      <div className="rounded-card border border-dashed border-line bg-base px-6 py-12 text-center">
        <p className="text-sm text-content-muted">
          No customers imported yet. Go back to the connect step and add at
          least one customer to preview a message.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Preview your first message
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        Here&apos;s how Scaleva will write to your customers.
      </p>

      <div className="mt-6 rounded-card border border-line bg-base p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-content">{customer.name}</p>
            <p className="text-xs text-content-muted">
              Last purchase: {formatDate(customer.last_purchase || null)}{" "}
              &middot; {formatCurrency(customer.spend_amount || 0)}
            </p>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-md rounded-card rounded-bl-sm bg-accent/10 border border-accent/20 px-4 py-3 text-sm text-content">
            {loading ? (
              <span className="flex items-center gap-2 text-content-muted">
                <Spinner />
                Writing...
              </span>
            ) : editing ? (
              <textarea
                autoFocus
                rows={4}
                className="w-full resize-none rounded-btn bg-surface/50 p-2 text-content placeholder:text-content-muted/60 focus:outline-none"
                value={state.previewMessage}
                onChange={(e) => update({ previewMessage: e.target.value })}
              />
            ) : (
              state.previewMessage || "No message yet."
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={generate} disabled={loading}>
            Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
            disabled={loading || !state.previewMessage}
          >
            {editing ? "Done" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-content-muted/30 border-t-content-muted"
      aria-hidden
    />
  );
}
