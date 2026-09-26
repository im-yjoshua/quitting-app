/** Notification action id. Default taps on the daily check-in do not use this. */
export const BEAT_URGE_ACTION = 'beat_urge';

export const URGE_HREF = '/?modal=urge';

/**
 * Where a notification response should go.
 * Only the Beat the Urge action opens the drill. A normal tap still opens home.
 * Returns null when the user has not finished onboarding.
 */
export function routeForNotificationAction(
  actionIdentifier: string | undefined,
  onboarded: boolean
): 'home' | 'urge' | null {
  if (!onboarded) return null;
  return actionIdentifier === BEAT_URGE_ACTION ? 'urge' : 'home';
}
