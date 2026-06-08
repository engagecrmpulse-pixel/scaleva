"use client";

import { Input } from "@/components/Input";
import { cn } from "@/utils/helpers";
import { CADENCES, GOALS, INDUSTRIES, VOICES } from "../types";
import type { StepProps } from "../Wizard";

const selectClass =
  "w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

export function StepDetails({ state, update }: StepProps) {
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-content-muted">
            Message cadence
          </label>
          <select
            className={selectClass}
            value={state.cadence}
            onChange={(e) => update({ cadence: e.target.value })}
          >
            {CADENCES.map((option) => (
              <option key={option} className="bg-surface text-content">{option}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="customInstructions"
            className="text-xs font-medium text-content-muted"
          >
            Custom instructions
          </label>
          <textarea
            id="customInstructions"
            rows={3}
            className="w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            placeholder='e.g. "Always mention our loyalty program" or "Focus on customers who haven&apos;t visited in 30 days"'
            value={state.customInstructions}
            onChange={(e) => update({ customInstructions: e.target.value })}
          />
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
