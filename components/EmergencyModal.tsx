import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

type BreathingPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

const TOTAL_EMERGENCY_SECONDS = 15 * 60; // 15:00 minutes
const PHASE_DURATION_SECONDS = 4; // 4-4-4-4 Box Breathing
const EXIT_HOLD_DURATION_MS = 5000; // 5 full seconds

const STOIC_GROUNDING_ANCHORS = [
  'Urges peak within 10 minutes. Stay with the breath.',
  'The impulse is a wave. You are the ocean beneath it.',
  'Dopamine receptors resensitize when you refuse the trigger.',
  'Discomfort is the sensation of autonomy returning.',
  'You do not have to negotiate with a passing desire.',
  'Breathe through the friction. The storm always clears.',
  'Every second of discipline rewires the neural circuit.',
];

const PHASE_LABELS: Record<BreathingPhase, { title: string; hint: string }> = {
  inhale: { title: 'INHALE', hint: 'Fill lungs slowly through nose' },
  hold_in: { title: 'HOLD', hint: 'Lungs full • Maintain stillness' },
  exhale: { title: 'EXHALE', hint: 'Slowly release through mouth' },
  hold_out: { title: 'HOLD', hint: 'Lungs empty • Savor stillness' },
};

const NEXT_PHASE_MAP: Record<BreathingPhase, BreathingPhase> = {
  inhale: 'hold_in',
  hold_in: 'exhale',
  exhale: 'hold_out',
  hold_out: 'inhale',
};

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();

  // 15:00 Urge countdown state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_EMERGENCY_SECONDS);

  // Box Breathing state (4-4-4-4)
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('inhale');
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(PHASE_DURATION_SECONDS);

  // Stoic grounding anchor rotation
  const [anchorIndex, setAnchorIndex] = useState<number>(0);

  // High-friction early exit press-and-hold state
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Kinetic Reanimated drivers
  const breathScale = useSharedValue<number>(1);
  const breathOpacity = useSharedValue<number>(0.7);
  const anchorOpacity = useSharedValue<number>(1);

  // Refs for intervals and hold timing
  const mainCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const anchorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const lastHoldHapticRef = useRef<number>(0);

  // Format seconds to mm:ss with tabular padding
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset all state when modal becomes visible or hides
  const resetAllEngines = useCallback(() => {
    setSecondsRemaining(TOTAL_EMERGENCY_SECONDS);
    setBreathingPhase('inhale');
    setPhaseSecondsRemaining(PHASE_DURATION_SECONDS);
    setAnchorIndex(0);
    setHoldProgress(0);
    setIsHolding(false);
    breathScale.value = 1;
    breathOpacity.value = 0.7;
    anchorOpacity.value = 1;

    if (mainCountdownIntervalRef.current) clearInterval(mainCountdownIntervalRef.current);
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    if (anchorIntervalRef.current) clearInterval(anchorIntervalRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    mainCountdownIntervalRef.current = null;
    breathingIntervalRef.current = null;
    anchorIntervalRef.current = null;
    holdIntervalRef.current = null;
  }, [breathScale, breathOpacity, anchorOpacity]);

  // Handle Box Breathing phase transitions
  const triggerPhaseTransition = useCallback((nextPhase: BreathingPhase) => {
    setBreathingPhase(nextPhase);
    setPhaseSecondsRemaining(PHASE_DURATION_SECONDS);

    // Tactile feedback on each phase boundary
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate concentric breathing circle based on phase
    switch (nextPhase) {
      case 'inhale':
        breathScale.value = withTiming(1.24, {
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        breathOpacity.value = withTiming(1.0, { duration: 4000 });
        break;
      case 'hold_in':
        breathScale.value = withTiming(1.28, {
          duration: 4000,
          easing: Easing.sin,
        });
        breathOpacity.value = withTiming(0.9, { duration: 4000 });
        break;
      case 'exhale':
        breathScale.value = withTiming(0.92, {
          duration: 4000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        breathOpacity.value = withTiming(0.65, { duration: 4000 });
        break;
      case 'hold_out':
        breathScale.value = withTiming(0.9, {
          duration: 4000,
          easing: Easing.sin,
        });
        breathOpacity.value = withTiming(0.5, { duration: 4000 });
        break;
    }
  }, [breathScale, breathOpacity]);

  // Main 15:00 countdown and breathing engine lifecycle
  useEffect(() => {
    if (!visible) {
      resetAllEngines();
      return;
    }

    // Initial phase entry haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    triggerPhaseTransition('inhale');

    // 1. 15-Minute Countdown Engine (1 tick per second)
    mainCountdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (mainCountdownIntervalRef.current) clearInterval(mainCountdownIntervalRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Box Breathing 4-4-4-4 Cadence Engine
    let currentPhase: BreathingPhase = 'inhale';
    let phaseSeconds = PHASE_DURATION_SECONDS;

    breathingIntervalRef.current = setInterval(() => {
      phaseSeconds -= 1;
      if (phaseSeconds <= 0) {
        currentPhase = NEXT_PHASE_MAP[currentPhase];
        phaseSeconds = PHASE_DURATION_SECONDS;
        triggerPhaseTransition(currentPhase);
      } else {
        setPhaseSecondsRemaining(phaseSeconds);
      }
    }, 1000);

    // 3. Rotating stoic grounding anchors every 8 seconds
    anchorIntervalRef.current = setInterval(() => {
      anchorOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setAnchorIndex)((prevIndex) => (prevIndex + 1) % STOIC_GROUNDING_ANCHORS.length);
        anchorOpacity.value = withTiming(1, { duration: 400 });
      });
    }, 8000);

    return () => {
      resetAllEngines();
    };
  }, [visible, resetAllEngines, triggerPhaseTransition, anchorOpacity]);

  // Animated styles for breathing concentric ring
  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  const animatedAnchorStyle = useAnimatedStyle(() => ({
    opacity: anchorOpacity.value,
  }));

  // High-Friction Early Exit: Press and Hold 5 Seconds
  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();
    lastHoldHapticRef.current = Date.now();
    setHoldProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(1, elapsed / EXIT_HOLD_DURATION_MS);
      setHoldProgress(progress);

      // Continuous tactile tick feedback every 250ms while pressed
      if (Date.now() - lastHoldHapticRef.current >= 250) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastHoldHapticRef.current = Date.now();
      }

      if (elapsed >= EXIT_HOLD_DURATION_MS) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setIsHolding(false);
        setHoldProgress(1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    }, 40);
  }, [onClose]);

  const handlePressOut = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (!visible) return null;

  const currentPhaseInfo = PHASE_LABELS[breathingPhase];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Strict circuit breaker: Disables native hardware back button navigation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }}
    >
      {/* Full-Screen Blackout Overlay (intensity: 95, tint: 'dark') */}
      <View style={styles.modalRoot}>
        <BlurView intensity={95} tint="dark" style={styles.fullScreenBlur}>
          <View style={styles.safeContainer}>
            {/* Top Status Header */}
            <View style={styles.headerBlock}>
              <View style={styles.warningBadge}>
                <Ionicons name="warning-outline" size={13} color="#FF453A" />
                <Text style={styles.warningBadgeText}>CIRCUIT BREAKER ENGAGED</Text>
              </View>
              <Text style={[styles.kickerText, { color: colors.textSecondary }]}>
                NEUROLOGICAL URGE INTERCEPT
              </Text>
            </View>

            {/* Central 15:00 Countdown Timer */}
            <View style={styles.timerBlock}>
              <Text style={[styles.timerValue, { color: colors.textPrimary }]}>
                {formatTimer(secondsRemaining)}
              </Text>
              <Text style={[styles.timerSub, { color: colors.textSecondary }]}>
                TIME REMAINING IN PEAK URGE SUPPRESSION
              </Text>
            </View>

            {/* Concentric Animated SVG Box Breathing Circle (4-4-4-4) */}
            <View style={styles.breathingContainer}>
              <Animated.View style={[styles.breathingRingWrapper, animatedRingStyle]}>
                <Svg width={230} height={230} viewBox="0 0 230 230">
                  <Defs>
                    <SvgGradient id="emergencyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FF453A" stopOpacity="0.9" />
                      <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.8" />
                    </SvgGradient>
                    <SvgGradient id="outerTrack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                      <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
                    </SvgGradient>
                  </Defs>

                  {/* Outer Guide Ring (Subtle Dashed Track) */}
                  <Circle
                    cx="115"
                    cy="115"
                    r="104"
                    stroke="url(#outerTrack)"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    fill="transparent"
                  />

                  {/* Middle Main Breathing Ring */}
                  <Circle
                    cx="115"
                    cy="115"
                    r="88"
                    stroke="url(#emergencyGlow)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="transparent"
                  />

                  {/* Inner Specular Boundary */}
                  <Circle
                    cx="115"
                    cy="115"
                    r="72"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    fill="rgba(0, 0, 0, 0.4)"
                  />
                </Svg>
              </Animated.View>

              {/* Centered Phase Name & Countdown inside the Ring */}
              <View style={styles.ringCenterContent}>
                <Text style={[styles.phaseTitle, { color: colors.textPrimary }]}>
                  {currentPhaseInfo.title}
                </Text>
                <Text style={[styles.phaseCountdown, { color: colors.accent }]}>
                  {phaseSecondsRemaining}
                </Text>
                <Text style={[styles.phaseHint, { color: colors.textSecondary }]}>
                  4-4-4-4 CADENCE
                </Text>
              </View>
            </View>

            {/* Rotating Stoic Grounding Anchor */}
            <Animated.View style={[styles.anchorContainer, animatedAnchorStyle]}>
              <Ionicons name="sparkles" size={14} color={colors.accent} style={styles.anchorIcon} />
              <Text style={[styles.anchorText, { color: colors.textPrimary }]}>
                {STOIC_GROUNDING_ANCHORS[anchorIndex]}
              </Text>
            </Animated.View>

            {/* High-Friction Early Exit Button (5-Second Press and Hold) */}
            <View style={styles.exitSection}>
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                  styles.exitButtonWrapper,
                  {
                    borderColor: isHolding ? colors.accent : 'rgba(255, 255, 255, 0.14)',
                    backgroundColor: isHolding ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  },
                ]}
                accessibilityLabel="Press and hold 5 seconds to exit emergency mode"
                accessibilityRole="button"
              >
                {/* Horizontal Progress Fill Layer */}
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${holdProgress * 100}%`,
                      backgroundColor: `${colors.accent}3D`,
                    },
                  ]}
                />

                <View style={styles.buttonContentRow}>
                  <Ionicons
                    name={isHolding ? 'lock-open-outline' : 'shield-checkmark-outline'}
                    size={17}
                    color={isHolding ? colors.accent : colors.textPrimary}
                  />
                  <Text style={[styles.exitButtonText, { color: colors.textPrimary }]}>
                    I am in control
                  </Text>
                </View>

                <Text style={[styles.exitInstructionSub, { color: colors.textSecondary }]}>
                  {isHolding
                    ? `HOLDING: ${Math.round(holdProgress * 100)}% • DO NOT RELEASE`
                    : 'Press and hold 5 full seconds to disengage'}
                </Text>
              </Pressable>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

export default EmergencyModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenBlur: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeContainer: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    marginBottom: 8,
  },
  warningBadgeText: {
    color: '#FF453A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  timerBlock: {
    alignItems: 'center',
    marginVertical: 4,
  },
  timerValue: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  timerSub: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  breathingContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  breathingRingWrapper: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 2,
  },
  phaseCountdown: {
    fontSize: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  phaseHint: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  anchorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: 340,
    minHeight: 58,
    gap: 8,
  },
  anchorIcon: {
    opacity: 0.9,
  },
  anchorText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 18,
    textAlign: 'center',
    flex: 1,
  },
  exitSection: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 8,
  },
  exitButtonWrapper: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  exitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  exitInstructionSub: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 3,
    zIndex: 2,
  },
});
