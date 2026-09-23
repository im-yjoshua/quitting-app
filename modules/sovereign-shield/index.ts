import { requireNativeModule } from 'expo-modules-core';

export interface NativeShieldStatus {
  isActive: boolean;
  appCount: number;
  isWebFilterActive: boolean;
}

export interface SovereignShieldNativeModule {
  requestAuthorizationAsync(): Promise<boolean>;
  isAuthorizedAsync(): Promise<boolean>;
  presentAppPickerAsync(): Promise<number>;
  activateShieldAsync(durationMinutes: number): Promise<boolean>;
  dropShieldAsync(): Promise<boolean>;
  setAdultContentFilterAsync(enabled: boolean): Promise<boolean>;
  getShieldStatusAsync(): Promise<NativeShieldStatus>;
}

let nativeModule: SovereignShieldNativeModule | null = null;

try {
  nativeModule = requireNativeModule<SovereignShieldNativeModule>('SovereignShield');
} catch {
  // Graceful fallback for Expo Go / simulator without custom build
  nativeModule = null;
}

export default nativeModule;
