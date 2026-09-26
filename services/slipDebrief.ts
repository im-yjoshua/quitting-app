import type { RelapseRecord } from '../types/app';

export const DEBRIEF_PIN_MS = 24 * 60 * 60 * 1000;
const MAX_LEN = 160;

export interface SlipDebrief {
  readonly where: string;
  readonly nextStep: string;
}

export function cleanDebriefText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

export function formatDebriefNotes(debrief: SlipDebrief): string | undefined {
  const lines: string[] = [];
  if (debrief.where) lines.push(`Where: ${debrief.where}`);
  if (debrief.nextStep) lines.push(`Next: ${debrief.nextStep}`);
  return lines.length > 0 ? lines.join('\n') : undefined;
}

/** Newest slip stays pinned for 24 hours, and only if the user wrote something. */
export function pinnedSlipDebrief(
  relapseHistory: readonly RelapseRecord[],
  nowMs: number
): RelapseRecord | null {
  const latest = relapseHistory[0];
  if (!latest) return null;
  const age = nowMs - latest.timestamp;
  // Allow a minute of clock skew so a just-saved slip still pins.
  if (age < -60_000 || age > DEBRIEF_PIN_MS) return null;
  if (!latest.where && !latest.nextStep) return null;
  return latest;
}
