"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/utils/helpers";
import { parseCustomersCsv } from "@/lib/import/csv";
import type { ImportedCustomer } from "@/lib/import/types";

interface CsvDropzoneProps {
  onCustomers: (customers: ImportedCustomer[]) => void;
}

function downloadTemplate() {
  const csv = [
    "name,phone,email,last_purchase,spend_amount",
    "Jane Smith,+15551234567,jane@example.com,2024-05-15,85.00",
    "Carlos Mendez,+15559876543,carlos@example.com,2024-04-22,142.50",
    "Priya Nair,+15551112222,priya@example.com,2024-05-01,60.00",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scaleva-customer-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function parseExcelFile(file: File): Promise<ImportedCustomer[]> {
  const { read, utils } = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const csv: string = utils.sheet_to_csv(ws);
  return parseCustomersCsv(csv);
}

export function CsvDropzone({ onCustomers }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      let parsed: ImportedCustomer[];

      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ||
        file.type.includes("spreadsheetml") || file.type.includes("excel");

      if (isExcel) {
        parsed = await parseExcelFile(file);
      } else {
        const text = await file.text();
        parsed = parseCustomersCsv(text);
      }

      if (parsed.length === 0) {
        setError("No rows found. Make sure your file has a name column. Download the template below to see the expected format.");
        setFileName(null);
        onCustomers([]);
        return;
      }

      const hasNoPhones = parsed.every((c) => !c.phone);
      if (hasNoPhones) {
        setError("No phone numbers found — customers without phones can't receive SMS. Add a 'phone' column to your file.");
      } else {
        setError(null);
      }

      setFileName(file.name);
      onCustomers(parsed);
    } catch {
      setError("Could not read that file. Please upload a .csv or .xlsx file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Format guidance */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-content-muted">
          Columns:{" "}
          <code className="rounded border border-line bg-surface px-1 font-mono text-[11px]">
            name, phone, email, last_purchase, spend_amount
          </code>
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-accent bg-accent/5" : "border-line bg-base hover:border-content-muted"
        )}
      >
        {loading ? (
          <>
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-content-muted/30 border-t-content-muted" />
            <p className="mt-3 text-sm text-content-muted">Reading file…</p>
          </>
        ) : (
          <>
            <svg className="h-8 w-8 text-content-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-3 text-sm text-content-muted">
              Drag & drop your file here, or
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            <p className="mt-2 text-xs text-content-muted/60">
              Supports .csv and .xlsx (Excel)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {fileName && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-content-muted">
                <svg className="h-3.5 w-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {fileName}
              </p>
            )}
          </>
        )}
      </div>

      {/* Compatibility tips */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { name: "Excel", tip: "File → Save As → CSV" },
          { name: "Google Sheets", tip: "File → Download → CSV" },
          { name: "Any software", tip: "Look for Export → CSV" },
        ].map((item) => (
          <div key={item.name} className="rounded-btn border border-line bg-base px-3 py-2 text-center">
            <p className="text-[10px] font-semibold text-content">{item.name}</p>
            <p className="mt-0.5 text-[10px] text-content-muted">{item.tip}</p>
          </div>
        ))}
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
