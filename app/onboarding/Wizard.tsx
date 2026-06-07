"use client";

import { Fragment, useState } from "react";
import { cn } from "@/utils/helpers";
import {
  DATA_SOURCES,
  TOTAL_STEPS,
  initialWizardState,
  type WizardState,
} from "./types";
import { StepDataSource } from "./steps/StepDataSource";
import { StepConnect } from "./steps/StepConnect";
import { StepDetails } from "./steps/StepDetails";
import { StepPreview } from "./steps/StepPreview";
import { StepLaunch } from "./steps/StepLaunch";

export interface StepProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
}

const STEP_LABELS = ["Data source", "Connect", "Business", "Preview", "Launch"];

function canAdvance(step: number, state: WizardState): boolean {
  switch (step) {
    case 1:
      return state.dataSource !== null;
    case 2: {
      const source = DATA_SOURCES.find((s) => s.id === state.dataSource);
      if (!source) return false;
      return source.oauth ? state.connected : state.customers.length > 0;
    }
    case 3:
      return state.businessName.trim().length > 0;
    case 4:
      return state.previewMessage.trim().length > 0;
    default:
      return true;
  }
}

export function Wizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialWizardState);

  function update(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  const stepProps: StepProps = { state, update };

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      {/* Step indicators */}
      <div className="mb-10">
        <div className="flex items-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <Fragment key={i}>
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-colors duration-300",
                      done ? "bg-indigo-600" : "bg-gray-200"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    done && "bg-indigo-600 text-white",
                    current && "bg-indigo-600 text-white ring-4 ring-indigo-100",
                    !done && !current && "bg-gray-100 text-gray-400"
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
        <div className="mt-3 flex">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={cn(
                "flex-1 text-xs font-medium transition-colors",
                i === 0 ? "text-left" : i === TOTAL_STEPS - 1 ? "text-right" : "text-center",
                i + 1 === step ? "text-indigo-600" : "text-gray-400"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="min-h-[22rem]">
          {step === 1 && <StepDataSource {...stepProps} />}
          {step === 2 && <StepConnect {...stepProps} />}
          {step === 3 && <StepDetails {...stepProps} />}
          {step === 4 && <StepPreview {...stepProps} />}
          {step === 5 && <StepLaunch {...stepProps} onBack={back} />}
        </div>

        {step < TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance(step, state)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
