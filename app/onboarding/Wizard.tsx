"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
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

const STEP_TITLES = [
  "Data source",
  "Connect data",
  "Business details",
  "Preview message",
  "Launch",
];

/** Returns true when the current step has enough data to advance. */
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
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-gray-900">{STEP_TITLES[step - 1]}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={
                "h-1.5 flex-1 rounded-full transition-colors " +
                (i < step ? "bg-brand-600" : "bg-gray-200")
              }
            />
          ))}
        </div>
      </div>

      {/* Active step */}
      <div className="min-h-[24rem]">
        {step === 1 && <StepDataSource {...stepProps} />}
        {step === 2 && <StepConnect {...stepProps} />}
        {step === 3 && <StepDetails {...stepProps} />}
        {step === 4 && <StepPreview {...stepProps} />}
        {step === 5 && <StepLaunch {...stepProps} onBack={back} />}
      </div>

      {/* Footer nav — Launch step renders its own primary action. */}
      {step < TOTAL_STEPS && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          <Button variant="ghost" onClick={back} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={next} disabled={!canAdvance(step, state)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
