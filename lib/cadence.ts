/**
 * Maps the wizard's cadence labels to concrete intervals and computes the next
 * contact date. Shared by the import mapper, the autopilot enable flow, and the
 * cron scheduler so the cadence math stays in one place.
 */

const CADENCE_DAYS: Record<string, number> = {
  Daily: 1,
  "Every 3 days": 3,
  Weekly: 7,
  "Bi-weekly": 14,
  Monthly: 30,
};

const DEFAULT_DAYS = 7;

/** Number of days between contacts for a cadence label (defaults to weekly). */
export function cadenceToDays(cadence: string | null | undefined): number {
  if (!cadence) return DEFAULT_DAYS;
  return CADENCE_DAYS[cadence] ?? DEFAULT_DAYS;
}

/**
 * Returns the ISO timestamp `cadence` days after `from`.
 * @param from base time in milliseconds (e.g. Date.now())
 */
export function nextContactDate(
  fromMs: number,
  cadence: string | null | undefined
): string {
  const days = cadenceToDays(cadence);
  return new Date(fromMs + days * 24 * 60 * 60 * 1000).toISOString();
}
