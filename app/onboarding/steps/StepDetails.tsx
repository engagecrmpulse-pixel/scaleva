"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { cn } from "@/utils/helpers";
import { CADENCES, GOALS, INDUSTRIES, VOICES } from "../types";
import type { StepProps } from "../Wizard";

const selectClass =
  "w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

export function StepDetails({ state, update }: StepProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function toggleGoal(goal: string) {
    const next = state.goals.includes(goal)
      ? state.goals.filter((g) => g !== goal)
      : [...state.goals, goal];
    update({ goals: next });
  }

  const goalsSummary =
    state.goals.length > 0 ? state.goals.join(", ").toLowerCase() : "re-engaging customers";

  const industryDisplay =
    state.industry && state.industry !== "Other"
      ? ` for your ${state.industry.toLowerCase()} business`
      : "";

  const instructionsPreview =
    state.customInstructions.trim().length > 0
      ? `"${state.customInstructions.slice(0, 70)}${state.customInstructions.length > 70 ? "…" : ""}"`
      : null;

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Tell us about your business
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        This shapes how Scaleva writes on your behalf.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <Input
          label="Business name"
          value={state.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
          placeholder="Acme Coffee Co."
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-content-muted">Industry</label>
          <select
            className={selectClass}
            value={state.industry}
            onChange={(e) => update({ industry: e.target.value })}
          >
            {INDUSTRIES.map((option) => (
              <option key={option} className="bg-surface text-content">{option}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-content-muted">Brand voice</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VOICES.map((option) => {
              const selected = state.voice === option;
              return (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-btn border px-3 py-2 text-sm transition-colors",
                    selected
                      ? "border-accent bg-accent/5 text-content"
                      : "border-line text-content-muted hover:border-content-muted hover:text-content"
                  )}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={option}
                    checked={selected}
                    onChange={() => update({ voice: option })}
                    className="sr-only"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-content-muted">
            Business goals
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const checked = state.goals.includes(goal);
              return (
                <label
                  key={goal}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-btn border px-3 py-2 text-sm transition-colors",
                    checked
                      ? "border-accent bg-accent/5 text-content"
                      : "border-line text-content-muted hover:border-content-muted hover:text-content"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGoal(goal)}
                    className="h-4 w-4 rounded border-line bg-base text-accent focus:ring-accent"
                  />
                  {goal}
                </label>
              );
            })}
          </div>
        </div>

        {/* Advanced — cadence + custom instructions */}
        <div className="rounded-btn border border-line">
          <button
            type="button"
            onClick={() => setShowAdvanced((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-content-muted hover:text-content transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Advanced settings
              {(state.customInstructions.trim() || state.cadence !== CADENCES[0]) && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">configured</span>
              )}
            </span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="border-t border-line px-4 pb-4 pt-3 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-content-muted">Message cadence</label>
                <select
                  className={selectClass}
                  value={state.cadence}
                  onChange={(e) => update({ cadence: e.target.value })}
                >
                  {CADENCES.map((option) => (
                    <option key={option} className="bg-surface text-content">{option}</option>
                  ))}
                </select>
                <p className="text-[11px] text-content-muted/70">How often Scaleva reaches out to each customer</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="customInstructions" className="text-xs font-medium text-content-muted">
                  Custom instructions <span className="font-normal opacity-60">(optional)</span>
                </label>
                <textarea
                  id="customInstructions"
                  rows={3}
                  className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  placeholder={'e.g. "Always mention our loyalty program" or "We never use the word cheap"'}
                  value={state.customInstructions}
                  onChange={(e) => update({ customInstructions: e.target.value })}
                />
                <p className="text-[11px] text-content-muted/70">You can add more detail here after launch too</p>
              </div>
            </div>
          )}
        </div>

        {/* Live AI preview */}
        <div className="rounded-card border border-accent/20 bg-accent/5 px-4 py-3.5">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-accent/70">
            AI Preview
          </p>
          <p className="text-sm leading-relaxed text-content">
            Your AI will sound{" "}
            <strong className="text-content">{state.voice.toLowerCase()}</strong> and
            focus on{" "}
            <strong className="text-content">{goalsSummary}</strong>
            {industryDisplay}.{" "}
            {state.cadence && (
              <>
                Messages go out <strong className="text-content">{state.cadence.toLowerCase()}</strong>.{" "}
              </>
            )}
            {instructionsPreview && (
              <>
                Extra rule: <span className="text-content-muted italic">{instructionsPreview}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
