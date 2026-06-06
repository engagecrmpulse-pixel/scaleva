"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { cn, formatCurrency } from "@/utils/helpers";
import {
  DATA_SOURCES,
  emptyCustomer,
  type ImportedCustomer,
} from "../types";
import { parseCustomersCsv } from "../csv";
import type { StepProps } from "../Wizard";

export function StepConnect({ state, update }: StepProps) {
  const source = DATA_SOURCES.find((s) => s.id === state.dataSource);

  if (!source) {
    return (
      <p className="text-sm text-gray-500">
        Go back and choose a data source first.
      </p>
    );
  }

  if (source.oauth) {
    return <OAuthConnect state={state} update={update} />;
  }

  if (source.id === "csv") {
    return <CsvImport state={state} update={update} />;
  }

  return <ManualEntry state={state} update={update} />;
}

/* ------------------------------------------------------------------ */
/* OAuth placeholder                                                   */
/* ------------------------------------------------------------------ */
function OAuthConnect({ state, update }: StepProps) {
  const source = DATA_SOURCES.find((s) => s.id === state.dataSource)!;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Connect {source.name}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Authorize Scaleva to import your customers from {source.name}.
      </p>

      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
        <span className="text-4xl" aria-hidden>
          {source.icon}
        </span>
        {state.connected ? (
          <>
            <Badge tone="green" className="mt-4">
              Connected
            </Badge>
            <p className="mt-3 max-w-sm text-sm text-gray-500">
              {source.name} is connected. In production we&apos;d sync your
              customers here — for now you can continue.
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
            <p className="mt-3 max-w-sm text-sm text-gray-500">
              This is a placeholder OAuth connection. Clicking connect will mark
              {" "}
              {source.name} as linked.
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

/* ------------------------------------------------------------------ */
/* CSV import                                                          */
/* ------------------------------------------------------------------ */
function CsvImport({ state, update }: StepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseCustomersCsv(text);
      if (parsed.length === 0) {
        setError(
          "No rows found. Expected columns: name, phone, email, last_purchase, spend_amount."
        );
        update({ customers: [] });
        setFileName(null);
        return;
      }
      setFileName(file.name);
      update({ customers: parsed });
    } catch {
      setError("Could not read that file. Please upload a .csv file.");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Upload a CSV</h2>
      <p className="mt-1 text-sm text-gray-500">
        Columns: <code>name, phone, email, last_purchase, spend_amount</code>.
        A header row is optional.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-brand-600 bg-brand-50"
            : "border-gray-300 bg-gray-50"
        )}
      >
        <span className="text-3xl" aria-hidden>
          📄
        </span>
        <p className="mt-3 text-sm text-gray-600">
          Drag &amp; drop your CSV here, or
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName && (
          <p className="mt-3 text-xs text-gray-500">Loaded {fileName}</p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {state.customers.length > 0 && (
        <CustomerPreviewTable customers={state.customers} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Manual entry                                                        */
/* ------------------------------------------------------------------ */
function ManualEntry({ state, update }: StepProps) {
  const [draft, setDraft] = useState<ImportedCustomer>(emptyCustomer);
  const [error, setError] = useState<string | null>(null);

  function addCustomer() {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    update({ customers: [...state.customers, draft] });
    setDraft(emptyCustomer());
  }

  function removeCustomer(index: number) {
    update({ customers: state.customers.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Add customers</h2>
      <p className="mt-1 text-sm text-gray-500">
        Enter your customers one at a time. Add as many as you like.
      </p>

      <div className="mt-6 grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
        <Input
          label="Name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <Input
          label="Phone"
          value={draft.phone}
          placeholder="+15551234567"
          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        />
        <Input
          label="Last purchase date"
          type="date"
          value={draft.last_purchase}
          onChange={(e) =>
            setDraft({ ...draft, last_purchase: e.target.value })
          }
        />
        <Input
          label="Spend amount ($)"
          type="number"
          min={0}
          step="0.01"
          value={draft.spend_amount ? String(draft.spend_amount) : ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              spend_amount: Number.parseFloat(e.target.value) || 0,
            })
          }
        />
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={addCustomer}>
            Add more
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {state.customers.length > 0 && (
        <CustomerPreviewTable
          customers={state.customers}
          onRemove={removeCustomer}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared preview table                                                */
/* ------------------------------------------------------------------ */
function CustomerPreviewTable({
  customers,
  onRemove,
}: {
  customers: ImportedCustomer[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">
          {customers.length} customer{customers.length === 1 ? "" : "s"}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Phone</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Last purchase</th>
            <th className="px-4 py-2 font-medium">Spend</th>
            {onRemove && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {customers.slice(0, 50).map((customer, i) => (
            <tr
              key={`${customer.name}-${i}`}
              className="border-b border-gray-50 last:border-0"
            >
              <td className="px-4 py-2 font-medium text-gray-900">
                {customer.name}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {customer.phone || "—"}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {customer.email || "—"}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {customer.last_purchase || "—"}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {formatCurrency(customer.spend_amount || 0)}
              </td>
              {onRemove && (
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length > 50 && (
        <p className="px-4 py-2 text-xs text-gray-400">
          Showing first 50 of {customers.length}.
        </p>
      )}
    </div>
  );
}
