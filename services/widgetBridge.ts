import AsyncStorage from '@react-native-async-storage/async-storage';
import { breakDownDuration, calculateConcentricDialMetrics } from './chronometerEngine';

export const WIDGET_STORAGE_KEY = '@sovereign_widget_data';

export interface SovereignStreakWidgetProps {
  daysClean: number;
  formattedTime: string;
  habitTitle: string;
  accentColor: string;
  progress24h: number;
  progress7d: number;
  progress90d: number;
  stealthMode: boolean;
}

export interface WidgetSyncParams {
  cleanDurationMs: number;
  habitTitle?: string;
  accentColor?: string;
  stealthMode?: boolean;
}

/**
 * Air-gapped on-device bridging logic:
 * Updates local storage snapshot for Expo Go compatibility without native extensions.
 */
export async function syncWidgetStreakData(params: WidgetSyncParams): Promise<void> {
  try {
    const {
      cleanDurationMs,
      habitTitle = 'Habit Elimination',
      accentColor = '#0A84FF',
      stealthMode = false,
    } = params;

    const {
      formattedDays,
      formattedHours,
      formattedMinutes,
      formattedSeconds,
    } = breakDownDuration(cleanDurationMs);

    const dials = calculateConcentricDialMetrics(cleanDurationMs);
    const daysNumber = Math.max(1, parseInt(formattedDays, 10) || 1);

    const widgetPayload: SovereignStreakWidgetProps = {
      daysClean: daysNumber,
      formattedTime: `${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
      habitTitle,
      accentColor,
      progress24h: dials.cycle24h.progress,
      progress7d: dials.cycle7d.progress,
      progress90d: dials.cycle90d.progress,
      stealthMode,
    };

    // Persist to local storage for simulated/offline access
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgetPayload));
  } catch (error) {
    console.log('[WidgetBridge] Simulated widget data update:', error);
  }
}
