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

export type DataSource = "csv" | "square" | "manual";

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
  icon: string;
  oauth: boolean;
  /** If true, the integration is live. If false, shows "Coming soon". */
  live: boolean;
  /** What data gets pulled in. */
  pulls?: string;
}

export interface DataSourceGroup {
  label: string;
  sources: DataSourceOption[];
}

export const DATA_SOURCES: DataSourceOption[] = [
  {
    id: "csv",
    name: "Spreadsheet / CSV",
    description: "Upload an Excel or CSV export from your POS or reservation system.",
    icon: "📊",
    oauth: false,
    live: true,
    pulls: "Name, phone, email, last visit date, spend amount.",
  },
  {
    id: "square",
    name: "Square",
    description: "Import guests and full order history from your Square for Restaurants account.",
    icon: "◼️",
    oauth: true,
    live: true,
    pulls: "Guest names, phones, emails, order history, and spend totals.",
  },
  {
    id: "manual",
    name: "Add manually",
    description: "Enter guests one at a time. Good for a small starting list.",
    icon: "✍️",
    oauth: false,
    live: true,
    pulls: "Whatever you enter by hand.",
  },
];

export const DATA_SOURCE_GROUPS: DataSourceGroup[] = [
  {
    label: "Connect your POS",
    sources: DATA_SOURCES.filter((s) => s.id === "square"),
  },
];

export const INDUSTRIES = ["Restaurant"];

export const VOICES = ["Friendly", "Professional", "Casual", "Witty"];

export const GOALS = [
  "Drive repeat visits",
  "Increase average check",
  "Fill slow nights",
  "Win back lapsed guests",
  "Get 5-star reviews",
  "Promote specials & events",
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
