import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { TimedChallenge } from '../../types/app';

const DAILY_CHALLENGES: TimedChallenge[] = [
  {
    id: 'challenge_sever_screen',
    title: 'Sever Screen Contact',
    subtitle: 'Put your phone in another room, face down.',
    durationSeconds: 90,
    auraReward: 30,
    category: 'environment',
    lastCompletedAt: null,
  },
  {
    id: 'challenge_cold_exposure',
    title: 'Ice Water Shock',
    subtitle: 'Splash cold water on your face to calm down.',
    durationSeconds: 45,
    auraReward: 25,
    category: 'somatic',
    lastCompletedAt: null,
  },
  {
    id: 'challenge_box_breathing',
    title: 'Box Breathing Anchor',
    subtitle: 'Breathe in 4s, hold 4s, breathe out 4s, hold 4s.',
    durationSeconds: 120,
    auraReward: 40,
    category: 'mental',
    lastCompletedAt: null,
  },
  {
    id: 'challenge_kinetic_isometric',
    title: 'Wall Sit Lockout',
    subtitle: 'Hold a wall sit to burn off restless energy.',
    durationSeconds: 60,
    auraReward: 35,
    category: 'somatic',
    lastCompletedAt: null,
  },
];

export const TimedChallengesDeck: React.FC = () => {
  const { claimChallengeAura } = useAppData();

  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartChallenge = (challenge: TimedChallenge) => {
    if (activeChallengeId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActiveChallengeId(challenge.id);
    setSecondsRemaining(challenge.durationSeconds);
    setIsCompleted(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setIsCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        if (prev % 10 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAbort = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveChallengeId(null);
    setSecondsRemaining(0);
    setIsCompleted(false);
  };

  const handleClaim = async (challenge: TimedChallenge) => {
    if (!isCompleted || isClaiming) return;
    setIsClaiming(true);

    const success = await claimChallengeAura(challenge.id, challenge.auraReward);
    setIsClaiming(false);

    if (success) {
      setCompletedIds((prev) => ({ ...prev, [challenge.id]: true }));
      setActiveChallengeId(null);
      setIsCompleted(false);
      setSecondsRemaining(0);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.kicker}>DISCIPLINE</Text>
          <Text style={styles.sectionTitle}>Daily Focus Challenges</Text>
        </View>
        <View style={styles.antiExploitBadge}>
          <Ionicons name="checkmark-circle-outline" size={12} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.antiExploitText}>DAILY TASKS</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.scrollContainer}
      >
        {DAILY_CHALLENGES.map((challenge) => {
          const isActive = activeChallengeId === challenge.id;
          const isDone = !!completedIds[challenge.id];
          const isLockedOut = activeChallengeId !== null && !isActive;

          return (
            <View
              key={challenge.id}
              style={[
                styles.cardWrapper,
                isActive && styles.cardWrapperActive,
                isDone && styles.cardWrapperDone,
                isLockedOut && { opacity: 0.35 },
              ]}
            >
              <BlurView
                intensity={isActive ? GlassBlur.intensity.heavy : GlassBlur.intensity.standard}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.cardContent}
              >
                <LinearGradient
                  colors={isActive ? Palette.cyanGradient : Palette.specularGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.absoluteFill}
                  pointerEvents="none"
                />

                {/* Top Telemetry Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>
                      {challenge.category.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rewardPill}>
                    <Text style={styles.rewardText}>+{challenge.auraReward} AURA</Text>
                  </View>
                </View>

                {/* Challenge Title & Subtitle */}
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeSubtitle} numberOfLines={2}>
                  {challenge.subtitle}
                </Text>

                {/* State-Dependent Action Area */}
                <View style={styles.actionSection}>
                  {isDone ? (
                    <View style={styles.clearedBanner}>
                      <Ionicons name="checkmark-done" size={14} color={Palette.signalSuccess} />
                      <Text style={styles.clearedText}>CLEARED TODAY</Text>
                    </View>
                  ) : isActive ? (
                    isCompleted ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={isClaiming}
                        onPress={() => handleClaim(challenge)}
                        style={styles.claimButton}
                      >
                        <Ionicons name="shield-checkmark" size={14} color="#000000" style={{ marginRight: 6 }} />
                        <Text style={styles.claimButtonText}>
                          {isClaiming ? 'CLAIMING...' : 'CLAIM AURA'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.activeRunningRow}>
                        <View style={styles.timerBlock}>
                          <Text style={styles.timerDigits}>{formatTimer(secondsRemaining)}</Text>
                          <Text style={styles.timerSub}>REMAINING</Text>
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={handleAbort}
                          style={styles.abortMiniButton}
                        >
                          <Text style={styles.abortMiniText}>ABORT</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={isLockedOut}
                      onPress={() => handleStartChallenge(challenge)}
                      style={styles.startButton}
                    >
                      <Ionicons name="play" size={12} color={Palette.textPrimary} style={{ marginRight: 6 }} />
                      <Text style={styles.startButtonText}>
                        START ({challenge.durationSeconds}S)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </BlurView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const CARD_WIDTH = 250;

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    marginVertical: Layout.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  antiExploitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  antiExploitText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textSecondary,
  },
  scrollContainer: {
    paddingHorizontal: Layout.spacing.lg,
    gap: 12,
    paddingVertical: Layout.spacing.xs,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
    ...Shadows.subtleSpecular,
  },
  cardWrapperActive: {
    borderColor: Palette.signalCold,
    ...Shadows.cyanGlow,
  },
  cardWrapperDone: {
    borderColor: 'rgba(48, 209, 88, 0.35)',
    ...Shadows.emeraldGlow,
  },
  cardContent: {
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Layout.radius.pill,
    borderWidth: 1,
    borderColor: Palette.specularBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  categoryText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textSecondary,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  rewardText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  actionSection: {
    marginTop: 'auto',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  startButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textPrimary,
  },
  activeRunningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Layout.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  timerBlock: {
    alignItems: 'flex-start',
  },
  timerDigits: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.signalCold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  timerSub: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  abortMiniButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Layout.radius.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.28)',
  },
  abortMiniText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Palette.signalAlert,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: Layout.radius.md,
    backgroundColor: Palette.signalSuccess,
    ...Shadows.emeraldGlow,
  },
  claimButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#000000',
  },
  clearedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.28)',
  },
  clearedText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.signalSuccess,
  },
});