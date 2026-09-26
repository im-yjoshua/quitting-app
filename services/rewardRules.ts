import { getLocalDateKey } from './chronometerEngine';

export const MIN_WORKOUT_MINUTES = 10;
export const MAX_WORKOUTS_PER_DAY = 2;

export function challengeAlreadyClaimedToday(
  claims: Record<string, string> | undefined,
  challengeId: string,
  nowMs: number
): boolean {
  return (claims ?? {})[challengeId] === getLocalDateKey(nowMs);
}

/** AM is local midnight–noon. PM is local noon–midnight. */
export function circadianWindowAllows(type: 'am' | 'pm', nowMs: number): boolean {
  const hour = new Date(nowMs).getHours();
  return type === 'am' ? hour < 12 : hour >= 12;
}

export function workoutsLoggedOn(
  lastWorkoutDate: string,
  workoutsLoggedToday: number,
  nowMs: number
): number {
  return lastWorkoutDate === getLocalDateKey(nowMs) ? workoutsLoggedToday : 0;
}

export function workoutLogAllowed(input: {
  type: string;
  durationMinutes: number;
  lastWorkoutDate: string;
  workoutsLoggedToday: number;
  nowMs: number;
}): boolean {
  if (!input.type || !Number.isFinite(input.durationMinutes)) return false;
  if (input.durationMinutes < MIN_WORKOUT_MINUTES) return false;
  return (
    workoutsLoggedOn(input.lastWorkoutDate, input.workoutsLoggedToday, input.nowMs) <
    MAX_WORKOUTS_PER_DAY
  );
}
