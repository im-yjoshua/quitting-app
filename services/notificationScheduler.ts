import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermissions, cancelAllNotifications } from './notifications';

export const NOTIFICATIONS_SCHEDULE_KEY = '@sovereign/notifications_schedule';

const MORNING_MESSAGES = [
  "Morning Directive: 45 minutes of physical strain before sundown. Hold the standard.",
  "Morning Directive: Map your intent. Execute with precision today.",
  "Morning Directive: Protect your early hours. Clarity dictates victory.",
];

const MIDDAY_MESSAGES = [
  "Midday Anchor: Dopamine urges peak and pass in 10 minutes. Stay centered.",
  "Midday Anchor: Recalibrate your focus. The afternoon requires discipline.",
  "Midday Anchor: Do not negotiate with temporary cravings. Breathe.",
];

const EVENING_MESSAGES = [
  "Evening Audit: Close today's quests and log your daily voice reflection.",
  "Evening Audit: Screen-free time approaches. Disconnect and recover.",
  "Evening Audit: Review the day. What did you conquer? What needs tuning?",
];

function getRandomMessage(pool: string[]) {
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function scheduleDailyCadenceProtocol(): Promise<boolean> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  await cancelAllNotifications();

  // 1. Morning Directive (08:00 AM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sovereign Morning',
      body: getRandomMessage(MORNING_MESSAGES),
      sound: true,
      data: { type: 'cadence_morning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  // 2. Midday Anchor (02:00 PM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sovereign Midday',
      body: getRandomMessage(MIDDAY_MESSAGES),
      sound: true,
      data: { type: 'cadence_midday' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 14,
      minute: 0,
    },
  });

  // 3. Evening Audit (08:30 PM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sovereign Evening',
      body: getRandomMessage(EVENING_MESSAGES),
      sound: true,
      data: { type: 'cadence_evening' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 30,
    },
  });

  await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULE_KEY, 'true');
  return true;
}

export async function disableDailyCadenceProtocol(): Promise<void> {
  await cancelAllNotifications();
  await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULE_KEY, 'false');
}

export async function checkDailyCadenceStatus(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(NOTIFICATIONS_SCHEDULE_KEY);
    return status === 'true';
  } catch {
    return false;
  }
}

export async function scheduleTestCheckpoint(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'System Test',
      body: 'Diagnostics complete. Haptics and visual banners are active.',
      sound: true,
      data: { type: 'test_checkpoint' },
    },
    trigger: {
      seconds: 5,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
    },
  });
}
