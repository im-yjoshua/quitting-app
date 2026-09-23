import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  authenticateLocalOwner,
  checkBiometricCapability,
  BiometricStatus,
} from '../../services/biometrics';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface BiometricGateModalProps {
  visible: boolean;
  onSuccess: () => void;
}

type AuthPhase = 'scanning' | 'failed' | 'unlocked';

export const BiometricGateModal: React.FC<BiometricGateModalProps> = ({
  visible,
  onSuccess,
}) => {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('scanning');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const isAuthenticatingRef = useRef(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const mountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kinetic Shared Values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.94);
  const ambientScale = useSharedValue(1);
  const ambientOpacity = useSharedValue(0.12);
  const radarScale = useSharedValue(0.85);
  const radarOpacity = useSharedValue(0);
  const beaconShakeX = useSharedValue(0);
  const beaconScale = useSharedValue(1);
  const verifyingOpacity = useSharedValue(1);
  const retryButtonOpacity = useSharedValue(0);
  const retryButtonTranslateY = useSharedValue(16);

  // Kinetic drivers for scanning loops
  const startScanningKinetics = useCallback(() => {
    // Ambient atmospheric breathing loop
    ambientScale.value = withRepeat(
      withTiming(1.2, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    ambientOpacity.value = withRepeat(
      withTiming(0.24, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Continuous specular radar ripple loop
    radarScale.value = 0.85;
    radarOpacity.value = 0;
    radarScale.value = withRepeat(
      withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    radarOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 250 }),
        withTiming(0, { duration: 1750, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    );
  }, [ambientScale, ambientOpacity, radarScale, radarOpacity]);

  const stopRadarKinetics = useCallback(() => {
    radarOpacity.value = withTiming(0, { duration: 150 });
  }, [radarOpacity]);

  // Biometric handshake executor
  const executeAuth = useCallback(async () => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    setAuthPhase('scanning');

    // Ensure verifying pill is visible and retry button is hidden
    verifyingOpacity.value = withTiming(1, { duration: 200 });
    retryButtonOpacity.value = withTiming(0, { duration: 150 });
    retryButtonTranslateY.value = 16;
    startScanningKinetics();

    try {
      const success = await authenticateLocalOwner('Authenticate to access your habit stats');

      if (success) {
        setAuthPhase('unlocked');
        stopRadarKinetics();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Beacon emerald burst pop
        beaconScale.value = withSequence(
          withSpring(1.08, { damping: 12, stiffness: 200 }),
          withTiming(1.0, { duration: 180 })
        );

        // 350ms Graceful perimeter unlock exit sequence
        cardOpacity.value = withTiming(
          0,
          { duration: 350, easing: Easing.in(Easing.quad) }
        );
        cardScale.value = withTiming(1.05, { duration: 350, easing: Easing.out(Easing.quad) });

        setTimeout(() => {
          onSuccess();
        }, 350);
      } else {
        setAuthPhase('failed');
        stopRadarKinetics();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Damped horizontal spring shake sequence on specular beacon
        beaconShakeX.value = withSequence(
          withTiming(-12, { duration: 55 }),
          withTiming(10, { duration: 65 }),
          withTiming(-8, { duration: 65 }),
          withTiming(6, { duration: 65 }),
          withTiming(-3, { duration: 65 }),
          withTiming(0, { duration: 65 })
        );

        // Staggered transition to retry button
        verifyingOpacity.value = withTiming(0, { duration: 180 });
        retryButtonOpacity.value = withTiming(1, { duration: 250 });
        retryButtonTranslateY.value = withSpring(0, { damping: 14, stiffness: 160 });
      }
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, [
    onSuccess,
    verifyingOpacity,
    retryButtonOpacity,
    retryButtonTranslateY,
    startScanningKinetics,
    stopRadarKinetics,
    beaconScale,
    cardOpacity,
    cardScale,
    beaconShakeX,
  ]);

  const executeAuthRef = useRef(executeAuth);
  executeAuthRef.current = executeAuth;

  // Entrance and handshake orchestration
  useEffect(() => {
    if (visible) {
      checkBiometricCapability().then(setBiometricStatus);
      setAuthPhase('scanning');
      cardOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      cardScale.value = withSpring(1.0, { damping: 16, stiffness: 120 });
      startScanningKinetics();

      // 150ms Grace Delay to let the Apple Glass layout visually set before OS dialog appears
      mountTimerRef.current = setTimeout(() => {
        executeAuthRef.current();
      }, 150);
    } else {
      if (mountTimerRef.current) {
        clearTimeout(mountTimerRef.current);
      }
      cardOpacity.value = 0;
      cardScale.value = 0.94;
      beaconShakeX.value = 0;
      beaconScale.value = 1;
      setAuthPhase('scanning');
    }

    return () => {
      if (mountTimerRef.current) {
        clearTimeout(mountTimerRef.current);
      }
    };
  }, [visible, startScanningKinetics, cardOpacity, cardScale, beaconShakeX, beaconScale]);

  const handleRetryPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    executeAuthRef.current();
  }, []);

  // Animated Styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const animatedAmbientStyle = useAnimatedStyle(() => ({
    opacity: ambientOpacity.value,
    transform: [{ scale: ambientScale.value }],
  }));

  const animatedRadarStyle = useAnimatedStyle(() => ({
    opacity: radarOpacity.value,
    transform: [{ scale: radarScale.value }],
  }));

  const animatedBeaconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: beaconShakeX.value },
      { scale: beaconScale.value },
    ],
  }));

  const animatedVerifyingStyle = useAnimatedStyle(() => ({
    opacity: verifyingOpacity.value,
  }));

  const animatedRetryStyle = useAnimatedStyle(() => ({
    opacity: retryButtonOpacity.value,
    transform: [{ translateY: retryButtonTranslateY.value }],
  }));

  // Dynamic visual tokens
  const getAmbientBackgroundColor = () => {
    switch (authPhase) {
      case 'failed':
        return Palette.signalAlertGlow;
      case 'unlocked':
        return Palette.signalSuccessGlow;
      default:
        return Palette.signalColdGlow;
    }
  };

  const getBeaconGradient = () => {
    switch (authPhase) {
      case 'failed':
        return Palette.crimsonGradient;
      case 'unlocked':
        return [Palette.signalSuccessGlow, 'rgba(48, 209, 88, 0.02)'] as const;
      default:
        return Palette.specularGradient;
    }
  };

  const getBeaconIconName = () => {
    switch (authPhase) {
      case 'failed':
        return 'lock-closed' as const;
      case 'unlocked':
        return 'shield-checkmark' as const;
      default:
        if (biometricStatus && !biometricStatus.isEnrolled) {
          return 'keypad-outline' as const;
        }
        return 'finger-print-outline' as const;
    }
  };

  const getBeaconIconColor = () => {
    switch (authPhase) {
      case 'failed':
        return Palette.signalAlert;
      case 'unlocked':
        return Palette.signalSuccess;
      default:
        return Palette.textPrimary;
    }
  };

  const getRadarBorderColor = () => {
    switch (authPhase) {
      case 'failed':
        return Palette.signalAlert;
      case 'unlocked':
        return Palette.signalSuccess;
      default:
        return Palette.signalCold;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Deep frosted glass shield over app canvas */}
        <BlurView
          intensity={GlassBlur.intensity.heavy}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.absoluteFill}
        />

        {/* Ambient atmospheric glow behind the lock center */}
        <Animated.View
          style={[
            styles.ambientGlow,
            animatedAmbientStyle,
            { backgroundColor: getAmbientBackgroundColor() },
          ]}
          pointerEvents="none"
        />

        <Animated.View style={[styles.contentCard, animatedCardStyle]}>
          {/* Lock Icon Specular Beacon with Kinetic Reticle */}
          <View style={styles.beaconPositioner}>
            {/* Concentric specular radar wave */}
            <Animated.View
              style={[
                styles.radarWave,
                animatedRadarStyle,
                { borderColor: getRadarBorderColor() },
              ]}
              pointerEvents="none"
            />

            {/* Specular Beacon Center */}
            <Animated.View
              style={[
                styles.iconBeaconWrapper,
                animatedBeaconStyle,
                authPhase === 'failed' && styles.beaconFailedBorder,
                authPhase === 'unlocked' && styles.beaconUnlockedBorder,
              ]}
            >
              <BlurView
                intensity={GlassBlur.intensity.standard}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.iconBeacon}
              >
                <LinearGradient
                  colors={getBeaconGradient()}
                  style={styles.absoluteFill}
                  pointerEvents="none"
                />
                <Ionicons
                  name={getBeaconIconName()}
                  size={42}
                  color={getBeaconIconColor()}
                />
              </BlurView>
            </Animated.View>
          </View>

          {/* Typography Stack */}
          <Text
            style={[
              styles.kicker,
              authPhase === 'failed' && styles.kickerFailed,
              authPhase === 'unlocked' && styles.kickerUnlocked,
            ]}
          >
            {authPhase === 'unlocked'
              ? 'IDENTITY VERIFIED'
              : authPhase === 'failed'
              ? 'NOT RECOGNIZED'
              : biometricStatus && !biometricStatus.isEnrolled
              ? 'ENTER YOUR PASSCODE'
              : 'UNLOCK TO CONTINUE'}
          </Text>

          <Text style={styles.title}>
            {authPhase === 'unlocked'
              ? 'Unlocked'
              : authPhase === 'failed'
              ? 'Try Again'
              : 'Locked'}
          </Text>

          <Text style={styles.subtitle}>
            Your progress and logs are safely stored on this device. Verify your identity to continue.
          </Text>

          {/* Authentication State / Action Deck */}
          <View style={styles.actionContainer}>
            {/* Verifying Pill */}
            <Animated.View
              style={[styles.actionSlot, animatedVerifyingStyle]}
              pointerEvents={authPhase === 'failed' ? 'none' : 'auto'}
            >
              <View style={styles.verifyingPill}>
                <Ionicons
                  name={authPhase === 'unlocked' ? 'shield-checkmark' : 'shield-checkmark-outline'}
                  size={14}
                  color={authPhase === 'unlocked' ? Palette.signalSuccess : Palette.signalCold}
                />
                <Text
                  style={[
                    styles.verifyingText,
                    authPhase === 'unlocked' && styles.verifyingTextUnlocked,
                  ]}
                >
                  {authPhase === 'unlocked'
                    ? 'UNLOCKED'
                    : isAuthenticating
                    ? 'VERIFYING...'
                    : 'WAITING...'}
                </Text>
              </View>
            </Animated.View>

            {/* Staggered Spring Rise Retry Button */}
            <Animated.View
              style={[styles.actionSlot, styles.absoluteFill, animatedRetryStyle]}
              pointerEvents={authPhase === 'failed' ? 'auto' : 'none'}
            >
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleRetryPress}
                style={styles.retryButtonWrapper}
              >
                <BlurView
                  intensity={GlassBlur.intensity.standard}
                  tint={GlassBlur.tint}
                  blurMethod={GlassBlur.blurMethod}
                  style={styles.retryButton}
                >
                  <LinearGradient
                    colors={Palette.specularGradient}
                    style={styles.absoluteFill}
                    pointerEvents="none"
                  />
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={Palette.textPrimary}
                    style={styles.retryIcon}
                  />
                  <Text style={styles.retryButtonText}>
                    {biometricStatus && !biometricStatus.isEnrolled
                      ? 'USE PASSCODE'
                      : 'TRY AGAIN'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  ambientGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  contentCard: {
    width: '100%',
    alignItems: 'center',
  },
  beaconPositioner: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  radarWave: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  iconBeaconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderBright,
    ...Shadows.subtleSpecular,
  },
  beaconFailedBorder: {
    borderColor: Palette.signalAlert,
    ...Shadows.crimsonGlow,
  },
  beaconUnlockedBorder: {
    borderColor: Palette.signalSuccess,
    ...Shadows.emeraldGlow,
  },
  iconBeacon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.glassSurface,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9.5,
    letterSpacing: 2,
    color: Palette.signalCold,
    marginBottom: 6,
  },
  kickerFailed: {
    color: Palette.signalAlert,
  },
  kickerUnlocked: {
    color: Palette.signalSuccess,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.sm,
  },
  actionContainer: {
    width: '100%',
    minHeight: 52,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonWrapper: {
    width: '100%',
    height: 52,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderBright,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.glassSurfaceHover,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textPrimary,
  },
  verifyingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Layout.radius.pill,
    backgroundColor: Palette.glassSurface,
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  verifyingText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textSecondary,
  },
  verifyingTextUnlocked: {
    color: Palette.signalSuccess,
  },
});