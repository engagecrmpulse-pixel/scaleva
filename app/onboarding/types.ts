/**
 * Shared types and option constants for the onboarding wizard.
 * The wizard keeps everything in React state until the final "Launch" step,
 * at which point it is persisted to Supabase.
 *
 * Customer-import primitives now live in lib/import so the dashboard can reuse
 * them; they are re-exported here for the wizard's existing import sites.
 */
export {
  type ImportedCustomer,
  emptyCustomer,
  CSV_COLUMNS,
} from "@/lib/import/types";
import type { ImportedCustomer } from "@/lib/import/types";

export type DataSource =
  | "square"
  | "stripe"
  | "shopify"
  | "toast"
  | "hubspot"
  | "csv"
  | "manual";

export interface MenuItemDraft {
  name: string;
  category: string;
  price: string;
  description: string;
}

export interface FaqDraft {
  question: string;
  answer: string;
}

export interface HoursDraft {
  open: string;
  close: string;
  closed: boolean;
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

  // Business profile — industry-specific deep-dive (step 4)
  menuItems: MenuItemDraft[];
  businessHours: Record<string, HoursDraft>;
  businessPhone: string;
  businessAddress: string;
  specialOffer: string;
  bookingLink: string;
  loyaltyProgram: string;
  faq: FaqDraft[];

  /** Message produced in the preview step (may be hand-edited). */
  previewMessage: string;
}

export const TOTAL_STEPS = 6;

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

const DEFAULT_HOURS: Record<string, HoursDraft> = {
  Monday: { open: "9:00 AM", close: "5:00 PM", closed: false },
  Tuesday: { open: "9:00 AM", close: "5:00 PM", closed: false },
  Wednesday: { open: "9:00 AM", close: "5:00 PM", closed: false },
  Thursday: { open: "9:00 AM", close: "5:00 PM", closed: false },
  Friday: { open: "9:00 AM", close: "5:00 PM", closed: false },
  Saturday: { open: "10:00 AM", close: "3:00 PM", closed: false },
  Sunday: { open: "", close: "", closed: true },
};

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
    menuItems: [],
    businessHours: DEFAULT_HOURS,
    businessPhone: "",
    businessAddress: "",
    specialOffer: "",
    bookingLink: "",
    loyaltyProgram: "",
    faq: [{ question: "", answer: "" }],
    previewMessage: "",
  };
}
