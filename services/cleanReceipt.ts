const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export interface CleanReceipt {
  /** Estimated money not spent during this clean run. */
  readonly moneyKept: number;
  /** Estimated minutes given back during this clean run. */
  readonly minutesReclaimed: number;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Money and time kept, from the onboarding estimates.
 * Money scales by week. Minutes scale by day. Both are zero when the run is empty.
 */
export function calculateCleanReceipt(
  cleanDurationMs: number,
  weeklyCostEstimated: number,
  dailyMinutesWasted: number
): CleanReceipt {
  const safeMs = nonNegative(cleanDurationMs);
  const weeks = safeMs / MS_PER_WEEK;
  const days = safeMs / MS_PER_DAY;
  return {
    moneyKept: Math.round(weeks * nonNegative(weeklyCostEstimated) * 100) / 100,
    minutesReclaimed: Math.round(days * nonNegative(dailyMinutesWasted)),
  };
}

export function formatMoneyKept(amount: number): string {
  const safe = nonNegative(amount);
  if (safe >= 100) return `$${Math.round(safe)}`;
  return `$${safe.toFixed(2)}`;
}

export function formatMinutesReclaimed(minutes: number): string {
  const safe = Math.round(nonNegative(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const rem = safe % 60;
  if (hours < 48) return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;
  return leftoverHours === 0 ? `${days}d` : `${days}d ${leftoverHours}h`;
}
