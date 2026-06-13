"use client";

import { cn } from "@/utils/helpers";
import { DATA_SOURCE_GROUPS, DATA_SOURCES, type DataSource, type DataSourceOption } from "../types";
import type { StepProps } from "../Wizard";

function downloadCsvTemplate() {
  const header = "name,phone,email,last_purchase,spend_amount";
  const examples = [
    "Jane Smith,+15551234567,jane@example.com,2024-05-15,85.00",
    "Carlos Mendez,+15559876543,carlos@example.com,2024-04-22,142.50",
    "Priya Nair,+15551112222,priya@example.com,2024-05-01,60.00",
  ].join("\n");
  const csv = `${header}\n${examples}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scaleva-customer-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function IntegrationCard({
  source,
  selected,
  onSelect,
}: {
  source: DataSourceOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const comingSoon = !source.live;

  return (
    <button
      type="button"
      onClick={comingSoon ? undefined : onSelect}
      disabled={comingSoon}
      className={cn(
        "relative flex flex-col items-start rounded-card border p-3 text-left transition-all focus:outline-none",
        comingSoon
          ? "cursor-default border-line bg-base opacity-60"
          : selected
          ? "border-accent bg-accent/5 ring-1 ring-accent/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
          : "border-line bg-base hover:border-content-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
      )}
      aria-pressed={selected}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
          <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}
      {comingSoon && (
        <div className="absolute right-2 top-2 rounded-full bg-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-content-muted">
          Soon
        </div>
      )}
      <span className="text-lg leading-none">{source.icon}</span>
      <span className="mt-2 text-xs font-semibold text-content">{source.name}</span>
      {selected && source.pulls && (
        <span className="mt-1 text-[10px] leading-relaxed text-accent/70">
          Imports: {source.pulls}
        </span>
      )}
    </button>
  );
}

export function StepDataSource({ state, update }: StepProps) {
  const csvSource = DATA_SOURCES.find((s) => s.id === "csv")!;
  const manualSource = DATA_SOURCES.find((s) => s.id === "manual")!;
  const selected = state.dataSource;

  function select(id: DataSource) {
    update({ dataSource: id, connected: false, customers: [] });
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Connect your guest data
      </h2>
      <p className="mt-1.5 text-sm text-content-muted">
        Connect Square or Clover to import your guest history automatically, or upload a CSV export.
      </p>

      {/* ── Spreadsheet — most popular ──────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-content-muted">
            Most popular
          </p>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
            Works with Excel, Google Sheets & any CSV
          </span>
        </div>
        <button
          type="button"
          onClick={() => select("csv")}
          className={cn(
            "group flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base",
            selected === "csv"
              ? "border-accent bg-accent/5 ring-1 ring-accent/30"
              : "border-line bg-base hover:border-content-muted"
          )}
          aria-pressed={selected === "csv"}
        >
          <div
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-btn text-xl transition-colors",
              selected === "csv" ? "bg-accent text-white" : "bg-surface text-content-muted group-hover:text-content"
            )}
          >
            📊
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-content">Import a Spreadsheet</p>
              {selected === "csv" && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
            </div>
            <p className="mt-0.5 text-xs text-content-muted">
              Upload a .csv or .xlsx file — export from Excel, Google Sheets, or any software that supports spreadsheet exports.
            </p>
            {selected === "csv" && (
              <p className="mt-1 text-xs text-accent/80">
                Imports: name, phone, email, last purchase date, spend amount.
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); downloadCsvTemplate(); }}
              className="hidden items-center gap-1 rounded-btn border border-line px-2.5 py-1.5 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content group-hover:flex"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Template
            </button>
          </div>
        </button>

        {selected === "csv" && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download template
            </button>
            <span className="text-content-muted/40">·</span>
            <span className="text-xs text-content-muted">Accepts .csv and .xlsx</span>
          </div>
        )}
      </div>

      {/* ── POS integrations ─────────────────────────────────────────────── */}
      <div className="mt-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-content-muted">
          Or connect your POS
        </p>

        {DATA_SOURCE_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="grid grid-cols-2 gap-3">
              {group.sources.map((source) => (
                <IntegrationCard
                  key={source.id}
                  source={source}
                  selected={selected === source.id}
                  onSelect={() => select(source.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Manual entry ─────────────────────────────────────────────────── */}
      <div className="mt-5 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => select("manual")}
          className={cn(
            "flex w-full items-center gap-3 rounded-btn border px-4 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            selected === "manual"
              ? "border-accent bg-accent/5"
              : "border-line bg-base hover:border-content-muted"
          )}
        >
          <span className="text-base">✍️</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-content">Add customers manually</p>
            <p className="text-[11px] text-content-muted">Enter one at a time — good for a small starting list.</p>
          </div>
          {selected === "manual" && (
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent">
              <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
