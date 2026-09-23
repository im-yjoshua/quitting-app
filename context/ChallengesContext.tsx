import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@sovereign/challenges_data';

export const TIERS = [
  { level: 1, name: 'Initiate', minXp: 0, colors: ['#94A3B8', '#CBD5E1'] },
  { level: 2, name: 'Vanguard', minXp: 151, colors: ['#2563EB', '#38BDF8'] },
  { level: 3, name: 'Ascendant', minXp: 501, colors: ['#7C3AED', '#C084FC'] },
  { level: 4, name: 'Imperator', minXp: 1201, colors: ['#D97706', '#FDE047'] },
  { level: 5, name: 'Sovereign', minXp: 2501, colors: ['#059669', '#34D399'] },
];

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let parsed: ChallengesData = stored ? JSON.parse(stored) : DEFAULT_DATA;
      
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastResetDate !== today) {
        // Reset daily quests
        parsed.dailyQuests = DEFAULT_QUESTS;
        parsed.lastResetDate = today;
      }
      
      // Ensure schema syncs if we add new quests/challenges in code
      if (!parsed.dailyQuests || parsed.dailyQuests.length === 0) parsed.dailyQuests = DEFAULT_QUESTS;
      if (!parsed.sideChallenges || parsed.sideChallenges.length === 0) parsed.sideChallenges = DEFAULT_SIDE_CHALLENGES;

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

  const saveData = async (newData: ChallengesData) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const addXp = async (amount: number) => {
    const newData = { ...data, xp: data.xp + amount };
    await saveData(newData);
  };

  const completeDailyQuest = async (id: string) => {
    const quest = data.dailyQuests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedQuests = data.dailyQuests.map(q => q.id === id ? { ...q, completed: true } : q);
    
    const newData = { ...data, dailyQuests: updatedQuests, xp: data.xp + 25 };
    await saveData(newData);
  };

  const logWorkout = async (type: string, duration: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addXp(50);
  };

  const progressSideChallenge = async (id: string) => {
    const challenge = data.sideChallenges.find(c => c.id === id);
    if (!challenge || challenge.completed) return;

    const today = new Date().toISOString().split('T')[0];
    if (challenge.lastLogDate === today) return; // already progressed today

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newCurrentDay = challenge.currentDay + 1;
    const completed = newCurrentDay >= challenge.totalDays;

    const updated = data.sideChallenges.map(c => 
      c.id === id ? { ...c, currentDay: newCurrentDay, completed, lastLogDate: today } : c
    );

    const xpGained = completed ? 100 : 10; // small bump for daily progress, large for completion
    
    const newData = { ...data, sideChallenges: updated, xp: data.xp + xpGained };
    await saveData(newData);
  };

  // Determine tiers
  let currentTier = TIERS[0];
  let nextTier: typeof TIERS[0] | null = null;
  
  for (let i = 0; i < TIERS.length; i++) {
    if (data.xp >= TIERS[i].minXp) {
      currentTier = TIERS[i];
      nextTier = TIERS[i + 1] || null;
    } else {
      break;
    }
  }

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
