import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export const DAILY_ENCOURAGEMENT_IDENTIFIER = 'sovereign_daily_encouragement';

/**
 * High-status, austere quotes matched to dopamine reset and habit discipline.
 */
const ENCOURAGEMENT_ARCHIVE = [
  'Master your impulses today. Your streak is compounding.',
  'Dopamine receptors are actively recalibrating. Stand firm.',
  'Clarity over cheap stimulation. Maintain the sovereign run.',
  'Discipline is self-preservation. Keep your focus intact.',
  'The urge will peak and dissipate. Breathe and hold ground.',
  'Every hour clean builds neurochemical resilience. Stay sharp.',
  'Honor your baseline. Do not negotiate with temporary cravings.',
];

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
 * Check whether local notification permissions are currently active.
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
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

    // Cancel existing scheduled notifications to avoid duplicates
    await cancelAllNotifications();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sovereign Check-In',
        body: 'Hold the line today.',
        sound: true,
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

/**
 * Cancels all scheduled on-device notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel notifications:', error);
  }
}
