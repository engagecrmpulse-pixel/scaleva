"use client";

import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { CsvDropzone } from "@/components/import/CsvDropzone";
import { ManualEntryForm } from "@/components/import/ManualEntryForm";
import { CustomerPreviewTable } from "@/components/import/CustomerPreviewTable";
import { DATA_SOURCES } from "../types";
import type { StepProps } from "../Wizard";

export function StepConnect({ state, update }: StepProps) {
  const source = DATA_SOURCES.find((s) => s.id === state.dataSource);

  if (!source) {
    return (
      <p className="text-sm text-content-muted">
        Go back and choose a data source first.
      </p>
    );
  }

  if (source.oauth) {
    return <OAuthConnect state={state} update={update} />;
  }

  if (source.id === "csv") {
    return (
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
          Upload a CSV
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          We&apos;ll preview the rows before anything is saved.
        </p>
        <div className="mt-6">
          <CsvDropzone onCustomers={(customers) => update({ customers })} />
          <CustomerPreviewTable customers={state.customers} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Add customers
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        Enter your customers one at a time. Add as many as you like.
      </p>
      <div className="mt-6">
        <ManualEntryForm
          customers={state.customers}
          onChange={(customers) => update({ customers })}
        />
      </div>
    </div>
  );
}

function OAuthConnect({ state, update }: StepProps) {
  const source = DATA_SOURCES.find((s) => s.id === state.dataSource)!;

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Connect {source.name}
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        Authorize Scaleva to import your customers from {source.name}.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-base px-6 py-12 text-center">
        {state.connected ? (
          <>
            <Badge tone="green" className="mt-4">
              Connected
            </Badge>
            <p className="mt-3 max-w-sm text-sm text-content-muted">
              {source.name} is connected. You can finish setup now and import
              customers from the dashboard.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => update({ connected: false })}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <p className="max-w-sm text-sm text-content-muted">
              This is a placeholder connection for onboarding. Real syncing for{" "}
              {source.name} runs from the dashboard once you&apos;re set up.
            </p>
            <Button className="mt-4" onClick={() => update({ connected: true })}>
              Connect {source.name}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
