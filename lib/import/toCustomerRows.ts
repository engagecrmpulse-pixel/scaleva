import { normalizePhone } from "@/utils/helpers";
import { nextContactDate } from "@/lib/cadence";
import type { SpendHistoryEntry } from "@/utils/database.types";
import type { ImportedCustomer } from "./types";

export interface ToCustomerRowsOptions {
  /** When true, imported customers are scheduled forward for autopilot. */
  autopilot?: boolean;
  /** Cadence label used to compute the initial next_contact_date. */
  cadence?: string | null;
  /** Base time in ms for scheduling (defaults to Date.now()). */
  nowMs?: number;
}

/** A row ready to insert into the `customers` table. */
export interface CustomerInsertRow {
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  last_purchase: string | null;
  spend_history: SpendHistoryEntry[];
  next_contact_date: string | null;
}

/**
 * Maps in-memory ImportedCustomer records to `customers` insert rows. Phone
 * numbers are normalized with the shared helper; spend is captured as a single
 * spend_history entry; next_contact_date is scheduled forward only when
 * autopilot is enabled (so toggling autopilot later, not import, is what arms
 * outreach for manually-added customers).
 */
export function toCustomerInsertRows(
  businessId: string,
  customers: ImportedCustomer[],
  options: ToCustomerRowsOptions = {}
): CustomerInsertRow[] {
  const { autopilot = false, cadence = null, nowMs } = options;
  const baseMs = nowMs ?? Date.now();
  const scheduled = autopilot ? nextContactDate(baseMs, cadence) : null;

  return customers
    .filter((c) => c.name.trim() !== "")
    .map((c) => {
      const normalizedPhone = c.phone ? normalizePhone(c.phone) : "";
      const spend_history: SpendHistoryEntry[] =
        c.spend_amount > 0
          ? [
              {
                date: c.last_purchase || new Date(baseMs).toISOString(),
                amount: c.spend_amount,
              },
            ]
          : [];

      return {
        business_id: businessId,
        name: c.name.trim(),
        phone: normalizedPhone || null,
        email: c.email.trim() || null,
        last_purchase: c.last_purchase || null,
        spend_history,
        next_contact_date: scheduled,
      };
    });
}
