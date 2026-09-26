/// <reference types="jest" />

import { DEBRIEF_PIN_MS, cleanDebriefText, pinnedSlipDebrief } from '../services/slipDebrief';
import type { RelapseRecord } from '../types/app';

function slip(partial: Partial<RelapseRecord>): RelapseRecord {
  return {
    id: 'relapse_1',
    timestamp: 1_000,
    cleanDurationMs: 0,
    trigger: 'other',
    attemptNumber: 1,
    forfeitedAura: 0,
    ...partial,
  };
}

describe('pinnedSlipDebrief', () => {
  const now = 1_000 + 60 * 60 * 1000;

  test('pins a slip written in the last 24 hours', () => {
    const record = slip({ timestamp: now - 1000, where: 'bed', nextStep: 'phone in the kitchen' });
    expect(pinnedSlipDebrief([record], now)?.id).toBe('relapse_1');
  });

  test('drops the pin after 24 hours and when the debrief is empty', () => {
    const old = slip({ timestamp: now - DEBRIEF_PIN_MS - 1, where: 'bed', nextStep: 'leave' });
    const empty = slip({ timestamp: now - 1000 });
    expect(pinnedSlipDebrief([old], now)).toBeNull();
    expect(pinnedSlipDebrief([empty], now)).toBeNull();
  });
});

describe('cleanDebriefText', () => {
  test('collapses whitespace and caps length', () => {
    expect(cleanDebriefText('  bed   at night  ')).toBe('bed at night');
    expect(cleanDebriefText('x'.repeat(200)).length).toBe(160);
  });
});
