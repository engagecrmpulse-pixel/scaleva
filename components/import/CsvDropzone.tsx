"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/utils/helpers";
import { parseCustomersCsv } from "@/lib/import/csv";
import type { ImportedCustomer } from "@/lib/import/types";

interface CsvDropzoneProps {
  onCustomers: (customers: ImportedCustomer[]) => void;
}

export function CsvDropzone({ onCustomers }: CsvDropzoneProps) {
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
        setError("No rows found. Expected columns: name, phone, email, last_purchase, spend_amount.");
        setFileName(null);
        onCustomers([]);
        return;
      }
      const hasNoPhones = parsed.every((c) => !c.phone);
      if (hasNoPhones) {
        setError("No phone column found — customers without phone numbers cannot receive SMS. Check your CSV has a 'phone' column.");
      }
      setFileName(file.name);
      onCustomers(parsed);
    } catch {
      setError("Could not read that file. Please upload a .csv file.");
    }
  }

  return (
    <div>
      <p className="text-xs text-content-muted">
        Columns: <code className="rounded border border-line bg-surface px-1 font-mono text-[11px]">name, phone, email, last_purchase, spend_amount</code>.
        Header row is optional.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); }}
        className={cn(
          "mt-4 flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-line bg-base hover:border-content-muted"
        )}
      >
        <svg className="h-8 w-8 text-content-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="mt-3 text-sm text-content-muted">Drag &amp; drop your CSV here, or</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <input
          ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
        />
        {fileName && <p className="mt-3 text-xs text-content-muted">Loaded: {fileName}</p>}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-yellow-400">
          <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
