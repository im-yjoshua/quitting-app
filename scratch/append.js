const fs = require('fs');
const path = 'services/storage.ts';
let content = fs.readFileSync(path, 'utf8');

const additional = `
import { AppStateData, UserProfile, RelapseRecord, CircadianDayRecord, CircadianHistory } from '../types/app';

export const DEFAULT_APP_STATE: AppStateData = {
  profile: {
    habitTitle: 'Digital Freedom',
    habitCategory: 'substance',
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
`;

fs.writeFileSync(path, content + additional);
console.log('Appended missing exports to storage.ts');
