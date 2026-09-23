import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface BreathingSphereModalProps {
  visible: boolean;
  onClose: () => void;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'completed';

const TOTAL_CYCLES = 4;
const PHASE_DURATIONS = {
  inhale: 4000,
  hold: 7000,
  exhale: 8000,
};

export const BreathingSphereModal: React.FC<BreathingSphereModalProps> = ({
  visible,
  onClose,
}) => {
  const { claimChallengeAura } = useAppData();

  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Kinetic drivers
  const sphereScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.2)).current;
  const haloScale = useRef(new Animated.Value(1)).current;

  // Timers and interval tracking
  const activePhaseRef = useRef<BreathPhase>('idle');
  const activeCycleRef = useRef<number>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
    hapticIntervalRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    clearAllTimers();
    activePhaseRef.current = 'idle';
    activeCycleRef.current = 1;
    setPhase('idle');
    setCycleCount(1);
    setSecondsRemaining(4);
    sphereScale.setValue(1);
    haloOpacity.setValue(0.2);
    haloScale.setValue(1);
  }, [clearAllTimers, sphereScale, haloOpacity, haloScale]);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Phase controller loop
  const executePhase = useCallback((nextPhase: BreathPhase) => {
    activePhaseRef.current = nextPhase;
    setPhase(nextPhase);

    if (nextPhase === 'inhale') {
      setSecondsRemaining(4);

      // Sphere expansion animation over 4 seconds
      Animated.parallel([
        Animated.timing(sphereScale, {
          toValue: 1.6,
          duration: PHASE_DURATIONS.inhale,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 0.8,
          duration: PHASE_DURATIONS.inhale,
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1.8,
          duration: PHASE_DURATIONS.inhale,
          useNativeDriver: true,
        }),
      ]).start();

      // Inhale haptics: rising rhythmic pulses
      let pulseCount = 0;
      hapticIntervalRef.current = setInterval(() => {
        pulseCount += 1;
        if (pulseCount <= 4) {
          Haptics.impactAsync(
            pulseCount > 2
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light
          );
        }
      }, 900);

      // Phase countdown
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(1, prev - 1));
      }, 1000);

      // Transition to Hold
      timerRef.current = setTimeout(() => {
        clearAllTimers();
        executePhase('hold');
      }, PHASE_DURATIONS.inhale);
    } else if (nextPhase === 'hold') {
      setSecondsRemaining(7);

      // Metronomic cardiac anchor ticks every 1000ms
      hapticIntervalRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 1000);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(1, prev - 1));
      }, 1000);

      // Transition to Exhale
      timerRef.current = setTimeout(() => {
        clearAllTimers();
        executePhase('exhale');
      }, PHASE_DURATIONS.hold);
    } else if (nextPhase === 'exhale') {
      setSecondsRemaining(8);

      // Sphere contraction animation over 8 seconds
      Animated.parallel([
        Animated.timing(sphereScale, {
          toValue: 1,
          duration: PHASE_DURATIONS.exhale,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity, {
          toValue: 0.2,
          duration: PHASE_DURATIONS.exhale,
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: PHASE_DURATIONS.exhale,
          useNativeDriver: true,
        }),
      ]).start();

      // Exhale haptics: soft downward taps
      hapticIntervalRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1300);

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(1, prev - 1));
      }, 1000);

      // Transition to Next Cycle or Complete
      timerRef.current = setTimeout(() => {
        clearAllTimers();
        if (activeCycleRef.current < TOTAL_CYCLES) {
          activeCycleRef.current += 1;
          setCycleCount((c) => c + 1);
          executePhase('inhale');
        } else {
          activePhaseRef.current = 'completed';
          setPhase('completed');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, PHASE_DURATIONS.exhale);
    }
  }, [clearAllTimers, sphereScale, haloOpacity, haloScale]);

  const startBreathingProtocol = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    activeCycleRef.current = 1;
    setCycleCount(1);
    executePhase('inhale');
  };

  const handleClaimReward = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    await claimChallengeAura('parasympathetic_4_7_8', 50);
    setIsClaiming(false);
    onClose();
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Inhale deeply through nose';
      case 'hold':
        return 'Hold breath and lock diaphragm';
      case 'exhale':
        return 'Slow, continuous exhale through mouth';
      case 'completed':
        return 'Parasympathetic Reset Complete';
      default:
        return 'Sit upright. Lower shoulders. Align breath.';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
      case 'hold':
      case 'exhale':
        return Palette.signalCold;
      case 'completed':
        return Palette.signalSuccess;
      default:
        return Palette.textSecondary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView
          intensity={GlassBlur.intensity.heavy}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.absoluteFill}
        />

        {/* Tactical Ambient Glow */}
        <Animated.View
          style={[
            styles.ambientSphereBackdrop,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
          pointerEvents="none"
        />

        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.kickerRow}>
              <Ionicons name="pulse" size={13} color={Palette.signalCold} />
              <Text style={styles.kicker}>BREATHE AND RELAX</Text>
            </View>
            <Text style={styles.title}>Box Breathing</Text>
            <Text style={styles.subtitle}>
              Slows down your heart rate and helps you feel calm so you don't act on your urges.
            </Text>
          </View>

          {/* Cycle Counter Deck */}
          {phase !== 'idle' && phase !== 'completed' && (
            <View style={styles.cycleBadge}>
              <Text style={styles.cycleBadgeText}>
                CYCLE {cycleCount} OF {TOTAL_CYCLES}
              </Text>
            </View>
          )}

          {/* The Expanding Concentric Breathing Sphere */}
          <View style={styles.sphereContainer}>
            {/* Ambient Specular Halo Ring */}
            <Animated.View
              style={[
                styles.haloRing,
                {
                  opacity: haloOpacity,
                  transform: [{ scale: haloScale }],
                  borderColor: getPhaseColor(),
                },
              ]}
            />

            {/* Main Interactive Glass Sphere */}
            <Animated.View
              style={[
                styles.animatedSphereWrapper,
                { transform: [{ scale: sphereScale }] },
              ]}
            >
              <BlurView
                intensity={GlassBlur.intensity.heavy}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.sphereGlassCore}
              >
                <LinearGradient
                  colors={[getPhaseColor(), 'transparent']}
                  style={styles.absoluteFill}
                  pointerEvents="none"
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <LinearGradient
                  colors={Palette.specularGradient}
                  style={styles.specularBorder}
                  pointerEvents="none"
                />

                {/* Numeric Countdown inside Core */}
                {phase !== 'idle' && phase !== 'completed' ? (
                  <Text style={styles.centerDigit}>{secondsRemaining}</Text>
                ) : (
                  <Ionicons
                    name={phase === 'completed' ? 'checkmark' : 'leaf-outline'}
                    size={36}
                    color={Palette.textPrimary}
                  />
                )}

                <Text style={styles.centerPhaseLabel}>
                  {phase === 'idle' ? 'STANDBY' : phase.toUpperCase()}
                </Text>
              </BlurView>
            </Animated.View>
          </View>

          {/* Instruction Kicker */}
          <View style={styles.instructionContainer}>
            <Text style={[styles.instructionText, { color: getPhaseColor() }]}>
              {getPhaseInstruction()}
            </Text>
          </View>

          {/* Controls Deck */}
          <View style={styles.controlsArea}>
            {phase === 'idle' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={startBreathingProtocol}
                style={styles.primaryActionButton}
              >
                <LinearGradient
                  colors={Palette.cyanGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.absoluteFill}
                />
                <Text style={styles.primaryActionText}>ENGAGE 4-CYCLE PROTOCOL</Text>
              </TouchableOpacity>
            )}

            {phase === 'completed' && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isClaiming}
                onPress={handleClaimReward}
                style={styles.claimButton}
              >
                <LinearGradient
                  colors={Palette.specularGradient}
                  style={styles.absoluteFill}
                />
                <Ionicons name="shield-checkmark" size={18} color={Palette.signalSuccess} style={{ marginRight: 8 }} />
                <Text style={styles.claimButtonText}>CLAIM +50 AURA // RECOVERY SEALED</Text>
              </TouchableOpacity>
            )}

            {/* Abort / Close */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.dismissButton}
            >
              <Text style={styles.dismissButtonText}>
                {phase === 'completed' ? 'DISMISS' : 'ABORT PROTOCOL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SPHERE_BASE_SIZE = 170;

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xxl + 10,
    paddingBottom: Layout.spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ambientSphereBackdrop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Palette.signalColdGlow,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Layout.spacing.xs,
  },
  kicker: {
    ...Typography.kicker,
    color: Palette.signalCold,
    fontSize: 9.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  cycleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
    marginTop: Layout.spacing.sm,
  },
  cycleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.signalCold,
  },
  sphereContainer: {
    width: SPHERE_BASE_SIZE * 1.9,
    height: SPHERE_BASE_SIZE * 1.9,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Layout.spacing.lg,
  },
  haloRing: {
    position: 'absolute',
    width: SPHERE_BASE_SIZE * 1.3,
    height: SPHERE_BASE_SIZE * 1.3,
    borderRadius: (SPHERE_BASE_SIZE * 1.3) / 2,
    borderWidth: 2,
  },
  animatedSphereWrapper: {
    width: SPHERE_BASE_SIZE,
    height: SPHERE_BASE_SIZE,
    borderRadius: SPHERE_BASE_SIZE / 2,
    overflow: 'hidden',
  },
  sphereGlassCore: {
    flex: 1,
    borderRadius: SPHERE_BASE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 9, 14, 0.7)',
    borderWidth: 1.5,
    borderColor: Palette.specularBorderBright,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  centerDigit: {
    ...Typography.chronometerValue,
    fontSize: 48,
    lineHeight: 52,
    color: Palette.textPrimary,
  },
  centerPhaseLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  instructionContainer: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  controlsArea: {
    width: '100%',
    alignItems: 'center',
  },
  primaryActionButton: {
    width: '100%',
    height: 54,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.4)',
    marginBottom: Layout.spacing.sm,
    ...Shadows.subtleSpecular,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textPrimary,
  },
  claimButton: {
    width: '100%',
    height: 54,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    borderWidth: 1,
    borderColor: Palette.signalSuccess,
    marginBottom: Layout.spacing.sm,
    ...Shadows.emeraldGlow,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textPrimary,
  },
  dismissButton: {
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMuted,
  },
});