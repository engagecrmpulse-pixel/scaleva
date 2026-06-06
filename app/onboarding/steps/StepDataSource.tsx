"use client";

import { cn } from "@/utils/helpers";
import { DATA_SOURCES } from "../types";
import type { StepProps } from "../Wizard";

export function StepDataSource({ state, update }: StepProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Where do your customers come from?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Pick a source to import your customer list. You can change this later.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DATA_SOURCES.map((source) => {
          const selected = state.dataSource === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() =>
                update({
                  dataSource: source.id,
                  // Reset connection state when switching sources.
                  connected: false,
                })
              }
              className={cn(
                "flex flex-col items-start rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                selected
                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
              aria-pressed={selected}
            >
              <span className="text-2xl" aria-hidden>
                {source.icon}
              </span>
              <span className="mt-2 font-semibold text-gray-900">
                {source.name}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                {source.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
