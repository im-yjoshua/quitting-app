import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * @deprecated Legacy key/value storage (pre-envelope format).
 *
 * Kept only for the dashboard utility cards that still read these keys
 * (JournalCard, TodoListCard, ChallengesCard).
 * Do NOT add new keys here — new persistence belongs in services/storage.ts,
 * which is envelope-backed with checksums, schema versioning, and migration.
 * This module is scheduled for removal once its remaining readers are migrated.
 */

/**
 * Sovereign Centralized Storage Namespace Keys
 */
const STORAGE_KEYS = {
  START_TIMESTAMP: '@sovereign/start_timestamp',
  JOURNAL_ENTRIES: '@sovereign/journal_entries',
  TODOS: '@sovereign/todos',
  CHALLENGES: '@sovereign/challenges',
  THEME_ACCENT: '@sovereign/theme_accent',
} as const;

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
const storage = {
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
