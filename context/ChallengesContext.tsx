import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { getLocalDateKey } from '../services/chronometerEngine';
import { loadEnvelopedObject, saveEnvelopedObject } from '../services/storage';
import { TIERS, resolveChallengeTier } from '../services/challengeTiers';
export { TIERS, resolveChallengeTier };

const STORAGE_KEY = '@sovereign/challenges_data';
const MIN_WORKOUT_MINUTES = 10;
const MAX_WORKOUTS_PER_DAY = 2;

export interface DailyQuest {
  id: string;
  category: 'Physical' | 'Mind' | 'Discipline';
  title: string;
  completed: boolean;
}

export interface SideChallenge {
  id: string;
  title: string;
  totalDays: number;
  currentDay: number;
  completed: boolean;
  lastLogDate?: string;
}

interface ChallengesData {
  xp: number;
  lastResetDate: string;
  dailyQuests: DailyQuest[];
  sideChallenges: SideChallenge[];
  lastWorkoutDate: string;
  workoutsLoggedToday: number;
}

const DEFAULT_QUESTS: DailyQuest[] = [
  { id: 'q1', category: 'Physical', title: 'Strength Session / 8k Steps', completed: false },
  { id: 'q2', category: 'Mind', title: '15 Min Reading / Deep Work', completed: false },
  { id: 'q3', category: 'Discipline', title: 'Cold Rinse / Screen-Free', completed: false },
];

const DEFAULT_SIDE_CHALLENGES: SideChallenge[] = [
  { id: 'sc1', title: '7-Day Cold Water Protocol', totalDays: 7, currentDay: 0, completed: false },
  { id: 'sc2', title: '3-Day Dopamine Fast', totalDays: 3, currentDay: 0, completed: false },
  { id: 'sc3', title: '100 Pushup Benchmark', totalDays: 1, currentDay: 0, completed: false },
];

const DEFAULT_DATA: ChallengesData = {
  xp: 0,
  lastResetDate: '',
  dailyQuests: DEFAULT_QUESTS,
  sideChallenges: DEFAULT_SIDE_CHALLENGES,
  lastWorkoutDate: '',
  workoutsLoggedToday: 0,
};

function isDailyQuest(raw: unknown): raw is DailyQuest {
  if (!raw || typeof raw !== 'object') return false;
  const q = raw as Partial<DailyQuest>;
  return (
    typeof q.id === 'string' &&
    (q.category === 'Physical' || q.category === 'Mind' || q.category === 'Discipline') &&
    typeof q.title === 'string' &&
    typeof q.completed === 'boolean'
  );
}

function isSideChallenge(raw: unknown): raw is SideChallenge {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as Partial<SideChallenge>;
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.totalDays === 'number' &&
    typeof c.currentDay === 'number' &&
    typeof c.completed === 'boolean'
  );
}

function isChallengesData(raw: unknown): raw is ChallengesData {
  if (!raw || typeof raw !== 'object') return false;
  const d = raw as Partial<ChallengesData>;
  return (
    typeof d.xp === 'number' &&
    !isNaN(d.xp) &&
    typeof d.lastResetDate === 'string' &&
    Array.isArray(d.dailyQuests) &&
    d.dailyQuests.every(isDailyQuest) &&
    Array.isArray(d.sideChallenges) &&
    d.sideChallenges.every(isSideChallenge)
  );
}

function normalizeChallenges(data: ChallengesData, today: string): ChallengesData {
  const resetDay = data.lastResetDate !== today;
  const workoutDay = data.lastWorkoutDate !== today;
  return {
    ...data,
    dailyQuests: resetDay || !data.dailyQuests?.length ? DEFAULT_QUESTS : data.dailyQuests,
    sideChallenges: data.sideChallenges?.length ? data.sideChallenges : DEFAULT_SIDE_CHALLENGES,
    lastResetDate: today,
    lastWorkoutDate: today,
    workoutsLoggedToday: resetDay || workoutDay ? 0 : data.workoutsLoggedToday ?? 0,
  };
}

