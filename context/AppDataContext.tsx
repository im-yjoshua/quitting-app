import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  AppStateData,
  RelapseRecord,
  RelapseTrigger,
  AuraTier,
  HabitCategory,
  InterventionDrillType,
  PurchasePlan,
  PurchaseState,
  SovereignEntitlement,
} from '../types/app';
import {
  getTrustedOfflineEntitlement,
  purchaseProduct,
  restorePurchasesWithBiometrics as restorePurchasesWithBiometricsService,
  syncCustomerEntitlements,
  DEFAULT_ENTITLEMENT,
  PurchaseResult,
  RestoreResult,
} from '../services/purchases';
import {
  checkBiometricCapability,
  authenticateLocalOwner,
} from '../services/biometrics';
import * as LocalAuthentication from 'expo-local-authentication';

import {
  loadStoredAppState,
  loadStoredAppStateDetailed,
  saveStoredAppState,
  forceFlushPendingWrites,
  exportTelemetryBackup,
  importTelemetryBackup,
  DEFAULT_APP_STATE,
  StorageLoadStatus,
} from '../services/storage';
import {
  calculateCleanDurationMs,
  calculateConcentricDialMetrics,
  calculateStreakTelemetry,
  calculateRelapseForfeiture,
  getLocalDateKey,
  CIRCADIAN_AURA_REWARD,
  StreakTelemetry,
  ConcentricDialMetrics,
} from '../services/chronometerEngine';

interface AppDataContextValue {
  state: AppStateData;
  isLoading: boolean;
  auraTier: AuraTier;
  cleanDurationMs: number;
  effectiveStreakDurationMs: number;
  concentricDialMetrics: ConcentricDialMetrics;
  streakTelemetry: StreakTelemetry;
  todayMultiplierActive: boolean;
  canClaimIntervention: boolean;
  interventionCooldownSeconds: number;
  completeOnboarding: (
    title: string,
    category: HabitCategory,
    weeklyCost: number,
    dailyMinutes: number
  ) => Promise<void>;
  recordRelapse: (trigger: RelapseTrigger, notes?: string) => Promise<void>;
  claimInterventionAura: (drillType: InterventionDrillType, auraAward?: number) => Promise<boolean>;
  claimChallengeAura: (challengeId: string, auraAward: number) => Promise<boolean>;
  completeCircadianRitual: (type: 'am' | 'pm') => Promise<boolean>;
  refreshState: () => Promise<void>;
  syncCurrentTime: () => void;
  exportTelemetry: () => Promise<{ success: boolean; data?: string; error?: string }>;
  importTelemetry: (jsonBackup: string) => Promise<{ success: boolean; error?: string }>;
  // Storage integrity & recovery — surfaced so the user is told when their
  // saved data failed its integrity check instead of being silently reset.
  storageLoadStatus: StorageLoadStatus;
  quarantinedStorageKey: string | null;
  isStorageRecoveryVisible: boolean;
  dismissStorageRecoveryNotice: () => void;
  reopenStorageRecoveryNotice: () => void;
  eraseAllDataAndStartFresh: () => Promise<void>;
  // In-App Purchases & Sovereign Entitlements
  isSovereignUser: boolean;
  purchasedPlan: PurchasePlan | null;
  entitlement: SovereignEntitlement;
  purchaseState: PurchaseState;
  purchaseError: string | null;
  purchasePackage: (plan: PurchasePlan) => Promise<PurchaseResult>;
  restorePurchasesWithBiometrics: () => Promise<RestoreResult>;
  isPaywallVisible: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  toggleBiometrics: () => Promise<{ enabled: boolean; error?: string }>;
}


const AppDataContext = createContext<AppDataContextValue | null>(null);

const INTERVENTION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes strict anti-exploit window

import { calculateTier } from '../services/auraTiers';
import { challengeAlreadyClaimedToday, circadianWindowAllows } from '../services/rewardRules';
import { calculateCleanReceipt } from '../services/cleanReceipt';

