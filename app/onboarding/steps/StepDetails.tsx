"use client";

import { Input } from "@/components/Input";
import { cn } from "@/utils/helpers";
import { CADENCES, GOALS, INDUSTRIES, VOICES } from "../types";
import type { StepProps } from "../Wizard";

const selectClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export function StepDetails({ state, update }: StepProps) {
  function toggleGoal(goal: string) {
    const next = state.goals.includes(goal)
      ? state.goals.filter((g) => g !== goal)
      : [...state.goals, goal];
    update({ goals: next });
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Tell us about your business</h2>
      <p className="mt-1 text-sm text-gray-500">
        This shapes how the AI writes on your behalf.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <Input
          label="Business name"
          value={state.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
          placeholder="Acme Coffee Co."
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Industry</label>
          <select
            className={selectClass}
            value={state.industry}
            onChange={(e) => update({ industry: e.target.value })}
          >
            {INDUSTRIES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Brand voice</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VOICES.map((option) => {
              const selected = state.voice === option;
              return (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
                    selected
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
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
          <span className="text-sm font-medium text-gray-700">
            Business goals
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const checked = state.goals.includes(goal);
              return (
                <label
                  key={goal}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    checked
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGoal(goal)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {goal}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Message cadence
          </label>
          <select
            className={selectClass}
            value={state.cadence}
            onChange={(e) => update({ cadence: e.target.value })}
          >
            {CADENCES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="customInstructions"
            className="text-sm font-medium text-gray-700"
          >
            Custom AI instructions
          </label>
          <textarea
            id="customInstructions"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder='e.g. "Always mention our loyalty program" or "Focus on customers who haven&apos;t visited in 30 days"'
            value={state.customInstructions}
            onChange={(e) => update({ customInstructions: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
