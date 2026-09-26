/// <reference types="jest" />

import {
  calculateCleanReceipt,
  formatMinutesReclaimed,
  formatMoneyKept,
} from '../services/cleanReceipt';

const DAY = 24 * 60 * 60 * 1000;

describe('calculateCleanReceipt', () => {
  test('a clean week at $70/week and 30 min/day', () => {
    const receipt = calculateCleanReceipt(7 * DAY, 70, 30);
    expect(receipt.moneyKept).toBe(70);
    expect(receipt.minutesReclaimed).toBe(210);
  });

  test('half a week is half the weekly cost', () => {
    expect(calculateCleanReceipt(3.5 * DAY, 70, 0).moneyKept).toBe(35);
  });

  test('empty or invalid inputs stay at zero', () => {
    expect(calculateCleanReceipt(0, 70, 30)).toEqual({ moneyKept: 0, minutesReclaimed: 0 });
    expect(calculateCleanReceipt(-DAY, Number.NaN, Number.NaN)).toEqual({
      moneyKept: 0,
      minutesReclaimed: 0,
    });
  });
});

describe('receipt formatting', () => {
  test('money under $100 keeps cents and larger amounts round', () => {
    expect(formatMoneyKept(12.5)).toBe('$12.50');
    expect(formatMoneyKept(140.2)).toBe('$140');
  });

  test('minutes become hours, then days', () => {
    expect(formatMinutesReclaimed(45)).toBe('45m');
    expect(formatMinutesReclaimed(90)).toBe('1h 30m');
    expect(formatMinutesReclaimed(48 * 60)).toBe('2d');
  });
});
