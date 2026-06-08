"use client";

import { Badge } from "@/components/Badge";
import { CsvDropzone } from "@/components/import/CsvDropzone";
import { ManualEntryForm } from "@/components/import/ManualEntryForm";
import { DATA_SOURCES } from "../types";
import type { StepProps } from "../Wizard";
import type { ImportedCustomer } from "@/lib/import/types";
import { formatDate } from "@/utils/helpers";

function CsvPreviewTable({ customers }: { customers: ImportedCustomer[] }) {
  if (customers.length === 0) return null;
  const noPhones = customers.every((c) => !c.phone);

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-content">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} found
        </span>
        {noPhones && (
          <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            No phone numbers found — these customers cannot receive SMS
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-card border border-line">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line bg-base text-left text-content-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Last purchase</th>
            </tr>
          </thead>
          <tbody>
            {customers.slice(0, 8).map((c, i) => (
              <tr
                key={i}
                className={`border-b border-line last:border-0 ${i % 2 === 0 ? "bg-surface" : "bg-base"}`}
              >
                <td className="px-4 py-2 font-medium text-content">{c.name || "—"}</td>
                <td className="px-4 py-2 text-content-muted">
                  {c.phone ? (
                    <span className="text-content">{c.phone}</span>
                  ) : (
                    <span className="text-danger/60">missing</span>
                  )}
                </td>
                <td className="px-4 py-2 text-content-muted">{c.email || "—"}</td>
                <td className="px-4 py-2 text-content-muted">{formatDate(c.last_purchase || null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length > 8 && (
          <p className="border-t border-line px-4 py-2 text-xs text-content-muted">
            +{customers.length - 8} more rows
          </p>
        )}
      </div>
    </div>
  );
}

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
          We&apos;ll preview your customers before anything is saved.
        </p>
        <div className="mt-6">
          <CsvDropzone onCustomers={(customers) => update({ customers })} />
          <CsvPreviewTable customers={state.customers} />
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-7 w-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
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
