/**
 * Neutral types for customer import, shared by the onboarding wizard and the
 * dashboard import panel. Kept outside app/onboarding so both client trees can
 * import without creating a dependency on the wizard.
 */

/** A customer collected during import, before it is saved to Supabase. */
export interface ImportedCustomer {
  name: string;
  phone: string;
  email: string;
  /** ISO date string (yyyy-mm-dd) or "". */
  last_purchase: string;
  spend_amount: number;
}

export function emptyCustomer(): ImportedCustomer {
  return {
    name: "",
    phone: "",
    email: "",
    last_purchase: "",
    spend_amount: 0,
  };
}

/** CSV columns the upload flow expects, in order. */
export const CSV_COLUMNS = [
  "name",
  "phone",
  "email",
  "last_purchase",
  "spend_amount",
] as const;
