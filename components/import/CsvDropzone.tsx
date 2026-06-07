"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/utils/helpers";
import { parseCustomersCsv } from "@/lib/import/csv";
import type { ImportedCustomer } from "@/lib/import/types";

interface CsvDropzoneProps {
  /** Called with the parsed customers (empty array clears the selection). */
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
        setError(
          "No rows found. Expected columns: name, phone, email, last_purchase, spend_amount."
        );
        setFileName(null);
        onCustomers([]);
        return;
      }
      setFileName(file.name);
      onCustomers(parsed);
    } catch {
      setError("Could not read that file. Please upload a .csv file.");
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500">
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
          "mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-brand-600 bg-brand-50" : "border-gray-300 bg-gray-50"
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
    </div>
  );
}
