/**
 * Shared types and option constants for the onboarding wizard.
 * The wizard keeps everything in React state until the final "Launch" step,
 * at which point it is persisted to Supabase.
 */

export type DataSource =
  | "square"
  | "stripe"
  | "shopify"
  | "toast"
  | "hubspot"
  | "csv"
  | "manual";

/** A customer collected during onboarding, before it is saved to Supabase. */
export interface ImportedCustomer {
  name: string;
  phone: string;
  email: string;
  /** ISO date string (yyyy-mm-dd) or "". */
  last_purchase: string;
  spend_amount: number;
}

export interface WizardState {
  dataSource: DataSource | null;
  /** OAuth placeholder result for the connect step. */
  connected: boolean;
  customers: ImportedCustomer[];

  businessName: string;
  industry: string;
  voice: string;
  goals: string[];
  cadence: string;
  customInstructions: string;

  /** Message produced in the preview step (may be hand-edited). */
  previewMessage: string;
}

export const TOTAL_STEPS = 5;

export interface DataSourceOption {
  id: DataSource;
  name: string;
  description: string;
  /** Emoji icon used in the selection card. */
  icon: string;
  /** Whether this source connects via the OAuth-style placeholder. */
  oauth: boolean;
}

export const DATA_SOURCES: DataSourceOption[] = [
  {
    id: "square",
    name: "Square",
    description: "Import customers & sales from your Square account.",
    icon: "◼️",
    oauth: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Sync paying customers and their payment history.",
    icon: "💳",
    oauth: true,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Pull store customers and order totals.",
    icon: "🛍️",
    oauth: true,
  },
  {
    id: "toast",
    name: "Toast",
    description: "Bring in guests and spend from your Toast POS.",
    icon: "🍞",
    oauth: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect your CRM contacts and deal history.",
    icon: "🧲",
    oauth: true,
  },
  {
    id: "csv",
    name: "CSV Upload",
    description: "Upload a spreadsheet of your customers.",
    icon: "📄",
    oauth: false,
  },
  {
    id: "manual",
    name: "Manual Entry",
    description: "Add customers one at a time by hand.",
    icon: "✍️",
    oauth: false,
  },
];

export const INDUSTRIES = [
  "Restaurant",
  "Construction",
  "Salon",
  "Retail",
  "Fitness",
  "Healthcare",
  "Legal",
  "Real Estate",
  "Other",
];

export const VOICES = ["Friendly", "Professional", "Casual", "Witty"];

export const GOALS = [
  "Re-engagement",
  "Upsells",
  "Review requests",
  "Appointment reminders",
  "Loyalty rewards",
  "Win-back campaigns",
];

export const CADENCES = [
  "Daily",
  "Every 3 days",
  "Weekly",
  "Bi-weekly",
  "Monthly",
];

/** CSV columns the upload step expects, in order. */
export const CSV_COLUMNS = [
  "name",
  "phone",
  "email",
  "last_purchase",
  "spend_amount",
] as const;

export function emptyCustomer(): ImportedCustomer {
  return {
    name: "",
    phone: "",
    email: "",
    last_purchase: "",
    spend_amount: 0,
  };
}

export function initialWizardState(): WizardState {
  return {
    dataSource: null,
    connected: false,
    customers: [],
    businessName: "",
    industry: INDUSTRIES[0],
    voice: VOICES[0],
    goals: [],
    cadence: CADENCES[2], // Weekly
    customInstructions: "",
    previewMessage: "",
  };
}
