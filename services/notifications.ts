import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BEAT_URGE_ACTION } from './urgeEntry';

// Configure on-device notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const DAILY_ENCOURAGEMENT_IDENTIFIER = 'sovereign_daily_encouragement_v2';
const LEGACY_DAILY_ENCOURAGEMENT_IDENTIFIER = 'sovereign_daily_encouragement';

export async function ensureUrgeNotificationCategory(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(BEAT_URGE_ACTION, [
      {
        identifier: BEAT_URGE_ACTION,
        buttonTitle: 'Beat the urge',
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (error) {
    console.warn('Failed to register the urge notification action:', error);
  }
}

/**
 * Request local push notification permissions securely on-device.
 * Zero external servers or tracking tokens are generated.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Sovereign Check-ins',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0A84FF',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Returns true when a notification with the given identifier is already scheduled.
 * Used to make every scheduler idempotent: we schedule what's missing instead of
 * cancelling everything and re-scheduling on every launch.
 */
export async function isNotificationScheduled(identifier: string): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === identifier);
  } catch (error) {
    console.warn('Failed to list scheduled notifications:', error);
    return false;
  }
}

/**
 * Cancels a single scheduled notification by its identifier, leaving all other
 * scheduled reminders untouched.
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn('Failed to cancel scheduled notification:', error);
  }
}

export async function scheduleDailyCheckIn(
  hour: number = 9,
  minute: number = 0
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    await ensureUrgeNotificationCategory();
    await cancelScheduledNotification(LEGACY_DAILY_ENCOURAGEMENT_IDENTIFIER);

    // Idempotent: if this version is already scheduled, keep it.
    if (await isNotificationScheduled(DAILY_ENCOURAGEMENT_IDENTIFIER)) {
      return DAILY_ENCOURAGEMENT_IDENTIFIER;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ENCOURAGEMENT_IDENTIFIER,
      content: {
        title: 'Sovereign Check-In',
        body: 'Hold the line today.',
        sound: true,
        categoryIdentifier: BEAT_URGE_ACTION,
        data: {
          type: 'daily_encouragement',
          scheduledAt: Date.now(),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule daily notification:', error);
    return null;
  }
}

