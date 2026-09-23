import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sovereign Centralized Storage Namespace Keys
 */
export const STORAGE_KEYS = {
  START_TIMESTAMP: '@sovereign/start_timestamp',
  JOURNAL_ENTRIES: '@sovereign/journal_entries',
  TODOS: '@sovereign/todos',
  CHALLENGES: '@sovereign/challenges',
  THEME_ACCENT: '@sovereign/theme_accent',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Core Data Models
 */
export interface JournalEntry {
  id: string;
  timestamp: string; // ISO string or human-formatted time
  title: string;
  body: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  completed: boolean;
  lastCompletedDate?: string; // Format: YYYY-MM-DD
}

/**
 * Generic Safe Storage Wrapper
 */
export const storage = {
  /**
   * Safely retrieve and parse item from AsyncStorage
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`[Storage] Failed to read key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely serialize and persist item to AsyncStorage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to write key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely retrieve raw string value
   */
  async getString(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ?? defaultValue;
    } catch (error) {
      console.warn(`[Storage] Failed to read string key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safely persist raw string value
   */
  async setString(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to write string key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove single key
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[Storage] Failed to remove key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all keys in namespace
   */
  async clearAllSovereignData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      return true;
    } catch (error) {
      console.warn('[Storage] Failed to clear sovereign data:', error);
      return false;
    }
  },
};

/**
 * Typed Convenience Getters & Setters
 */

// 1. Recovery Start Timestamp
export async function getStartTimestamp(): Promise<string> {
  const stored = await storage.getString(STORAGE_KEYS.START_TIMESTAMP);
  if (!stored) {
    const defaultStart = new Date().toISOString();
    await storage.setString(STORAGE_KEYS.START_TIMESTAMP, defaultStart);
    return defaultStart;
  }
  return stored;
}

export async function setStartTimestamp(isoString: string): Promise<boolean> {
  return storage.setString(STORAGE_KEYS.START_TIMESTAMP, isoString);
}

// 2. Journal Reflections
export const DEFAULT_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    timestamp: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    title: 'Baseline Grounding',
    body: 'Initiated the recovery protocol. Mind is vigilant, respiratory baseline calm.',
  },
];

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return storage.get<JournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, DEFAULT_JOURNAL_ENTRIES);
}

export async function saveJournalEntries(entries: JournalEntry[]): Promise<boolean> {
  return storage.set<JournalEntry[]>(STORAGE_KEYS.JOURNAL_ENTRIES, entries);
}

// 3. To-Do Items
export const DEFAULT_TODOS: TodoItem[] = [
  { id: '1', text: '10-minute morning box breathing', completed: false, createdAt: Date.now() - 3600000 },
  { id: '2', text: 'Cold water facial plunge during urge', completed: false, createdAt: Date.now() - 1800000 },
  { id: '3', text: 'Zero screens 45m before sleep', completed: false, createdAt: Date.now() },
];

export async function getTodos(): Promise<TodoItem[]> {
  return storage.get<TodoItem[]>(STORAGE_KEYS.TODOS, DEFAULT_TODOS);
}

export async function saveTodos(todos: TodoItem[]): Promise<boolean> {
  return storage.set<TodoItem[]>(STORAGE_KEYS.TODOS, todos);
}

// 4. Daily Challenges
export const DEFAULT_CHALLENGES: DailyChallenge[] = [
  { id: '1', title: '5-minute deep box breathing', completed: false },
  { id: '2', title: 'Hydrate with 2L clean water', completed: false },
  { id: '3', title: '20-minute physical walk without phone', completed: false },
  { id: '4', title: 'Zero adult / triggering website visits', completed: false },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getChallenges(): Promise<DailyChallenge[]> {
  const challenges = await storage.get<DailyChallenge[]>(STORAGE_KEYS.CHALLENGES, DEFAULT_CHALLENGES);
  const todayStr = getTodayDateString();

  // Reset checkboxes if last completed date is not today
  let hasChanges = false;
  const synchronized = challenges.map((challenge) => {
    if (challenge.completed && challenge.lastCompletedDate !== todayStr) {
      hasChanges = true;
      return { ...challenge, completed: false };
    }
    return challenge;
  });

  if (hasChanges) {
    await storage.set<DailyChallenge[]>(STORAGE_KEYS.CHALLENGES, synchronized);
  }

  return synchronized;
}

export async function saveChallenges(challenges: DailyChallenge[]): Promise<boolean> {
  return storage.set<DailyChallenge[]>(STORAGE_KEYS.CHALLENGES, challenges);
}

// 5. Theme Accent
export async function getThemeAccent(): Promise<string | null> {
  const raw = await storage.getString(STORAGE_KEYS.THEME_ACCENT);
  return raw || null;
}

export async function setThemeAccent(hex: string): Promise<boolean> {
  return storage.setString(STORAGE_KEYS.THEME_ACCENT, hex);
}
import { AppStateData, UserProfile, RelapseRecord, CircadianDayRecord, CircadianHistory } from '../types/app';

export const DEFAULT_APP_STATE: AppStateData = {
  profile: {
    habitTitle: 'Digital Freedom',
    habitCategory: 'digital_distraction',
    startDate: Date.now(),
    bestRecordMs: 0,
    attemptCount: 1,
    weeklyCostEstimated: 0,
    dailyMinutesWasted: 0,
    auraScore: 0,
    tierStatus: 'Initiate',
    isOnboarded: false,
    biometricsEnabled: false,
  },
  relapseHistory: [],
  interventionState: {
    lastCompletedAt: null,
    cooldownUntil: null,
  },
  circadianHistory: {},
  activeChallengeId: null,
};

export async function loadStoredAppState(): Promise<AppStateData> {
  return storage.get<AppStateData>('@sovereign/app_state', DEFAULT_APP_STATE);
}

export async function saveStoredAppState(state: AppStateData): Promise<boolean> {
  return storage.set<AppStateData>('@sovereign/app_state', state);
}

export async function updateUserProfile(updater: (prev: UserProfile) => UserProfile): Promise<UserProfile> {
  const state = await loadStoredAppState();
  const nextProfile = updater(state.profile);
  await saveStoredAppState({ ...state, profile: nextProfile });
  return nextProfile;
}

export async function appendRelapseRecord(record: RelapseRecord): Promise<RelapseRecord[]> {
  const state = await loadStoredAppState();
  const nextHistory = [record, ...state.relapseHistory];
  await saveStoredAppState({ ...state, relapseHistory: nextHistory });
  return nextHistory;
}

export async function updateCircadianDay(dateKey: string, updater: (prev: CircadianDayRecord) => CircadianDayRecord): Promise<CircadianHistory> {
  const state = await loadStoredAppState();
  const existing = state.circadianHistory[dateKey] || {
    dateString: dateKey,
    amCompleted: false,
    amCompletedAt: null,
    pmCompleted: false,
    pmCompletedAt: null,
    multiplierActive: false,
  };
  const updatedDay = updater(existing);
  const nextHistory = { ...state.circadianHistory, [dateKey]: updatedDay };
  await saveStoredAppState({ ...state, circadianHistory: nextHistory });
  return nextHistory;
}

export async function forceFlushPendingWrites(): Promise<void> {
  return Promise.resolve();
}

export async function shareTelemetryExport(): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function importTelemetryBackup(json: string): Promise<{ success: boolean; data?: AppStateData; error?: string }> {
  return { success: false, error: 'Not implemented' };
}
