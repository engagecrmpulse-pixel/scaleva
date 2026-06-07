"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { emptyCustomer, type ImportedCustomer } from "@/lib/import/types";
import { CustomerPreviewTable } from "./CustomerPreviewTable";

interface ManualEntryFormProps {
  /** The current list of customers (owned by the parent). */
  customers: ImportedCustomer[];
  onChange: (customers: ImportedCustomer[]) => void;
}

export function ManualEntryForm({ customers, onChange }: ManualEntryFormProps) {
  const [draft, setDraft] = useState<ImportedCustomer>(emptyCustomer);
  const [error, setError] = useState<string | null>(null);

  function addCustomer() {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    onChange([...customers, draft]);
    setDraft(emptyCustomer());
  }

  function removeCustomer(index: number) {
    onChange(customers.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
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
          onChange={(e) => setDraft({ ...draft, last_purchase: e.target.value })}
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

      <CustomerPreviewTable customers={customers} onRemove={removeCustomer} />
    </div>
  );
}
