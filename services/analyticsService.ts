import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStateData, RelapseRecord } from '@/types/app';
import { getLocalDateKey } from './chronometerEngine';

export type TimeRange = '7D' | '30D' | '90D' | 'ALL';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface IncidentRecord {
  timestamp: string; // ISO string
  triggerNotes?: string;
}

export interface AnalyticsData {
  commitmentRate: number;
  cleanDays: number;
  totalDaysLogged: number;
  currentStreakDays: number;
  recordStreakDays: number;
  emergencySessions: number;
  timeOfDayRisk: {
    morning: number;
    afternoon: number;
    evening: number;
    lateNight: number;
  };
  dayOfWeekRisk: number[];
  trendlineData: number[];
}

const EMERGENCY_SESSIONS_KEY = '@sovereign/emergency_sessions';
/** Key used before the honest reframe; migrated once, then removed. */
const LEGACY_SHIELD_ACTIVATIONS_KEY = '@sovereign/shield_activations';

/**
 * Records one completed emergency-button press. The counter was previously
 * never incremented anywhere, so the analytics card always showed a stale
 * value; it is now wired to the real dashboard emergency button.
 */
export async function recordEmergencySession(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(EMERGENCY_SESSIONS_KEY);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    await AsyncStorage.setItem(EMERGENCY_SESSIONS_KEY, String(count + 1));
  } catch (err) {
    console.warn('Failed to record emergency session:', err);
  }
}

export async function fetchAnalytics(range: TimeRange, state: AppStateData | null): Promise<AnalyticsData> {
  let incidents: IncidentRecord[] = [];
  let emergencySessions = 0;
  let currentStreakMs = 0;
  let recordStreakMs = 0;
  let firstLogDate = Date.now() - (7 * 24 * 60 * 60 * 1000);

  try {
    let raw = await AsyncStorage.getItem(EMERGENCY_SESSIONS_KEY);
    if (raw === null) {
      // One-time migration from the pre-reframe key.
      raw = await AsyncStorage.getItem(LEGACY_SHIELD_ACTIVATIONS_KEY);
      if (raw !== null) {
        await AsyncStorage.setItem(EMERGENCY_SESSIONS_KEY, raw);
        await AsyncStorage.removeItem(LEGACY_SHIELD_ACTIVATIONS_KEY);
      }
    }
    if (raw) emergencySessions = parseInt(raw, 10) || 0;
  } catch (err) {
    console.warn('Failed to load emergency sessions:', err);
  }

  if (state) {
    incidents = state.relapseHistory.map((r: RelapseRecord) => ({
      timestamp: new Date(r.timestamp).toISOString(),
      triggerNotes: r.notes || r.trigger,
    }));
    
    currentStreakMs = Date.now() - state.profile.startDate;
    recordStreakMs = state.profile.bestRecordMs || 0;
    
    const earliestRelapse = state.relapseHistory.length > 0 
      ? state.relapseHistory[state.relapseHistory.length - 1].timestamp 
      : state.profile.startDate;
    firstLogDate = Math.min(earliestRelapse, state.profile.startDate);
  }

  const now = Date.now();
  let rangeMs = 0;
  if (range === '7D') rangeMs = 7 * 24 * 60 * 60 * 1000;
  else if (range === '30D') rangeMs = 30 * 24 * 60 * 60 * 1000;
  else if (range === '90D') rangeMs = 90 * 24 * 60 * 60 * 1000;

  const cutoff = rangeMs === 0 ? 0 : now - rangeMs;

  const validIncidents = incidents.filter(inc => {
    const t = new Date(inc.timestamp).getTime();
    return t >= cutoff;
  });

  const timeOfDayRisk = { morning: 0, afternoon: 0, evening: 0, lateNight: 0 };
  const dayOfWeekRisk = [0, 0, 0, 0, 0, 0, 0];

  validIncidents.forEach(inc => {
    const d = new Date(inc.timestamp);
    const h = d.getHours();
    dayOfWeekRisk[d.getDay()]++;

    if (h >= 5 && h < 12) timeOfDayRisk.morning++;
    else if (h >= 12 && h < 17) timeOfDayRisk.afternoon++;
    else if (h >= 17 && h < 22) timeOfDayRisk.evening++;
    else timeOfDayRisk.lateNight++;
  });

  const actualStartMs = rangeMs === 0 ? firstLogDate : cutoff;
  const totalDaysLogged = Math.max(1, Math.ceil((now - actualStartMs) / DAY_MS));
  // Local-date day keys (not UTC slices) so "today" matches the rest of the app.
  const slipDays = new Set(
    validIncidents.map((i) => getLocalDateKey(new Date(i.timestamp).getTime()))
  ).size;
  const cleanDays = Math.max(0, totalDaysLogged - slipDays);
  const commitmentRate = totalDaysLogged > 0 ? (cleanDays / totalDaysLogged) * 100 : 100;

  const daysInChart = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : 30;

  // Deterministic momentum trendline: for each chart day, the trailing 7-day
  // commitment rate (clamped to the logging start) computed from real incident
  // dates. No randomness — the chart is stable across refreshes and only moves
  // when the underlying data does.
  const incidentDayKeys = new Set(
    validIncidents.map((i) => getLocalDateKey(new Date(i.timestamp).getTime()))
  );

  const trendlineData = Array.from({ length: daysInChart }).map((_, i) => {
    const dayDate = new Date(now);
    dayDate.setHours(0, 0, 0, 0);
    dayDate.setDate(dayDate.getDate() - (daysInChart - 1 - i));
    const dayStartMs = dayDate.getTime();

    const windowStartMs = Math.max(firstLogDate, dayStartMs - 6 * DAY_MS);
    const windowDays = Math.max(1, Math.round((dayStartMs - windowStartMs) / DAY_MS) + 1);

    let windowSlipDays = 0;
    for (let d = 0; d < windowDays; d++) {
      if (incidentDayKeys.has(getLocalDateKey(dayStartMs - d * DAY_MS))) {
        windowSlipDays++;
      }
    }

    return Math.max(0, Math.min(100, ((windowDays - windowSlipDays) / windowDays) * 100));
  });

  return {
    commitmentRate,
    cleanDays,
    totalDaysLogged,
    currentStreakDays: Math.floor(currentStreakMs / (24 * 60 * 60 * 1000)),
    recordStreakDays: Math.floor(recordStreakMs / (24 * 60 * 60 * 1000)),
    emergencySessions,
    timeOfDayRisk,
    dayOfWeekRisk,
    trendlineData,
  };
}
