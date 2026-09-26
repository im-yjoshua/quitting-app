import type { AppStateData, RelapseTrigger } from '../types/app';
import { getLocalDateKey } from './chronometerEngine';
import { calculateCleanReceipt } from './cleanReceipt';

export const TRIGGER_LABEL: Record<RelapseTrigger, string> = {
  late_night_bed_scrolling: 'Late night',
  boredom_isolation: 'Boredom',
  stress_cortisol: 'Stress',
  fatigue_burnout: 'Tired',
  alcohol_substance_cross_trigger: 'A drink',
  other: 'Something else',
};

export interface WeeklyReview {
  readonly weekStartMs: number;
  readonly weekEndMs: number;
  readonly urgesFaced: number;
  readonly slips: number;
  readonly ritualsKept: number;
  readonly topTrigger: RelapseTrigger | null;
  readonly moneyKept: number;
  readonly minutesReclaimed: number;
  readonly bestDay: string | null;
  readonly worstDay: string | null;
}

export interface SlipPattern {
  readonly trigger: RelapseTrigger;
  readonly count: number;
  readonly total: number;
  readonly percent: number;
}

/** Local Monday 00:00 of the week containing nowMs. */
export function startOfLocalWeek(nowMs: number): number {
  const date = new Date(nowMs);
  const mondayOffset = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset).getTime();
}

export function shiftWeek(weekStartMs: number, weeks: number): number {
  const date = new Date(weekStartMs);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + weeks * 7).getTime();
}

function dayKeys(weekStartMs: number): string[] {
  const start = new Date(weekStartMs);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return getLocalDateKey(day.getTime());
  });
}

function inWeek(timestamp: number, weekStartMs: number, weekEndMs: number): boolean {
  return timestamp >= weekStartMs && timestamp < weekEndMs;
}

function cleanMsInWeek(state: AppStateData, weekStartMs: number, weekEndMs: number, nowMs: number): number {
  const ranges: Array<[number, number]> = [];
  for (const slip of state.relapseHistory) {
    const end = slip.timestamp;
    const start = end - Math.max(0, slip.cleanDurationMs);
    if (end > start) ranges.push([start, end]);
  }
  if (state.profile.startDate > 0 && nowMs > state.profile.startDate) {
    ranges.push([state.profile.startDate, nowMs]);
  }
  return ranges.reduce((total, [start, end]) => {
    const overlap = Math.min(end, weekEndMs) - Math.max(start, weekStartMs);
    return total + Math.max(0, overlap);
  }, 0);
}

export function buildWeeklyReview(state: AppStateData, weekStartMs: number, nowMs: number): WeeklyReview {
  const weekEndMs = shiftWeek(weekStartMs, 1);
  const keys = dayKeys(weekStartMs);
  const slips = state.relapseHistory.filter((record) => inWeek(record.timestamp, weekStartMs, weekEndMs));
  const urges = (state.nearMisses ?? []).filter((record) => inWeek(record.timestamp, weekStartMs, weekEndMs));
  const counts = new Map<RelapseTrigger, number>();
  for (const record of [...slips, ...urges]) {
    counts.set(record.trigger, (counts.get(record.trigger) ?? 0) + 1);
  }
  let topTrigger: RelapseTrigger | null = null;
  let topCount = 0;
  for (const [trigger, count] of counts) {
    if (count > topCount) {
      topTrigger = trigger;
      topCount = count;
    }
  }

  const ritualsByDay = keys.map((key) => {
    const day = state.circadianHistory[key];
    return (day?.amCompleted ? 1 : 0) + (day?.pmCompleted ? 1 : 0);
  });
  const slipsByDay = keys.map(
    (key) => slips.filter((record) => getLocalDateKey(record.timestamp) === key).length
  );
  const bestScore = Math.max(...ritualsByDay);
  const bestDay = bestScore > 0 ? keys[ritualsByDay.indexOf(bestScore)] : null;
  const worstSlip = Math.max(...slipsByDay);
  let worstDay: string | null = null;
  if (worstSlip > 0) {
    worstDay = keys[slipsByDay.indexOf(worstSlip)];
  } else if (bestScore > 0) {
    const fewest = Math.min(...ritualsByDay);
    if (fewest < bestScore) worstDay = keys[ritualsByDay.indexOf(fewest)];
  }

  const receipt = calculateCleanReceipt(
    cleanMsInWeek(state, weekStartMs, weekEndMs, nowMs),
    state.profile.weeklyCostEstimated,
    state.profile.dailyMinutesWasted
  );

  return {
    weekStartMs,
    weekEndMs,
    urgesFaced: urges.length,
    slips: slips.length,
    ritualsKept: ritualsByDay.reduce((sum, count) => sum + count, 0),
    topTrigger,
    moneyKept: receipt.moneyKept,
    minutesReclaimed: receipt.minutesReclaimed,
    bestDay,
    worstDay,
  };
}

/** All-time slip pattern. Null until there is at least one slip. */
export function slipPattern(state: AppStateData): SlipPattern | null {
  const total = state.relapseHistory.length;
  if (total === 0) return null;
  const counts = new Map<RelapseTrigger, number>();
  for (const record of state.relapseHistory) {
    counts.set(record.trigger, (counts.get(record.trigger) ?? 0) + 1);
  }
  let trigger: RelapseTrigger = 'other';
  let count = 0;
  for (const [key, value] of counts) {
    if (value > count) {
      trigger = key;
      count = value;
    }
  }
  return { trigger, count, total, percent: Math.round((count / total) * 100) };
}

export function formatWeekLabel(weekStartMs: number): string {
  const start = new Date(weekStartMs);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
