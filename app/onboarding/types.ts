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
  // Spreadsheet
  | "csv"
  // POS Systems
  | "square"
  | "clover"
  | "toast"
  | "lightspeed"
  | "revel"
  // Booking & Scheduling
  | "mindbody"
  | "vagaro"
  | "fresha"
  | "acuity"
  // E-Commerce
  | "shopify"
  | "woocommerce"
  | "bigcommerce"
  // CRM & Sales
  | "hubspot"
  | "stripe"
  | "salesforce"
  | "pipedrive"
  // Field Service
  | "jobber"
  | "housecall"
  | "servicetitan"
  // Manual
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
  // ── Spreadsheet ───────────────────────────────────────────────────────────
  {
    id: "csv",
    name: "Spreadsheet / CSV",
    description: "Upload an Excel or CSV file. Works with any system that can export a spreadsheet.",
    icon: "📊",
    oauth: false,
    live: true,
    pulls: "Name, phone, email, last purchase date, spend amount.",
  },
  // ── POS Systems ───────────────────────────────────────────────────────────
  {
    id: "square",
    name: "Square",
    description: "Import customers & full order history from your Square account.",
    icon: "◼️",
    oauth: true,
    live: true,
    pulls: "Names, phones, emails, order history, and spend totals.",
  },
  {
    id: "clover",
    name: "Clover",
    description: "Sync customers and purchase history from your Clover POS.",
    icon: "🍀",
    oauth: true,
    live: true,
    pulls: "Customer profiles, phone numbers, emails, and order history.",
  },
  {
    id: "toast",
    name: "Toast",
    description: "Import guests and visit frequency from your Toast POS.",
    icon: "🍞",
    oauth: true,
    live: false,
    pulls: "Guest names, contact info, visit frequency, and spend.",
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    description: "Pull customers and sales data from Lightspeed Restaurant or Retail.",
    icon: "⚡",
    oauth: true,
    live: false,
    pulls: "Customer profiles, purchase history, and lifetime value.",
  },
  {
    id: "revel",
    name: "Revel Systems",
    description: "Import customers and orders from your Revel iPad POS.",
    icon: "📱",
    oauth: true,
    live: false,
    pulls: "Customer data, transaction history, and loyalty points.",
  },
  // ── Booking & Scheduling ──────────────────────────────────────────────────
  {
    id: "mindbody",
    name: "Mindbody",
    description: "Sync clients and visit history from your Mindbody account.",
    icon: "🧘",
    oauth: true,
    live: false,
    pulls: "Client profiles, class history, membership status, and spend.",
  },
  {
    id: "vagaro",
    name: "Vagaro",
    description: "Import clients and appointment history from Vagaro.",
    icon: "💅",
    oauth: true,
    live: false,
    pulls: "Client names, contacts, appointment history, and service spend.",
  },
  {
    id: "fresha",
    name: "Fresha",
    description: "Pull clients and booking history from your Fresha account.",
    icon: "🌿",
    oauth: true,
    live: false,
    pulls: "Client profiles, booking history, and spend data.",
  },
  {
    id: "acuity",
    name: "Acuity Scheduling",
    description: "Sync clients and appointment history from Acuity.",
    icon: "📅",
    oauth: true,
    live: false,
    pulls: "Client names, emails, phone numbers, and appointment history.",
  },
  // ── E-Commerce ────────────────────────────────────────────────────────────
  {
    id: "shopify",
    name: "Shopify",
    description: "Pull store customers, orders, and lifetime value from Shopify.",
    icon: "🛍️",
    oauth: true,
    live: false,
    pulls: "Customer profiles, full order history, and total spend.",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Import customers and orders from your WooCommerce store.",
    icon: "🛒",
    oauth: true,
    live: false,
    pulls: "Customer accounts, order history, and total spend.",
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    description: "Sync customers and purchase data from BigCommerce.",
    icon: "📦",
    oauth: true,
    live: false,
    pulls: "Customer profiles, purchase history, and order totals.",
  },
  // ── CRM & Payments ────────────────────────────────────────────────────────
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect your CRM contacts, companies, and deal history.",
    icon: "🧲",
    oauth: true,
    live: true,
    pulls: "Contacts, deal history, lifecycle stage, and total revenue.",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Import paying customers and their full payment history.",
    icon: "💳",
    oauth: true,
    live: true,
    pulls: "Customer records, successful payments, and lifetime value.",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Import contacts and opportunities from your Salesforce CRM.",
    icon: "☁️",
    oauth: true,
    live: false,
    pulls: "Contacts, accounts, opportunity history, and revenue data.",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "Sync contacts and deal history from Pipedrive.",
    icon: "🔩",
    oauth: true,
    live: false,
    pulls: "Contacts, deal stage, and closed deal values.",
  },
  // ── Field Service ─────────────────────────────────────────────────────────
  {
    id: "jobber",
    name: "Jobber",
    description: "Import clients and job history from your Jobber account.",
    icon: "🔧",
    oauth: true,
    live: false,
    pulls: "Client profiles, job history, invoice totals, and visit dates.",
  },
  {
    id: "housecall",
    name: "Housecall Pro",
    description: "Sync customers and service history from Housecall Pro.",
    icon: "🏠",
    oauth: true,
    live: false,
    pulls: "Customer contacts, job history, and total billed.",
  },
  {
    id: "servicetitan",
    name: "ServiceTitan",
    description: "Pull customer records and job history from ServiceTitan.",
    icon: "⚙️",
    oauth: true,
    live: false,
    pulls: "Customer profiles, service history, and revenue data.",
  },
  // ── Manual ────────────────────────────────────────────────────────────────
  {
    id: "manual",
    name: "Add manually",
    description: "Enter customers one at a time. Good for a small starting list.",
    icon: "✍️",
    oauth: false,
    live: true,
    pulls: "Whatever you enter by hand.",
  },
];

export const DATA_SOURCE_GROUPS: DataSourceGroup[] = [
  {
    label: "POS Systems",
    sources: DATA_SOURCES.filter((s) => ["square", "clover", "toast", "lightspeed", "revel"].includes(s.id)),
  },
  {
    label: "Booking & Scheduling",
    sources: DATA_SOURCES.filter((s) => ["mindbody", "vagaro", "fresha", "acuity"].includes(s.id)),
  },
  {
    label: "E-Commerce",
    sources: DATA_SOURCES.filter((s) => ["shopify", "woocommerce", "bigcommerce"].includes(s.id)),
  },
  {
    label: "CRM & Payments",
    sources: DATA_SOURCES.filter((s) => ["hubspot", "stripe", "salesforce", "pipedrive"].includes(s.id)),
  },
  {
    label: "Field Service",
    sources: DATA_SOURCES.filter((s) => ["jobber", "housecall", "servicetitan"].includes(s.id)),
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
