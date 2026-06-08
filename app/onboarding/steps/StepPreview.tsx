"use client";

import { useCallback, useEffect, useState } from "react";
import type { OutreachParams } from "@/lib/claude";
import type { StepProps } from "../Wizard";

const DEMO_CUSTOMER = {
  name: "Alex Johnson",
  lastPurchase: "2 weeks ago",
  spent: "$45.00",
  // ISO-ish for the API
  lastPurchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
};

function buildDemoParams(state: StepProps["state"]): OutreachParams {
  const goal = state.goals.length > 0 ? state.goals.join(", ") : "re-engage the customer";
  const parts = [
    `Lifetime spend: ${DEMO_CUSTOMER.spent}`,
    `Last purchase: ${DEMO_CUSTOMER.lastPurchaseDate}`,
    `Days since last visit: 14`,
  ];
  if (state.customInstructions.trim()) {
    parts.push(`Extra instructions: ${state.customInstructions.trim()}`);
  }
  return {
    customerName: DEMO_CUSTOMER.name,
    businessName: state.businessName || "your business",
    industry: state.industry,
    voice: state.voice,
    goal,
    context: parts.join(". "),
  };
}

export function StepPreview({ state, update }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    const preview = buildDemoParams(state);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok || !data.message) throw new Error(data.error ?? "Failed to generate");
      update({ previewMessage: data.message });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate message");
    } finally {
      setLoading(false);
    }
  }, [state, update]);

  useEffect(() => {
    if (!state.previewMessage && !loading) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        See what it looks like
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        A real AI-generated preview using your exact settings and a sample customer.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* Demo customer card */}
        <div className="rounded-card border border-line bg-base p-5">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-content-muted">
            Sample customer
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
              AJ
            </div>
            <div>
              <p className="font-medium text-content">{DEMO_CUSTOMER.name}</p>
              <p className="text-xs text-content-muted">
                Last visit: {DEMO_CUSTOMER.lastPurchase} &middot; Spent {DEMO_CUSTOMER.spent}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-muted">Business</span>
              <span className="text-xs font-medium text-content">{state.businessName || "your business"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-muted">Industry</span>
              <span className="text-xs font-medium text-content">{state.industry}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-muted">Voice</span>
              <span className="text-xs font-medium text-content">{state.voice}</span>
            </div>
          </div>
        </div>

        {/* iPhone SMS mockup */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[200px]">
            {/* Phone frame */}
            <div className="rounded-[2rem] border-4 border-content/20 bg-[#1a1a1a] shadow-2xl">
              {/* Notch */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-16 rounded-full bg-content/20" />
              </div>
              {/* Screen */}
              <div className="px-3 pb-4 pt-2">
                {/* Status bar */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[9px] text-content-muted">9:41</span>
                  <span className="text-[9px] text-content-muted">▉▉▉▉</span>
                </div>
                {/* Contact */}
                <div className="mb-3 text-center">
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                    {state.businessName ? state.businessName[0].toUpperCase() : "S"}
                  </div>
                  <p className="text-[10px] text-content-muted">{state.businessName || "Scaleva"}</p>
                </div>
                {/* Message bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-[#2a2d35] px-3 py-2">
                    {loading ? (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-content-muted [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-content-muted [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-content-muted [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-content">
                        {state.previewMessage || "Generating…"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-danger">{error}</p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Regenerate
        </button>
        <p className="text-xs text-content-muted">
          Real AI preview &mdash; uses your exact settings
        </p>
      </div>
    </div>
  );
}
