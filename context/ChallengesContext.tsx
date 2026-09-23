import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getLocalDateKey } from '../services/chronometerEngine';
import { TIERS, resolveChallengeTier } from '../services/challengeTiers';
// Re-exported so any existing importer of the context module keeps working.
export { TIERS, resolveChallengeTier };

const STORAGE_KEY = '@sovereign/challenges_data';

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
};

interface ChallengesContextType {
  data: ChallengesData;
  currentTier: typeof TIERS[0];
  nextTier: typeof TIERS[0] | null;
  completeDailyQuest: (id: string) => Promise<void>;
  logWorkout: (type: string, duration: number) => Promise<void>;
  progressSideChallenge: (id: string) => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ChallengesData>(DEFAULT_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mutable mirror of the latest committed data + serialized persist queue.
  // Same stale-closure protection as AppDataContext: concurrent actions (quest
  // complete + XP award) can never overwrite each other.
  const dataRef = useRef<ChallengesData>(DEFAULT_DATA);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistData = useCallback(
    async (updater: (prev: ChallengesData) => ChallengesData): Promise<void> => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      const write = persistQueueRef.current.then(() =>
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      );
      persistQueueRef.current = write.catch((err) => {
        console.warn('[ChallengesContext] Failed to persist challenges data:', err);
      });
      await write;
    },
    []
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let parsed: ChallengesData = stored ? JSON.parse(stored) : DEFAULT_DATA;

      const today = getLocalDateKey(Date.now());
      if (parsed.lastResetDate !== today) {
        // Reset daily quests
        parsed.dailyQuests = DEFAULT_QUESTS;
        parsed.lastResetDate = today;
      }

      // Ensure schema syncs if we add new quests/challenges in code
      if (!parsed.dailyQuests || parsed.dailyQuests.length === 0) parsed.dailyQuests = DEFAULT_QUESTS;
      if (!parsed.sideChallenges || parsed.sideChallenges.length === 0) parsed.sideChallenges = DEFAULT_SIDE_CHALLENGES;

      dataRef.current = parsed;
      setData(parsed);
      setIsLoaded(true);
      if (stored !== JSON.stringify(parsed)) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (err) {
      console.warn('Failed to load challenges data', err);
      setIsLoaded(true);
    }
  };

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

  const logWorkout = async (type: string, duration: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addXp(50);
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

  if (!isLoaded) return null;

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
