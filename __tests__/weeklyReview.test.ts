/// <reference types="jest" />

import { buildWeeklyReview, shiftWeek, slipPattern, startOfLocalWeek } from '../services/weeklyReview';
import type { AppStateData, UserProfile } from '../types/app';

const profile: UserProfile = {
  habitTitle: 'Digital Freedom',
  habitCategory: 'digital_distraction',
  startDate: 0,
  bestRecordMs: 0,
  attemptCount: 1,
  weeklyCostEstimated: 0,
  dailyMinutesWasted: 0,
  auraScore: 0,
  tierStatus: 'Initiate',
  isOnboarded: true,
  biometricsEnabled: false,
};

function stateWith(partial: Partial<AppStateData> & { profile?: Partial<UserProfile> }): AppStateData {
  return {
    profile: { ...profile, ...partial.profile },
    relapseHistory: partial.relapseHistory ?? [],
    nearMisses: partial.nearMisses ?? [],
    interventionState: { lastCompletedAt: null, cooldownUntil: null },
    circadianHistory: partial.circadianHistory ?? {},
    activeChallengeId: null,
  };
}

describe('startOfLocalWeek', () => {
  test('a Sunday belongs to the Monday six days earlier', () => {
    const sunday = new Date(2026, 8, 27, 15, 0, 0).getTime();
    expect(new Date(startOfLocalWeek(sunday)).getDate()).toBe(21);
  });
});

describe('buildWeeklyReview', () => {
  const week = new Date(2026, 8, 21).getTime();
  const now = new Date(2026, 8, 23, 12, 0, 0).getTime();

  test('counts urges, rituals, the top trigger, and money only inside the week', () => {
    const review = buildWeeklyReview(
      stateWith({
        profile: {
          startDate: week,
          weeklyCostEstimated: 70,
          dailyMinutesWasted: 70,
        },
        nearMisses: [
          { id: 'n1', timestamp: new Date(2026, 8, 22, 20).getTime(), trigger: 'stress_cortisol', drillType: 'vagus_breath' },
        ],
        circadianHistory: {
          '2026-09-21': {
            dateString: '2026-09-21',
            amCompleted: true,
            amCompletedAt: week,
            pmCompleted: true,
            pmCompletedAt: week,
            multiplierActive: true,
          },
        },
        relapseHistory: [
          {
            id: 'r1',
            timestamp: new Date(2026, 8, 24, 23).getTime(),
            cleanDurationMs: 0,
            trigger: 'late_night_bed_scrolling',
            attemptNumber: 1,
            forfeitedAura: 0,
          },
        ],
      }),
      week,
      now
    );

    expect(review.urgesFaced).toBe(1);
    expect(review.slips).toBe(1);
    expect(review.ritualsKept).toBe(2);
    expect(review.topTrigger).toBe('late_night_bed_scrolling');
    expect(review.bestDay).toBe('2026-09-21');
    expect(review.worstDay).toBe('2026-09-24');
    expect(review.moneyKept).toBe(25);
    expect(review.minutesReclaimed).toBe(175);
  });

  test('the following week does not inherit this week’s slip', () => {
    const later = buildWeeklyReview(
      stateWith({
        relapseHistory: [
          {
            id: 'r1',
            timestamp: new Date(2026, 8, 24, 23).getTime(),
            cleanDurationMs: 0,
            trigger: 'other',
            attemptNumber: 1,
            forfeitedAura: 0,
          },
        ],
      }),
      shiftWeek(week, 1),
      shiftWeek(week, 1)
    );
    expect(later.slips).toBe(0);
  });
});

describe('slipPattern', () => {
  test('reports the share of the most common slip', () => {
    const pattern = slipPattern(
      stateWith({
        relapseHistory: [
          { id: 'a', timestamp: 1, cleanDurationMs: 0, trigger: 'stress_cortisol', attemptNumber: 1, forfeitedAura: 0 },
          { id: 'b', timestamp: 2, cleanDurationMs: 0, trigger: 'stress_cortisol', attemptNumber: 2, forfeitedAura: 0 },
          { id: 'c', timestamp: 3, cleanDurationMs: 0, trigger: 'other', attemptNumber: 3, forfeitedAura: 0 },
        ],
      })
    );
    expect(pattern).toEqual({ trigger: 'stress_cortisol', count: 2, total: 3, percent: 67 });
  });
});
