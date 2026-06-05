import type { SpendHistoryEntry } from "@/utils/database.types";

/** Joins class names, dropping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Formats a number as USD currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Formats an ISO date string as a human-readable date. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Sums the amounts in a customer's spend history. */
export function totalSpend(history: SpendHistoryEntry[] | null | undefined) {
  if (!history?.length) return 0;
  return history.reduce((sum, entry) => sum + (entry.amount ?? 0), 0);
}

/** Returns the initials for a name, e.g. "Ada Lovelace" -> "AL". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Lightweight phone validation/normalization to E.164-ish format.
 * Strips formatting characters; prefixes a "+" if missing.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits) return "";
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/** True if the string looks like a plausible E.164 phone number. */
export function isValidPhone(input: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(normalizePhone(input));
}