interface ChallengesContextType {
  data: ChallengesData;
  currentTier: typeof TIERS[0];
  nextTier: typeof TIERS[0] | null;
  completeDailyQuest: (id: string) => Promise<void>;
  logWorkout: (type: string, duration: number) => Promise<boolean>;
  progressSideChallenge: (id: string) => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ChallengesData>(DEFAULT_DATA);

  const dataRef = useRef<ChallengesData>(DEFAULT_DATA);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistData = useCallback(
    async (updater: (prev: ChallengesData) => ChallengesData): Promise<void> => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      const write = persistQueueRef.current.then(() =>
        saveEnvelopedObject(STORAGE_KEY, isChallengesData, next)
      );
      persistQueueRef.current = write.then(
        () => undefined,
        (err: unknown) => {
          console.warn('[ChallengesContext] Failed to persist challenges data:', err);
        }
      );
      await write;
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const loaded = await loadEnvelopedObject(STORAGE_KEY, isChallengesData);
        const today = getLocalDateKey(Date.now());
        const base = loaded.object ?? DEFAULT_DATA;
        const parsed = normalizeChallenges(base, today);
        if (cancelled) return;
        dataRef.current = parsed;
        setData(parsed);
        if (loaded.status !== 'ok' || loaded.object?.lastResetDate !== today) {
          await saveEnvelopedObject(STORAGE_KEY, isChallengesData, parsed);
        }
      } catch (err) {
        console.warn('Failed to load challenges data', err);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const addXp = async (amount: number) => {
    await persistData((prev) => ({ ...prev, xp: prev.xp + amount }));
  };

  const completeDailyQuest = async (id: string) => {
    const quest = dataRef.current.dailyQuests.find((q) => q.id === id);
    if (!quest || quest.completed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await persistData((prev) => ({
      ...prev,
      dailyQuests: prev.dailyQuests.map((q) =>
        q.id === id ? { ...q, completed: true } : q
      ),
      xp: prev.xp + 25,
    }));
  };

  const logWorkout = async (type: string, duration: number): Promise<boolean> => {
    if (!type || !Number.isFinite(duration) || duration < MIN_WORKOUT_MINUTES) {
      return false;
    }
    const today = getLocalDateKey(Date.now());
    const current = dataRef.current;
    const loggedToday =
      current.lastWorkoutDate === today ? current.workoutsLoggedToday : 0;
    if (loggedToday >= MAX_WORKOUTS_PER_DAY) return false;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await persistData((prev) => {
      const count = prev.lastWorkoutDate === today ? prev.workoutsLoggedToday : 0;
      if (count >= MAX_WORKOUTS_PER_DAY) return prev;
      return {
        ...prev,
        xp: prev.xp + 50,
        lastWorkoutDate: today,
        workoutsLoggedToday: count + 1,
      };
    });
    return true;
  };

  const progressSideChallenge = async (id: string) => {
    const today = getLocalDateKey(Date.now());
    const challenge = dataRef.current.sideChallenges.find((c) => c.id === id);
    if (!challenge || challenge.completed) return;

    if (challenge.lastLogDate === today) return; // already progressed today

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCurrentDay = challenge.currentDay + 1;
    const completed = newCurrentDay >= challenge.totalDays;
    const xpGained = completed ? 100 : 10; // small bump for daily progress, large for completion

    await persistData((prev) => ({
      ...prev,
      sideChallenges: prev.sideChallenges.map((c) =>
        c.id === id ? { ...c, currentDay: newCurrentDay, completed, lastLogDate: today } : c
      ),
      xp: prev.xp + xpGained,
    }));
  };

  // Tiers resolved through the single source of truth above.
  const { currentTier, nextTier } = resolveChallengeTier(data.xp);

  return (
    <ChallengesContext.Provider value={{ data, currentTier, nextTier, completeDailyQuest, logWorkout, progressSideChallenge }}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error('useChallenges must be used within ChallengesProvider');
  return ctx;
}