// Monotonic per-session counter so relapse IDs are unique without randomness.
// Combined with the millisecond timestamp, IDs are unique across sessions too.
let relapseIdCounter = 0;

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(DEFAULT_APP_STATE);
  const [isLoading, setIsLoading] = useState(true);
  // Bumped when the app returns to the foreground so derived durations refresh.
  // The 1s clock lives in useNow(), not here — a provider tick rerenders every screen.
  const [resumedAt, setResumedAt] = useState(Date.now());
  const [entitlement, setEntitlement] = useState<SovereignEntitlement>(DEFAULT_ENTITLEMENT);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);

  // Storage integrity: the outcome of this launch's load. When the stored
  // payload failed its integrity check, the storage layer quarantines the
  // original bytes and we tell the user instead of silently resetting them.
  const [storageLoadStatus, setStorageLoadStatus] =
    useState<StorageLoadStatus>('fresh-install');
  const [quarantinedStorageKey, setQuarantinedStorageKey] = useState<
    string | null
  >(null);
  const [storageRecoveryDismissed, setStorageRecoveryDismissed] =
    useState(false);

  // Re-synchronize clock immediately to prevent timer drift
  const syncCurrentTime = useCallback(() => {
    setResumedAt(Date.now());
  }, []);

  // AppState listener: refresh durations when returning from background, and
  // flush the write queue when the app leaves the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncCurrentTime();
      } else if (nextAppState.match(/inactive|background/)) {
        forceFlushPendingWrites().catch((flushErr) => {
          console.error('[AppDataContext] Error flushing writes during backgrounding:', flushErr);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncCurrentTime]);

  // Initial local storage hydration: load app state and the trusted offline
  // entitlement in parallel. The trusted entitlement honors ONLY previously
  // RevenueCat-validated purchases outside __DEV__ — synthesized dev-sandbox
  // entitlements never unlock premium here.
  //
  // The detailed loader is used (not the silent one) so a quarantined/corrupt
  // payload surfaces its status to the recovery UI instead of looking like a
  // fresh install.
  useEffect(() => {
    async function hydrate() {
      try {
        const [detailed, cachedEntitlement] = await Promise.all([
          loadStoredAppStateDetailed(),
          getTrustedOfflineEntitlement(),
        ]);
        stateRef.current = detailed.state;
        setState(detailed.state);
        setStorageLoadStatus(detailed.status);
        setQuarantinedStorageKey(detailed.quarantinedKey ?? null);
        setStorageRecoveryDismissed(false);
        setEntitlement(cachedEntitlement);
      } finally {
        setIsLoading(false);
      }

      // Synchronize in background if online (never blocks initial render)
      syncCustomerEntitlements()
        .then((fresh) => {
          if (fresh) setEntitlement(fresh);
        })
        .catch(() => {});
    }
    hydrate();
  }, []);

  // Persist state updates on change
  // Mutable mirror of the latest committed state. Async actions read this instead of
  // the render-scoped `state` closure, so two actions fired in quick succession can
  // never build their updates from the same stale snapshot and overwrite each other.
  const stateRef = useRef<AppStateData>(DEFAULT_APP_STATE);

  // Synchronously applies an update: computes from the latest committed state, refreshes
  // the mirror immediately (atomic within JS's single thread), then updates React state.
  const commitState = useCallback(
    (updater: (prev: AppStateData) => AppStateData): AppStateData => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      return next;
    },
    []
  );

  // Serialized persist queue: disk writes land in commit order, so a slow earlier
  // write can never clobber a later one.
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistState = useCallback(
    async (updater: (prev: AppStateData) => AppStateData): Promise<void> => {
      const next = commitState(updater);
      const write = persistQueueRef.current.then(() => saveStoredAppState(next));
      persistQueueRef.current = write.then(
        () => undefined,
        (err: unknown) => {
          console.error('[AppDataContext] Failed to persist state:', err);
        }
      );
      await write;
    },
    [commitState]
  );

  // Pure derived clean duration from epoch timestamps with millisecond precision
  const cleanDurationMs = useMemo(() => {
    return calculateCleanDurationMs(resumedAt, state.profile.startDate);
  }, [resumedAt, state.profile.startDate]);

  // Pure concentric dial metrics (24h diurnal, 7d surge, 90d receptor recovery)
  const concentricDialMetrics = useMemo(() => {
    return calculateConcentricDialMetrics(cleanDurationMs);
  }, [cleanDurationMs]);

  // Pure streak telemetry accounting for 1.25x circadian multiplier history
  const streakTelemetry = useMemo(() => {
    return calculateStreakTelemetry(
      cleanDurationMs,
      state.profile.startDate,
      state.circadianHistory,
      resumedAt
    );
  }, [cleanDurationMs, state.profile.startDate, state.circadianHistory, resumedAt]);

  const effectiveStreakDurationMs = streakTelemetry.effectiveDurationMs;
  const todayMultiplierActive = streakTelemetry.todayMultiplierActive;

  // Derived Aura reputation tier
  const auraTier = useMemo(() => {
    return calculateTier(state.profile.auraScore);
  }, [state.profile.auraScore]);

  // Derived cooldown status for Urge Neutralizer
  const cooldownUntil = state.interventionState.cooldownUntil ?? 0;
  const interventionCooldownSeconds = useMemo(() => {
    const remainingMs = cooldownUntil - resumedAt;
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }, [cooldownUntil, resumedAt]);

  const canClaimIntervention = interventionCooldownSeconds === 0;

  // Onboarding action
  const completeOnboarding = useCallback(
    async (
      title: string,
      category: HabitCategory,
      weeklyCost: number,
      dailyMinutes: number
    ) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const now = Date.now();
      await persistState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          habitTitle: title.trim() || 'Digital Freedom',
          habitCategory: category,
          weeklyCostEstimated: Math.max(0, weeklyCost),
          dailyMinutesWasted: Math.max(0, dailyMinutes),
          startDate: now,
          bestRecordMs: 0,
          attemptCount: 1,
          tierStatus: calculateTier(prev.profile.auraScore),
          isOnboarded: true,
        },
      }));
    },
    [persistState]
  );

  // Biometric lock toggle. Enabling is gated: the device must have biometric hardware
  // with enrolled biometrics, and the user must pass a live authentication challenge.
  // Fails gracefully with a clear message instead of flipping a flag that can't work.
  const toggleBiometrics = useCallback(async (): Promise<{
    enabled: boolean;
    error?: string;
  }> => {
    const currentlyEnabled = stateRef.current.profile.biometricsEnabled;

    if (currentlyEnabled) {
      await persistState((prev) => ({
        ...prev,
        profile: { ...prev.profile, biometricsEnabled: false },
      }));
      return { enabled: false };
    }

    const capability = await checkBiometricCapability();
    const biometricsEnrolled =
      capability.isEnrolled ||
      capability.enrolledLevel >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;

    if (!capability.hasHardware || !biometricsEnrolled) {
      return {
        enabled: false,
        error:
          'No biometrics are set up on this device. Enable Face ID, Touch ID, or fingerprint in your device settings first.',
      };
    }

    const authenticated = await authenticateLocalOwner(
      'Confirm it\u2019s you to enable the biometric lock'
    );
    if (!authenticated) {
      return {
        enabled: false,
        error: 'Authentication failed or was cancelled. Biometric lock was not enabled.',
      };
    }

    await persistState((prev) => ({
      ...prev,
      profile: { ...prev.profile, biometricsEnabled: true },
    }));
    return { enabled: true };
  }, [persistState]);

  // Relapse report execution (Truthful record, cold reset with forfeited aura & duration)
  const recordRelapse = useCallback(
    async (trigger: RelapseTrigger, notes?: string) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const now = Date.now();

      // Reset today's circadian record for the new attempt so new streak starts fresh
      const today = getLocalDateKey(now);

      await persistState((prev) => {
        const forfeiture = calculateRelapseForfeiture(
          prev.profile.startDate,
          now,
          prev.circadianHistory,
          prev.profile.auraScore
        );

        const newBestRecord = Math.max(
          prev.profile.bestRecordMs,
          forfeiture.forfeitedCleanDurationMs
        );

        const nextAura = Math.max(0, prev.profile.auraScore - forfeiture.forfeitedAura);
        const receipt = calculateCleanReceipt(
          forfeiture.forfeitedCleanDurationMs,
          prev.profile.weeklyCostEstimated,
          prev.profile.dailyMinutesWasted
        );

        const newRecord: RelapseRecord = {
          id: `relapse_${now}_${(relapseIdCounter++).toString(36)}`,
          timestamp: now,
          cleanDurationMs: forfeiture.forfeitedCleanDurationMs,
          trigger,
          notes: notes?.trim() || undefined,
          reflection: notes?.trim() || undefined,
          attemptNumber: prev.profile.attemptCount,
          forfeitedAura: forfeiture.forfeitedAura,
          moneyKept: receipt.moneyKept,
          minutesReclaimed: receipt.minutesReclaimed,
        };

        const updatedCircadian = { ...prev.circadianHistory };
        if (updatedCircadian[today]) {
          updatedCircadian[today] = {
            ...updatedCircadian[today],
            amCompleted: false,
            amCompletedAt: null,
            pmCompleted: false,
            pmCompletedAt: null,
            multiplierActive: false,
          };
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            startDate: now,
            bestRecordMs: newBestRecord,
            attemptCount: prev.profile.attemptCount + 1,
            auraScore: nextAura,
            tierStatus: calculateTier(nextAura),
          },
          relapseHistory: [newRecord, ...prev.relapseHistory],
          circadianHistory: updatedCircadian,
        };
      });
    },
    [persistState]
  );

  // Anti-exploit urge intervention claim
  const claimInterventionAura = useCallback(
    async (_drillType: InterventionDrillType, auraAward = 25): Promise<boolean> => {
      const now = Date.now();
      const currentCooldown = stateRef.current.interventionState.cooldownUntil ?? 0;

      // Lockout check: Reject if within 10-minute cooldown
      if (now < currentCooldown) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return false;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await persistState((prev) => {
        const nextAura = prev.profile.auraScore + auraAward;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            auraScore: nextAura,
            tierStatus: calculateTier(nextAura),
          },
          interventionState: {
            lastCompletedAt: now,
            cooldownUntil: now + INTERVENTION_COOLDOWN_MS,
          },
        };
      });
      return true;
    },
    [persistState]
  );

  // Timed challenge completion claim
  const claimChallengeAura = useCallback(
    async (challengeId: string, auraAward: number): Promise<boolean> => {
      const now = Date.now();
      const today = getLocalDateKey(now);
      if (challengeAlreadyClaimedToday(stateRef.current.challengeClaims, challengeId, now)) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return false;
      }

      let awarded = false;
      await persistState((prev) => {
        const claims = prev.challengeClaims ?? {};
        if (challengeAlreadyClaimedToday(claims, challengeId, now)) return prev;
        awarded = true;
        const nextAura = prev.profile.auraScore + auraAward;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            auraScore: nextAura,
            tierStatus: calculateTier(nextAura),
          },
          activeChallengeId: challengeId,
          challengeClaims: { ...claims, [challengeId]: today },
        };
      });
      if (!awarded) return false;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    },
    [persistState]
  );

  const completeCircadianRitual = useCallback(
    async (type: 'am' | 'pm'): Promise<boolean> => {
      const now = Date.now();
      if (!circadianWindowAllows(type, now)) return false;

      const today = getLocalDateKey(now);
      const existing = stateRef.current.circadianHistory[today];
      if (type === 'am' && existing?.amCompleted) return false;
      if (type === 'pm' && existing?.pmCompleted) return false;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await persistState((prev) => {
        const existingToday = prev.circadianHistory[today] || {
          dateString: today,
          amCompleted: false,
          amCompletedAt: null,
          pmCompleted: false,
          pmCompletedAt: null,
          multiplierActive: false,
        };
        if (type === 'am' && existingToday.amCompleted) return prev;
        if (type === 'pm' && existingToday.pmCompleted) return prev;

        const updatedDay = {
          ...existingToday,
          amCompleted: type === 'am' ? true : existingToday.amCompleted,
          amCompletedAt: type === 'am' ? now : existingToday.amCompletedAt,
          pmCompleted: type === 'pm' ? true : existingToday.pmCompleted,
          pmCompletedAt: type === 'pm' ? now : existingToday.pmCompletedAt,
        };

        const wasMultiplierActive = existingToday.multiplierActive;
        const isNowMultiplierActive = updatedDay.amCompleted && updatedDay.pmCompleted;
        updatedDay.multiplierActive = isNowMultiplierActive;

        const auraBonus =
          !wasMultiplierActive && isNowMultiplierActive ? CIRCADIAN_AURA_REWARD : 0;
        const nextAura = prev.profile.auraScore + auraBonus;

        return {
          ...prev,
          profile: {
            ...prev.profile,
            auraScore: nextAura,
            tierStatus: calculateTier(nextAura),
          },
          circadianHistory: {
            ...prev.circadianHistory,
            [today]: updatedDay,
          },
        };
      });
      return true;
    },
    [persistState]
  );

  const refreshState = useCallback(async () => {
    const fresh = await loadStoredAppState();
    stateRef.current = fresh;
    setState(fresh);
    syncCurrentTime();
  }, [syncCurrentTime]);

  const exportTelemetry = useCallback(async () => {
    const result = await exportTelemetryBackup();
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }, []);

  const importTelemetry = useCallback(
    async (jsonBackup: string) => {
      const res = await importTelemetryBackup(jsonBackup);
      if (res.success && res.data) {
        const restored = res.data;
        commitState(() => restored);
        // The restored state passed full validation, so the store is trusted again.
        setStorageLoadStatus('ok');
        setQuarantinedStorageKey(null);
        setStorageRecoveryDismissed(true);
        syncCurrentTime();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to import backup' };
    },
    [commitState, syncCurrentTime]
  );

  // Recovery notice visibility: shown once per launch while the store is in a
  // quarantined state, until the user dismisses it or resolves it (restore /
  // start fresh). Dismissing never deletes the quarantined copy.
  const isStorageRecoveryVisible =
    storageLoadStatus === 'corrupted-quarantined' && !storageRecoveryDismissed;

  const dismissStorageRecoveryNotice = useCallback(() => {
    setStorageRecoveryDismissed(true);
  }, []);

  const reopenStorageRecoveryNotice = useCallback(() => {
    setStorageRecoveryDismissed(false);
  }, []);

  // Deliberate, explicit fresh start after a corruption notice. The quarantined
  // original is left on disk (never deleted by this action) so nothing is
  // silently destroyed. The new state starts its clock now — it does not reuse
  // the module-load timestamp baked into DEFAULT_APP_STATE.
  const eraseAllDataAndStartFresh = useCallback(async () => {
    const freshState: AppStateData = {
      ...DEFAULT_APP_STATE,
      profile: {
        ...DEFAULT_APP_STATE.profile,
        startDate: Date.now(),
        isOnboarded: false,
      },
    };
    const saved = await saveStoredAppState(freshState);
    if (!saved) {
      throw new Error('Could not write a fresh state on this device.');
    }
    stateRef.current = freshState;
    setState(freshState);
    setStorageLoadStatus('fresh-install');
    setQuarantinedStorageKey(null);
    setStorageRecoveryDismissed(true);
    syncCurrentTime();
  }, [syncCurrentTime]);

  const openPaywall = useCallback(() => {
    setIsPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
  }, []);

  const purchasePackage = useCallback(
    async (plan: PurchasePlan): Promise<PurchaseResult> => {
      setPurchaseState('pending');
      setPurchaseError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const result = await purchaseProduct(plan);

      if (result.success && result.entitlement) {
        setEntitlement(result.entitlement);
        setPurchaseState('purchased');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return result;
      }

      if (result.cancelled) {
        setPurchaseState('cancelled');
        return result;
      }

      setPurchaseState('error');
      setPurchaseError(result.error || 'Transaction could not be completed.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return result;
    },
    []
  );

  const restorePurchasesWithBiometrics = useCallback(async (): Promise<RestoreResult> => {
    setPurchaseState('pending');
    setPurchaseError(null);

    const result = await restorePurchasesWithBiometricsService();

    if (result.success && result.restored && result.entitlement) {
      setEntitlement(result.entitlement);
      setPurchaseState('purchased');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return result;
    }

    if (result.success && !result.restored) {
      setPurchaseState('idle');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return result;
    }

    setPurchaseState('error');
    setPurchaseError(result.message);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return result;
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      isLoading,
      auraTier,
      cleanDurationMs,
      effectiveStreakDurationMs,
      concentricDialMetrics,
      streakTelemetry,
      todayMultiplierActive,
      canClaimIntervention,
      interventionCooldownSeconds,
      completeOnboarding,
      recordRelapse,
      claimInterventionAura,
      claimChallengeAura,
      completeCircadianRitual,
      refreshState,
      syncCurrentTime,
      exportTelemetry,
      importTelemetry,
      storageLoadStatus,
      quarantinedStorageKey,
      isStorageRecoveryVisible,
      dismissStorageRecoveryNotice,
      reopenStorageRecoveryNotice,
      eraseAllDataAndStartFresh,
      isSovereignUser: entitlement.isSovereign,
      purchasedPlan: entitlement.activePlan,
      entitlement,
      purchaseState,
      purchaseError,
      purchasePackage,
      restorePurchasesWithBiometrics,
      isPaywallVisible,
      openPaywall,
      closePaywall,
      toggleBiometrics,
    }),
    [
      state,
      isLoading,
      auraTier,
      cleanDurationMs,
      effectiveStreakDurationMs,
      concentricDialMetrics,
      streakTelemetry,
      todayMultiplierActive,
      canClaimIntervention,
      interventionCooldownSeconds,
      completeOnboarding,
      recordRelapse,
      claimInterventionAura,
      claimChallengeAura,
      completeCircadianRitual,
      refreshState,
      syncCurrentTime,
      exportTelemetry,
      importTelemetry,
      storageLoadStatus,
      quarantinedStorageKey,
      isStorageRecoveryVisible,
      dismissStorageRecoveryNotice,
      reopenStorageRecoveryNotice,
      eraseAllDataAndStartFresh,
      entitlement,
      purchaseState,
      purchaseError,
      purchasePackage,
      restorePurchasesWithBiometrics,
      isPaywallVisible,
      openPaywall,
      closePaywall,
      toggleBiometrics,
    ]
  );


  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextValue => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};