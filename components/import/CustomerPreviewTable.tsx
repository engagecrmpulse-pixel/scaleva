"use client";

import { formatCurrency } from "@/utils/helpers";
import type { ImportedCustomer } from "@/lib/import/types";

interface CustomerPreviewTableProps {
  customers: ImportedCustomer[];
  onRemove?: (index: number) => void;
  /** Max rows to render before truncating the preview. */
  limit?: number;
}

export function CustomerPreviewTable({
  customers,
  onRemove,
  limit = 50,
}: CustomerPreviewTableProps) {
  if (customers.length === 0) return null;

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
          {customers.slice(0, limit).map((customer, i) => (
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
      {customers.length > limit && (
        <p className="px-4 py-2 text-xs text-gray-400">
          Showing first {limit} of {customers.length}.
        </p>
      )}
    </div>
  );
}
