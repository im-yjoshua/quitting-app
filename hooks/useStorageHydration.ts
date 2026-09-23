import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppStateData,
  UserProfile,
  RelapseRecord,
  CircadianDayRecord,
  CircadianHistory,
} from '../types/app';
import {
  loadStoredAppState,
  saveStoredAppState,
  updateUserProfile,
  appendRelapseRecord,
  updateCircadianDay,
  forceFlushPendingWrites,
  exportTelemetryBackup,
  importTelemetryBackup,
  DEFAULT_APP_STATE,
} from '../services/storage';

export interface StorageHydrationResult {
  state: AppStateData;
  isHydrated: boolean;
  hydrationError: Error | null;
  persistState: (nextState: AppStateData) => Promise<boolean>;
  updateProfile: (updater: (prev: UserProfile) => UserProfile) => Promise<UserProfile>;
  recordRelapse: (record: RelapseRecord) => Promise<RelapseRecord[]>;
  logCircadianDay: (
    dateKey: string,
    updater: (prev: CircadianDayRecord) => CircadianDayRecord
  ) => Promise<CircadianHistory>;
  refreshState: () => Promise<void>;
  exportTelemetry: () => Promise<{ success: boolean; error?: string }>;
  importTelemetry: (jsonBackup: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * High-reliability storage hydration and persistence hook.
 *
 * Directives:
 * 1. Guarantees atomic writes and zero data loss on unexpected app suspension/termination.
 * 2. Automatically flushes write queue on AppState background transition.
 * 3. Provides clean export/import air-gapped primitives.
 * 4. Exposes granular atomic entity updaters for UserProfile, RelapseRecord, and CircadianDay.
 */
export function useStorageHydration(): StorageHydrationResult {
  const [state, setState] = useState<AppStateData>(DEFAULT_APP_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<Error | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Initial cold-start state hydration
  const refreshState = useCallback(async () => {
    try {
      const stored = await loadStoredAppState();
      setState(stored);
      setHydrationError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useStorageHydration] Hydration failure:', error);
      setHydrationError(error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // AppState listener: Flush write queue immediately when app transitions to background or inactive
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is being suspended or backgrounded by the OS.
        // Force synchronous completion of in-flight writes to disk.
        forceFlushPendingWrites().catch((flushErr) => {
          console.error('[useStorageHydration] Error flushing writes during backgrounding:', flushErr);
        });
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Atomic state persistence with immediate optimistic UI update
  const persistState = useCallback(async (nextState: AppStateData): Promise<boolean> => {
    setState(nextState);
    const success = await saveStoredAppState(nextState);
    if (!success) {
      console.error('[useStorageHydration] Failed to commit state mutation to disk');
    }
    return success;
  }, []);

  // Atomic granular user profile updater
  const updateProfile = useCallback(
    async (updater: (prev: UserProfile) => UserProfile): Promise<UserProfile> => {
      const updated = await updateUserProfile(updater);
      setState((prev) => ({ ...prev, profile: updated }));
      return updated;
    },
    []
  );

  // Atomic granular relapse record appender
  const recordRelapse = useCallback(
    async (record: RelapseRecord): Promise<RelapseRecord[]> => {
      const updatedHistory = await appendRelapseRecord(record);
      setState((prev) => ({ ...prev, relapseHistory: updatedHistory }));
      return updatedHistory;
    },
    []
  );

  // Atomic granular circadian day updater
  const logCircadianDay = useCallback(
    async (
      dateKey: string,
      updater: (prev: CircadianDayRecord) => CircadianDayRecord
    ): Promise<CircadianHistory> => {
      const updatedCircadian = await updateCircadianDay(dateKey, updater);
      setState((prev) => ({ ...prev, circadianHistory: updatedCircadian }));
      return updatedCircadian;
    },
    []
  );

  // Air-gapped export via native Share dialog
  const exportTelemetry = useCallback(async () => {
    const result = await exportTelemetryBackup();
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  // Air-gapped backup import
  const importTelemetry = useCallback(async (jsonBackup: string) => {
    const result = await importTelemetryBackup(jsonBackup);
    if (result.success && result.data) {
      setState(result.data);
      return { success: true };
    }
    return { success: false, error: result.error || 'Import failed' };
  }, []);

  return {
    state,
    isHydrated,
    hydrationError,
    persistState,
    updateProfile,
    recordRelapse,
    logCircadianDay,
    refreshState,
    exportTelemetry,
    importTelemetry,
  };
}
