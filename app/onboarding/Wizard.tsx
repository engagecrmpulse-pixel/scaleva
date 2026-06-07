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
                      done ? "bg-accent" : "bg-line"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-btn text-xs font-semibold transition-all duration-300",
                    done && "bg-accent text-white",
                    current && "bg-accent text-white ring-2 ring-accent/30 ring-offset-2 ring-offset-base",
                    !done && !current && "bg-surface border border-line text-content-muted"
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
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
                i === 0
                  ? "text-left"
                  : i === TOTAL_STEPS - 1
                  ? "text-right"
                  : "text-center",
                i + 1 === step ? "text-accent" : "text-content-muted"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="rounded-card border border-line bg-surface p-8">
        <div className="min-h-[22rem]">
          {step === 1 && <StepDataSource {...stepProps} />}
          {step === 2 && <StepConnect {...stepProps} />}
          {step === 3 && <StepDetails {...stepProps} />}
          {step === 4 && <StepPreview {...stepProps} />}
          {step === 5 && <StepLaunch {...stepProps} onBack={back} />}
        </div>

        {step < TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="inline-flex h-9 items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-content-muted transition-colors hover:bg-base hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance(step, state)}
              className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
