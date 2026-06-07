"use client";

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
  const oauthUrl = `/api/oauth/${source.id}`;

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
              {source.name} is connected. Scaleva will sync your customers daily
              and update records automatically.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-content-muted hover:text-content transition-colors"
              onClick={() => update({ connected: false })}
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-card border border-line bg-surface text-2xl">
              {source.icon}
            </div>
            <p className="max-w-xs text-sm text-content-muted">
              Click below to authorize Scaleva to read your {source.name}{" "}
              customers, purchase history, and spend data.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <a
                href={oauthUrl}
                className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                Connect {source.name}
              </a>
              <button
                type="button"
                className="text-xs text-content-muted hover:text-content"
                onClick={() => update({ connected: true })}
              >
                Skip for now (connect from dashboard later)
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 rounded-card border border-line bg-base px-4 py-3">
        <p className="text-xs text-content-muted">
          <strong className="text-content">What we pull:</strong> customer names, phone numbers, emails, last purchase date, total spend, and full purchase history. Tokens are stored encrypted.
        </p>
      </div>
    </div>
  );
}
