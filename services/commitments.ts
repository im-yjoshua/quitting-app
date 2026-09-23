import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  loadEnvelopedObject,
  saveEnvelopedObject,
} from './storage';

/**
 * App Commitments — the honest successor to the old "Shield" feature.
 *
 * What this is: a personal commitment list. The user declares which apps they
 * are committing to avoid, and the app tracks that pledge. Sovereign cannot
 * block, limit, or shield other apps — iOS grants this app no app-blocking
 * entitlements — so nothing here claims otherwise. Users who want enforced
 * limits are guided to set up iOS Screen Time themselves.
 *
 * What this is not: OS-level app blocking, Screen Time authorization, or an
 * adult-content web filter. The legacy "shield" booleans never did any of
 * those things; they only flipped local flags.
 */

export const COMMITMENTS_STORAGE_KEY = '@sovereign/app_commitments';
/** Key used by the retired shield implementation. Read once, then removed. */
const LEGACY_SHIELD_STORAGE_KEY = '@sovereign_shield_state';

export const DEFAULT_EMERGENCY_SESSION_MINUTES = 15;
const MAX_TRIGGER_APPS = 20;
const MAX_APP_NAME_LENGTH = 40;

export interface AppCommitmentState {
  /** User-declared names of apps they commit to avoid. Never enforced by the app. */
  triggerApps: string[];
  /** Whether avoiding adult content is part of the user's daily commitment. */
  adultContentCommitmentEnabled: boolean;
  /** A 15-minute urge circuit-breaker session is currently running. */
  emergencySessionActive: boolean;
  emergencySessionEndsAt: number | null;
}

const DEFAULT_COMMITMENT_STATE: AppCommitmentState = {
  triggerApps: [],
  adultContentCommitmentEnabled: true,
  emergencySessionActive: false,
  emergencySessionEndsAt: null,
};

export function isCommitmentState(raw: unknown): raw is AppCommitmentState {
  if (typeof raw !== 'object' || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    Array.isArray(o.triggerApps) &&
    o.triggerApps.every((n) => typeof n === 'string') &&
    typeof o.adultContentCommitmentEnabled === 'boolean' &&
    typeof o.emergencySessionActive === 'boolean' &&
    (o.emergencySessionEndsAt === null ||
      typeof o.emergencySessionEndsAt === 'number')
  );
}

/** Shape of the retired shield state, for one-time migration. */
interface LegacyShieldState {
  isAuthorized?: unknown;
  isActive?: unknown;
  activeUntil?: unknown;
  shieldedAppCount?: unknown;
  adultContentFilterEnabled?: unknown;
}

/**
 * One-time migration from the retired shield storage.
 *
 * Honest reinterpretation of the old fields:
 * - `adultContentFilterEnabled` -> `adultContentCommitmentEnabled`: this was a
 *   real user preference (default true), so it carries over. It never filtered
 *   anything; now it plainly means "adult content is part of my commitment".
 * - `isActive` / `activeUntil` -> emergency session fields: the 15-minute
 *   timer was real behavior (it drove the EmergencyModal countdown), so an
 *   unexpired session carries over.
 * - `isAuthorized` is dropped: the "authorization" was simulated (it just set
 *   a boolean) and has no meaning to preserve.
 * - `shieldedAppCount` is dropped: the count was simulated (toggled 0 <-> 3)
 *   and no app names were ever stored, so there is nothing real to migrate.
 */
async function migrateFromLegacyShield(): Promise<AppCommitmentState | null> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(LEGACY_SHIELD_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let legacy: LegacyShieldState | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      legacy = parsed as LegacyShieldState;
    }
  } catch {
    legacy = null;
  }

  const migrated: AppCommitmentState = { ...DEFAULT_COMMITMENT_STATE };
  if (legacy) {
    if (typeof legacy.adultContentFilterEnabled === 'boolean') {
      migrated.adultContentCommitmentEnabled = legacy.adultContentFilterEnabled;
    }
    if (
      legacy.isActive === true &&
      typeof legacy.activeUntil === 'number' &&
      legacy.activeUntil > Date.now()
    ) {
      migrated.emergencySessionActive = true;
      migrated.emergencySessionEndsAt = legacy.activeUntil;
    }
  }

  await saveEnvelopedObject(
    COMMITMENTS_STORAGE_KEY,
    isCommitmentState,
    migrated
  );
  try {
    await AsyncStorage.removeItem(LEGACY_SHIELD_STORAGE_KEY);
  } catch {
    // Non-fatal: the old key is simply ignored from here on.
  }
  return migrated;
}

async function saveCommitmentState(
  state: AppCommitmentState
): Promise<AppCommitmentState> {
  await saveEnvelopedObject(COMMITMENTS_STORAGE_KEY, isCommitmentState, state);
  return state;
}

/**
 * Loads the current commitment state. Runs the one-time legacy shield
 * migration on first read when no commitment state exists yet.
 */
export async function getCommitmentState(): Promise<AppCommitmentState> {
  const result = await loadEnvelopedObject(
    COMMITMENTS_STORAGE_KEY,
    isCommitmentState
  );
  if (result.object) {
    const state = result.object;
    // Auto-expire a past-due emergency session.
    if (
      state.emergencySessionActive &&
      state.emergencySessionEndsAt !== null &&
      Date.now() >= state.emergencySessionEndsAt
    ) {
      return saveCommitmentState({
        ...state,
        emergencySessionActive: false,
        emergencySessionEndsAt: null,
      });
    }
    return state;
  }
  if (result.status === 'fresh-install') {
    const migrated = await migrateFromLegacyShield();
    if (migrated) return migrated;
  }
  return { ...DEFAULT_COMMITMENT_STATE };
}

function sanitizeAppName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0 || trimmed.length > MAX_APP_NAME_LENGTH) return null;
  return trimmed;
}

/**
 * Replaces the user's trigger-app commitment list. Names are user-declared
 * labels for personal accountability — the app does not (and cannot) enforce
 * them at the OS level.
 */
export async function setTriggerApps(
  apps: string[]
): Promise<AppCommitmentState> {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const app of apps) {
    const name = sanitizeAppName(app);
    if (name === null) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push(name);
    if (clean.length >= MAX_TRIGGER_APPS) break;
  }
  const state = await getCommitmentState();
  return saveCommitmentState({ ...state, triggerApps: clean });
}

/**
 * Toggles whether avoiding adult content is part of the user's commitment.
 * This is a pledge flag shown in the commitment UI — it does not filter web
 * content; iOS Screen Time's Content Restrictions do that (see the guided
 * setup).
 */
export async function setAdultContentCommitment(
  enabled: boolean
): Promise<boolean> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const state = await getCommitmentState();
    await saveCommitmentState({
      ...state,
      adultContentCommitmentEnabled: enabled,
    });
    return enabled;
  } catch (err) {
    console.warn('[Commitments] Failed to set adult content commitment:', err);
    return false;
  }
}

/**
 * Starts a 15-minute emergency urge session (the circuit-breaker breathing
 * flow). This is a self-directed timer, not app blocking.
 */
export async function startEmergencySession(
  durationMinutes: number = DEFAULT_EMERGENCY_SESSION_MINUTES
): Promise<{ success: boolean; endsAt: number }> {
  const endsAt = Date.now() + durationMinutes * 60 * 1000;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const state = await getCommitmentState();
    await saveCommitmentState({
      ...state,
      emergencySessionActive: true,
      emergencySessionEndsAt: endsAt,
    });
    return { success: true, endsAt };
  } catch (err) {
    console.warn('[Commitments] Failed to start emergency session:', err);
    return { success: false, endsAt };
  }
}

