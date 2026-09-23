import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider, useAppData } from '@/context/AppDataContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { Palette } from '@/constants/theme';
import { BiometricGateModal } from '@/components/auth/BiometricGateModal';
import { PrivacyCurtain } from '@/components/auth/PrivacyCurtain';
import { AnimatedSplashOverlay } from '@/components/AnimatedSplashOverlay';
import { isAuthenticationInProgress } from '@/services/biometrics';
import * as Notifications from 'expo-notifications';
import { scheduleDailyCheckIn } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

function RootNavigationLayout() {
  const { state, isLoading, cleanDurationMs, isPaywallVisible, closePaywall } = useAppData();
  const { colors, theme } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const isBiometricEnforced = Boolean(state.profile.biometricsEnabled);

  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [isPrivacyCurtainVisible, setIsPrivacyCurtainVisible] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(0);
  const isBiometricLockedRef = useRef(isBiometricLocked);
  isBiometricLockedRef.current = isBiometricLocked;

  // Initial cold-launch biometric lock gate
  useEffect(() => {
    if (!isLoading && isBiometricEnforced) {
      setIsBiometricLocked(true);
      setIsPrivacyCurtainVisible(true);
    }
  }, [isLoading, isBiometricEnforced]);

  // AppState security monitor: App Switcher privacy curtain + Biometric Enclave re-engagement
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prevAppState = appState.current;
      const isExternalTransition = !isAuthenticationInProgress();

      if (nextAppState === 'inactive') {
        if (isExternalTransition) {
          // Immediately occlude screen before OS multitasking snapshot is taken
          setIsPrivacyCurtainVisible(true);
        }
      } else if (nextAppState === 'background') {
        if (isExternalTransition) {
          setIsPrivacyCurtainVisible(true);
          if (isBiometricEnforced) {
            setIsBiometricLocked(true);
          }
        }
      } else if (nextAppState === 'active') {
        const timeSinceLastUnlock = Date.now() - lastUnlockTimeRef.current;

        // If returning from background, re-engage lock if biometric gate is enabled
        if (isExternalTransition && timeSinceLastUnlock > 2000) {
          if (prevAppState === 'background') {
            if (isBiometricEnforced) {
              setIsBiometricLocked(true);
              setIsPrivacyCurtainVisible(true);
            } else {
              setIsPrivacyCurtainVisible(false);
            }
          } else {
            // Dismissed Control Center, notification shade, or native dialog
            if (!isBiometricLockedRef.current) {
              setIsPrivacyCurtainVisible(false);
            }
          }
        } else {
          // Resumed from biometric prompt or within grace period
          if (!isBiometricLockedRef.current) {
            setIsPrivacyCurtainVisible(false);
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isBiometricEnforced]);

  // Route gate: unboarded users must complete onboarding first
  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const inOnboardingGroup = segments[0] === '(onboarding)';
    const isOnboarded = state.profile.isOnboarded;

    if (!isOnboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)/splash');
    } else if (isOnboarded && inOnboardingGroup) {
      router.replace('/(drawer)');
    }
  }, [isLoading, state.profile.isOnboarded, segments, router, rootNavigationState?.key]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Synchronize daily check-in notifications when streak is active
  useEffect(() => {
    if (!isLoading && state.profile.isOnboarded) {
      scheduleDailyCheckIn(9, 0);
    }
  }, [isLoading, state.profile.isOnboarded]);

  // Handle tap on notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      if (state.profile.isOnboarded) {
        router.push('/(drawer)');
      }
    });
    return () => subscription.remove();
  }, [state.profile.isOnboarded, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'ios_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack>

      {/* Multitasking Privacy Curtain to obscure OS screenshots */}
      <PrivacyCurtain visible={isPrivacyCurtainVisible && !isBiometricLocked} />

      {/* Air-Gapped Biometric Lock Shield */}
      <BiometricGateModal
        visible={isBiometricLocked}
        onSuccess={() => {
          lastUnlockTimeRef.current = Date.now();
          setIsBiometricLocked(false);
          setIsPrivacyCurtainVisible(false);
        }}
      />

      {isSplashVisible && state.profile.isOnboarded && (
        <AnimatedSplashOverlay
          onReady={!isLoading}
          onComplete={() => setIsSplashVisible(false)}
        />
      )}

      {/* Single global Sovereign paywall, driven by AppDataContext.openPaywall().
          Every premium entry point in the app funnels through this one modal. */}
      <PaywallModal visible={isPaywallVisible} onClose={closePaywall} />

      {/* Storage integrity recovery: shown when this launch's saved data failed
          its integrity check and was quarantined. Plain-language notice with
          explicit restore / start-fresh choices — never a silent reset. */}
      <StorageRecoveryModal />
    </View>
  );
}

import { ChallengesProvider } from '@/context/ChallengesContext';
import { PaywallModal } from '@/components/monetization/PaywallModal';
import { StorageRecoveryModal } from '@/components/storage/StorageRecoveryModal';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppDataProvider>
            <ChallengesProvider>
              <RootNavigationLayout />
            </ChallengesProvider>
          </AppDataProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});