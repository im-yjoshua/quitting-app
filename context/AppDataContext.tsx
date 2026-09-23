import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
  loadCachedEntitlement,
  purchaseProduct,
  restorePurchasesWithBiometrics as restorePurchasesWithBiometricsService,
  syncCustomerEntitlements,
  DEFAULT_ENTITLEMENT,
  PurchaseResult,
  RestoreResult,
} from '../services/purchases';

import {
  loadStoredAppState,
  saveStoredAppState,
  forceFlushPendingWrites,
  exportTelemetryBackup,
  importTelemetryBackup,
  DEFAULT_APP_STATE,
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
  completeCircadianRitual: (type: 'am' | 'pm') => Promise<void>;
  refreshState: () => Promise<void>;
  syncCurrentTime: () => void;
  exportTelemetry: () => Promise<{ success: boolean; error?: string }>;
  importTelemetry: (jsonBackup: string) => Promise<{ success: boolean; error?: string }>;
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
  toggleBiometrics: () => Promise<boolean>;
}


const AppDataContext = createContext<AppDataContextValue | null>(null);

const INTERVENTION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes strict anti-exploit window

function calculateTier(auraScore: number): AuraTier {
  if (auraScore >= 2000) return 'Sovereign';
  if (auraScore >= 500) return 'Sentinel';
  return 'Initiate';
}

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppStateData>(DEFAULT_APP_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [entitlement, setEntitlement] = useState<SovereignEntitlement>(DEFAULT_ENTITLEMENT);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);

  // Re-synchronize clock immediately to prevent timer drift
  const syncCurrentTime = useCallback(() => {
    setCurrentTime(Date.now());
  }, []);

  // Second-ticker reference for derived durations and cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // AppState listener: Instantly synchronize chronometer upon returning from background/sleep
  // and synchronously flush write queue to disk when app transitions to background or inactive
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

  // Initial local storage hydration: load app state and cached entitlement in parallel
  useEffect(() => {
    async function hydrate() {
      try {
        const [stored, cachedEntitlement] = await Promise.all([
          loadStoredAppState(),
          loadCachedEntitlement(),
        ]);
        setState(stored);
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
  const persistState = useCallback(async (nextState: AppStateData) => {
    setState(nextState);
    await saveStoredAppState(nextState);
  }, []);

  // Pure derived clean duration from epoch timestamps with millisecond precision
  const cleanDurationMs = useMemo(() => {
    return calculateCleanDurationMs(currentTime, state.profile.startDate);
  }, [currentTime, state.profile.startDate]);

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
      currentTime
    );
  }, [cleanDurationMs, state.profile.startDate, state.circadianHistory, currentTime]);

  const effectiveStreakDurationMs = streakTelemetry.effectiveDurationMs;
  const todayMultiplierActive = streakTelemetry.todayMultiplierActive;

  // Derived Aura reputation tier
  const auraTier = useMemo(() => {
    return calculateTier(state.profile.auraScore);
  }, [state.profile.auraScore]);

  // Derived cooldown status for Urge Neutralizer
  const cooldownUntil = state.interventionState.cooldownUntil ?? 0;
  const interventionCooldownSeconds = useMemo(() => {
    const remainingMs = cooldownUntil - currentTime;
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }, [cooldownUntil, currentTime]);

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
      const nextState: AppStateData = {
        ...state,
        profile: {
          ...state.profile,
          habitTitle: title.trim() || 'Digital Freedom',
          habitCategory: category,
          weeklyCostEstimated: Math.max(0, weeklyCost),
          dailyMinutesWasted: Math.max(0, dailyMinutes),
          startDate: now,
          bestRecordMs: 0,
          attemptCount: 1,
          tierStatus: calculateTier(state.profile.auraScore),
          isOnboarded: true,
        },
      };

      await persistState(nextState);
    },
    [state, persistState]
  );

  const toggleBiometrics = useCallback(async (): Promise<boolean> => {
    const nextValue = !state.profile.biometricsEnabled;
    const nextState: AppStateData = {
      ...state,
      profile: {
        ...state.profile,
        biometricsEnabled: nextValue,
      },
    };
    await persistState(nextState);
    return nextValue;
  }, [state, persistState]);

  // Relapse report execution (Truthful record, cold reset with forfeited aura & duration)
  const recordRelapse = useCallback(
    async (trigger: RelapseTrigger, notes?: string) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const now = Date.now();
      const forfeiture = calculateRelapseForfeiture(
        state.profile.startDate,
        now,
        state.circadianHistory,
        state.profile.auraScore
      );

      const newBestRecord = Math.max(
        state.profile.bestRecordMs,
        forfeiture.forfeitedCleanDurationMs
      );

      const nextAura = Math.max(0, state.profile.auraScore - forfeiture.forfeitedAura);

      const newRecord: RelapseRecord = {
        id: `relapse_${now}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now,
        cleanDurationMs: forfeiture.forfeitedCleanDurationMs,
        trigger,
        notes: notes?.trim() || undefined,
        reflection: notes?.trim() || undefined,
        attemptNumber: state.profile.attemptCount,
        forfeitedAura: forfeiture.forfeitedAura,
      };

      // Reset today's circadian record for the new attempt so new streak starts fresh
      const today = getLocalDateKey(now);
      const updatedCircadian = { ...state.circadianHistory };
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

      const nextState: AppStateData = {
        ...state,
        profile: {
          ...state.profile,
          startDate: now,
          bestRecordMs: newBestRecord,
          attemptCount: state.profile.attemptCount + 1,
          auraScore: nextAura,
          tierStatus: calculateTier(nextAura),
        },
        relapseHistory: [newRecord, ...state.relapseHistory],
        circadianHistory: updatedCircadian,
      };

      await persistState(nextState);
    },
    [state, persistState]
  );

  // Anti-exploit urge intervention claim
  const claimInterventionAura = useCallback(
    async (_drillType: InterventionDrillType, auraAward = 25): Promise<boolean> => {
      const now = Date.now();
      const currentCooldown = state.interventionState.cooldownUntil ?? 0;

      // Lockout check: Reject if within 10-minute cooldown
      if (now < currentCooldown) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return false;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const nextAura = state.profile.auraScore + auraAward;
      const nextState: AppStateData = {
        ...state,
        profile: {
          ...state.profile,
          auraScore: nextAura,
          tierStatus: calculateTier(nextAura),
        },
        interventionState: {
          lastCompletedAt: now,
          cooldownUntil: now + INTERVENTION_COOLDOWN_MS,
        },
      };

      await persistState(nextState);
      return true;
    },
    [state, persistState]
  );

  // Timed challenge completion claim
  const claimChallengeAura = useCallback(
    async (challengeId: string, auraAward: number): Promise<boolean> => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const nextAura = state.profile.auraScore + auraAward;
      const nextState: AppStateData = {
        ...state,
        profile: {
          ...state.profile,
          auraScore: nextAura,
          tierStatus: calculateTier(nextAura),
        },
        activeChallengeId: challengeId,
      };

      await persistState(nextState);
      return true;
    },
    [state, persistState]
  );

  // Circadian check-in action (AM/PM) with 1.25x Multiplier Activation & Aura Reward
  const completeCircadianRitual = useCallback(
    async (type: 'am' | 'pm') => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const now = Date.now();
      const today = getLocalDateKey(now);
      const existingToday = state.circadianHistory[today] || {
        dateString: today,
        amCompleted: false,
        amCompletedAt: null,
        pmCompleted: false,
        pmCompletedAt: null,
        multiplierActive: false,
      };

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

      // Award bonus aura when circadian multiplier is newly locked for today
      const auraBonus = !wasMultiplierActive && isNowMultiplierActive ? CIRCADIAN_AURA_REWARD : 0;
      const nextAura = state.profile.auraScore + auraBonus;

      const nextState: AppStateData = {
        ...state,
        profile: {
          ...state.profile,
          auraScore: nextAura,
          tierStatus: calculateTier(nextAura),
        },
        circadianHistory: {
          ...state.circadianHistory,
          [today]: updatedDay,
        },
      };

      await persistState(nextState);
    },
    [state, persistState]
  );

  const refreshState = useCallback(async () => {
    const fresh = await loadStoredAppState();
    setState(fresh);
    syncCurrentTime();
  }, [syncCurrentTime]);

  const exportTelemetry = useCallback(async () => {
    const result = await exportTelemetryBackup();
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const importTelemetry = useCallback(
    async (jsonBackup: string) => {
      const res = await importTelemetryBackup(jsonBackup);
      if (res.success && res.data) {
        setState(res.data);
        syncCurrentTime();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to import backup' };
    },
    [syncCurrentTime]
  );

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