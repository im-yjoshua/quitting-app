import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { getStartTimestamp, setStartTimestamp } from '@/services/storage';
import {
  breakDownDuration,
  calculateConcentricDialMetrics,
  ConcentricDialMetrics,
} from '@/services/chronometerEngine';

export interface StreakContextValue {
  startTimestamp: string; // ISO string
  startEpochMs: number;
  cleanDurationMs: number;
  formattedDays: string;
  formattedHours: string;
  formattedMinutes: string;
  formattedSeconds: string;
  concentricRings: ConcentricDialMetrics;
  resetAnchor: (notes?: string) => Promise<void>;
  setCustomAnchor: (isoString: string) => Promise<void>;
  refreshAnchor: () => Promise<void>;
  isLoading: boolean;
}

const StreakContext = createContext<StreakContextValue | null>(null);

export const StreakProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [startTimestamp, setStartTimestampState] = useState<string>(new Date().toISOString());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate exact start timestamp from persistent storage
  const refreshAnchor = useCallback(async () => {
    try {
      const stored = await getStartTimestamp();
      setStartTimestampState(stored);
    } catch (err) {
      console.warn('[StreakContext] Failed to load start timestamp:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAnchor();
  }, [refreshAnchor]);

  // Second-ticker reference for real-time chronometer calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse epoch milliseconds
  const startEpochMs = useMemo(() => {
    const parsed = Date.parse(startTimestamp);
    return isNaN(parsed) ? currentTime : parsed;
  }, [startTimestamp, currentTime]);

  // Clean duration from epoch timestamp
  const cleanDurationMs = useMemo(() => {
    return Math.max(0, currentTime - startEpochMs);
  }, [currentTime, startEpochMs]);

  // Tabular breakdown (days, hours, minutes, seconds)
  const breakdown = useMemo(() => {
    return breakDownDuration(cleanDurationMs);
  }, [cleanDurationMs]);

  // Concentric dial metrics (24h daily, 7d surge, 90d recovery reset)
  const concentricRings = useMemo(() => {
    return calculateConcentricDialMetrics(cleanDurationMs);
  }, [cleanDurationMs]);

  // Reset anchor action with haptic friction and confirmation in case of relapse
  const resetAnchor = useCallback(
    async (_notes?: string) => {
      // Haptic friction warning
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert(
        'Confirm Relapse',
        'Are you sure you want to reset your chronometer anchor? This will reset all your clean time rings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Anchor',
            style: 'destructive',
            onPress: async () => {
              const nowIso = new Date().toISOString();
              setStartTimestampState(nowIso);
              await setStartTimestamp(nowIso);
            },
          },
        ]
      );
    },
    []
  );

  // Set custom anchor (e.g. retroactive date adjustment)
  const setCustomAnchor = useCallback(async (isoString: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStartTimestampState(isoString);
    await setStartTimestamp(isoString);
  }, []);

  const value = useMemo<StreakContextValue>(
    () => ({
      startTimestamp,
      startEpochMs,
      cleanDurationMs,
      formattedDays: breakdown.formattedDays,
      formattedHours: breakdown.formattedHours,
      formattedMinutes: breakdown.formattedMinutes,
      formattedSeconds: breakdown.formattedSeconds,
      concentricRings,
      resetAnchor,
      setCustomAnchor,
      refreshAnchor,
      isLoading,
    }),
    [
      startTimestamp,
      startEpochMs,
      cleanDurationMs,
      breakdown,
      concentricRings,
      resetAnchor,
      setCustomAnchor,
      refreshAnchor,
      isLoading,
    ]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};

export function useStreak(): StreakContextValue {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}
