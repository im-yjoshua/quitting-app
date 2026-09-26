/// <reference types="jest" />

import { appendNearMiss, createNearMiss } from '../services/nearMiss';
import { routeForNotificationAction } from '../services/urgeEntry';

describe('routeForNotificationAction', () => {
  test('the Beat the Urge action opens the drill', () => {
    expect(routeForNotificationAction('beat_urge', true)).toBe('urge');
  });

  test('a normal notification tap opens home, and onboarding blocks both', () => {
    expect(routeForNotificationAction('expo.modules.notifications.actions.DEFAULT', true)).toBe('home');
    expect(routeForNotificationAction('beat_urge', false)).toBeNull();
  });
});

describe('appendNearMiss', () => {
  test('prepends and caps the list', () => {
    const first = createNearMiss('stress_cortisol', 'vagus_breath', 1);
    const second = createNearMiss('fatigue_burnout', 'pushups_15', 2);
    const stored = appendNearMiss(appendNearMiss([], first), second, 1);
    expect(stored).toHaveLength(1);
    expect(stored[0].trigger).toBe('fatigue_burnout');
    expect(stored[0].timestamp).toBe(2);
  });
});
