/// <reference types="jest" />

import {
  MAX_WORKOUTS_PER_DAY,
  MIN_WORKOUT_MINUTES,
  challengeAlreadyClaimedToday,
  circadianWindowAllows,
  workoutLogAllowed,
} from '../services/rewardRules';

function local(year: number, monthIndex: number, day: number, hour: number): number {
  return new Date(year, monthIndex, day, hour, 0, 0, 0).getTime();
}

const morning = local(2026, 5, 15, 9);
const afternoon = local(2026, 5, 15, 15);

describe('challenge aura claims', () => {
  test('second claim the same local day is rejected', () => {
    const claims = { parasympathetic_4_7_8: '2026-06-15' };
    expect(challengeAlreadyClaimedToday(claims, 'parasympathetic_4_7_8', morning)).toBe(true);
  });

  test('a different challenge or the next day is allowed', () => {
    const claims = { parasympathetic_4_7_8: '2026-06-15' };
    expect(challengeAlreadyClaimedToday(claims, 'other', morning)).toBe(false);
    expect(
      challengeAlreadyClaimedToday(claims, 'parasympathetic_4_7_8', local(2026, 5, 16, 9))
    ).toBe(false);
  });
});

describe('circadian windows', () => {
  test('AM ritual after noon is rejected and PM before noon is rejected', () => {
    expect(circadianWindowAllows('am', afternoon)).toBe(false);
    expect(circadianWindowAllows('pm', morning)).toBe(false);
  });

  test('AM before noon and PM after noon are allowed', () => {
    expect(circadianWindowAllows('am', morning)).toBe(true);
    expect(circadianWindowAllows('pm', afternoon)).toBe(true);
  });
});

describe('workout logs', () => {
  test('under the minimum duration is rejected', () => {
    expect(
      workoutLogAllowed({
        type: 'Strength',
        durationMinutes: MIN_WORKOUT_MINUTES - 1,
        lastWorkoutDate: '',
        workoutsLoggedToday: 0,
        nowMs: morning,
      })
    ).toBe(false);
  });

  test('a third workout the same day is rejected', () => {
    expect(
      workoutLogAllowed({
        type: 'Cardio',
        durationMinutes: 30,
        lastWorkoutDate: '2026-06-15',
        workoutsLoggedToday: MAX_WORKOUTS_PER_DAY,
        nowMs: morning,
      })
    ).toBe(false);
  });

  test('a long enough first workout is allowed', () => {
    expect(
      workoutLogAllowed({
        type: 'Strength',
        durationMinutes: MIN_WORKOUT_MINUTES,
        lastWorkoutDate: '2026-06-14',
        workoutsLoggedToday: MAX_WORKOUTS_PER_DAY,
        nowMs: morning,
      })
    ).toBe(true);
  });
});
