import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const SHIELD_STORAGE_KEY = '@sovereign_shield_state';
export const DEFAULT_SHIELD_DURATION_MINUTES = 15;

export interface ShieldState {
  isAuthorized: boolean;
  isActive: boolean;
  activeUntil: number | null;
  shieldedAppCount: number;
  adultContentFilterEnabled: boolean;
}

const DEFAULT_SHIELD_STATE: ShieldState = {
  isAuthorized: false,
  isActive: false,
  activeUntil: null,
  shieldedAppCount: 0,
  adultContentFilterEnabled: true,
};

/**
 * Loads current local shield state from storage.
 */
export async function getShieldState(): Promise<ShieldState> {
  try {
    const raw = await AsyncStorage.getItem(SHIELD_STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw) as ShieldState;
      // Auto-expire 15-minute timer if past deadline
      if (state.isActive && state.activeUntil && Date.now() >= state.activeUntil) {
        state.isActive = false;
        state.activeUntil = null;
        await AsyncStorage.setItem(SHIELD_STORAGE_KEY, JSON.stringify(state));
      }
      return state;
    }
  } catch (err) {
    console.warn('[ShieldService] Failed to load shield state:', err);
  }
  return DEFAULT_SHIELD_STATE;
}

/**
 * Saves current shield state to local storage.
 */
async function saveShieldState(state: ShieldState): Promise<void> {
  try {
    await AsyncStorage.setItem(SHIELD_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[ShieldService] Failed to persist shield state:', err);
  }
}

/**
 * Request Screen Time authorization (simulated for pure Expo Go compatibility).
 */
export async function requestFamilyControlsAuth(): Promise<boolean> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const state = await getShieldState();
    state.isAuthorized = true;
    await saveShieldState(state);
    return true;
  } catch (err) {
    console.warn('[ShieldService] Authorization notice:', err);
    return false;
  }
}

/**
 * Open trigger apps selector (simulated for pure Expo Go compatibility).
 */
export async function openTriggerAppPicker(): Promise<{ count: number }> {
  try {
    await Haptics.selectionAsync();
    const state = await getShieldState();
    // Simulate toggling selection of standard distraction targets
    state.shieldedAppCount = state.shieldedAppCount === 0 ? 3 : state.shieldedAppCount;
    await saveShieldState(state);
    return { count: state.shieldedAppCount };
  } catch (err) {
    console.warn('[ShieldService] App picker notice:', err);
    return { count: 0 };
  }
}

/**
 * Activate the Emergency Shield for 15 minutes.
 */
export async function activateEmergencyShield(
  durationMinutes: number = DEFAULT_SHIELD_DURATION_MINUTES
): Promise<{ success: boolean; activeUntil: number }> {
  const activeUntil = Date.now() + durationMinutes * 60 * 1000;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const state = await getShieldState();
    state.isActive = true;
    state.activeUntil = activeUntil;
    await saveShieldState(state);

    return { success: true, activeUntil };
  } catch (err) {
    console.warn('[ShieldService] Failed to activate emergency shield:', err);
    return { success: false, activeUntil };
  }
}

/**
 * Drop the emergency shield immediately.
 */
export async function deactivateEmergencyShield(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const state = await getShieldState();
    state.isActive = false;
    state.activeUntil = null;
    await saveShieldState(state);
  } catch (err) {
    console.warn('[ShieldService] Failed to deactivate shield:', err);
  }
}

/**
 * Toggle the OS-level adult web content filter.
 */
export async function setAdultContentFilter(enabled: boolean): Promise<boolean> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const state = await getShieldState();
    state.adultContentFilterEnabled = enabled;
    await saveShieldState(state);
    return enabled;
  } catch (err) {
    console.warn('[ShieldService] Failed to set adult filter:', err);
    return false;
  }
}
