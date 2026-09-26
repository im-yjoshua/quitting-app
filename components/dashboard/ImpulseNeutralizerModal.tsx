import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../context/AppDataContext';
import { useNow } from '../../hooks/useNow';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { InterventionDrillType } from '../../types/app';

interface ImpulseNeutralizerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface DrillOption {
  id: InterventionDrillType;
  title: string;
  durationSeconds: number;
  mechanism: string;
  instruction: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SOMATIC_DRILLS: DrillOption[] = [
  {
    id: 'cold_splash',
    title: 'Cold Water Shock',
    durationSeconds: 30,
    mechanism: 'Triggers Mammalian Dive Reflex',
    instruction: 'Fill a basin with ice-cold water. Submerge face continuously for 30s to mechanically crash elevated heart rate.',
    icon: 'water-outline',
  },
  {
    id: 'pushups_15',
    title: '15 Kinetic Pushups',
    durationSeconds: 45,
    mechanism: 'Burns Surging Cortisol',
    instruction: 'Drop immediately. Perform 15 deliberate reps. Recruit major motor units to exhaust limbic adrenaline spikes.',
    icon: 'barbell-outline',
  },
  {
    id: 'vagus_breath',
    title: 'Double Physiological Sigh',
    durationSeconds: 60,
    mechanism: 'Stimulates Vagus Nerve',
    instruction: 'Take two deep inhales through the nose, followed by one long, slow sigh out the mouth. Repeat for 60 seconds.',
    icon: 'radio-outline',
  },
];

export const ImpulseNeutralizerModal: React.FC<ImpulseNeutralizerModalProps> = ({
  visible,
  onClose,
}) => {
  const { state, claimInterventionAura } = useAppData();
  const now = useNow(1000);
  const cooldownUntil = state.interventionState.cooldownUntil ?? 0;
  const interventionCooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const canClaimIntervention = interventionCooldownSeconds === 0;

  const [activeDrill, setActiveDrill] = useState<DrillOption>(SOMATIC_DRILLS[0]);
  const [drillRunning, setDrillRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(SOMATIC_DRILLS[0].durationSeconds);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear running timers when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectDrill = (drill: DrillOption) => {
    if (drillRunning) return;
    Haptics.selectionAsync();
    setActiveDrill(drill);
    setSecondsRemaining(drill.durationSeconds);
    setDrillCompleted(false);
  };

  const startDrill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDrillRunning(true);
    setDrillCompleted(false);
    setSecondsRemaining(activeDrill.durationSeconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setDrillRunning(false);
          setDrillCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        if (prev % 5 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const abortDrill = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDrillRunning(false);
    setSecondsRemaining(activeDrill.durationSeconds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleClaim = async () => {
    if (!drillCompleted || !canClaimIntervention || isClaiming) return;
    setIsClaiming(true);
    const success = await claimInterventionAura(activeDrill.id, 25);
    setIsClaiming(false);
    if (success) {
      onClose();
    }
  };

  const formatCooldown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
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

        <View style={styles.sheetContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Telemetry */}
            <View style={styles.header}>
              <View style={styles.kickerRow}>
                <Ionicons name="flash-outline" size={13} color={Palette.signalCold} />
                <Text style={styles.kicker}>BEAT THE URGE</Text>
              </View>
              <Text style={styles.title}>Beat the Urge</Text>
              <Text style={styles.subtitle}>
                Urges only last for a few minutes. Do a physical exercise to beat it and earn points.
              </Text>
            </View>

            {/* Cooldown Lock Banner (if within 10-minute lockout) */}
            {!canClaimIntervention && (
              <View style={styles.cooldownBanner}>
                <Ionicons name="lock-closed" size={14} color={Palette.textSecondary} />
                <Text style={styles.cooldownBannerText}>
                  Aura cooldown active: <Text style={styles.cooldownHighlight}>{formatCooldown(interventionCooldownSeconds)}</Text> remaining. You may still run the drill for somatic relief.
                </Text>
              </View>
            )}

            {/* Drill Selection Deck */}
            <Text style={styles.sectionLabel}>SELECT EXERCISE</Text>
            <View style={styles.drillSelectorRow}>
              {SOMATIC_DRILLS.map((drill) => {
                const isSelected = activeDrill.id === drill.id;
                return (
                  <TouchableOpacity
                    key={drill.id}
                    activeOpacity={0.8}
                    disabled={drillRunning}
                    onPress={() => handleSelectDrill(drill)}
                    style={[
                      styles.drillOptionCard,
                      isSelected && styles.drillOptionCardActive,
                      drillRunning && !isSelected && { opacity: 0.35 },
                    ]}
                  >
                    <BlurView
                      intensity={isSelected ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                      tint={GlassBlur.tint}
                      blurMethod={GlassBlur.blurMethod}
                      style={styles.drillOptionInner}
                    >
                      <Ionicons
                        name={drill.icon}
                        size={20}
                        color={isSelected ? Palette.signalCold : Palette.textSecondary}
                        style={{ marginBottom: 4 }}
                      />
                      <Text
                        style={[
                          styles.drillOptionTitle,
                          isSelected && styles.drillOptionTitleActive,
                        ]}
                      >
                        {drill.title}
                      </Text>
                      <Text
                        style={[
                          styles.drillOptionDuration,
                          isSelected && styles.drillOptionDurationActive,
                        ]}
                      >
                        {drill.durationSeconds}s
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Active Drill Execution Glass Box */}
            <View style={styles.executionBoxWrapper}>
              <BlurView
                intensity={GlassBlur.intensity.heavy}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.executionBox}
              >
                <LinearGradient
                  colors={Palette.specularGradient}
                  style={styles.specularBorder}
                  pointerEvents="none"
                />

                <View style={styles.mechanismBadge}>
                  <Text style={styles.mechanismText}>
                    {activeDrill.mechanism}
                  </Text>
                </View>

                {/* Tabular Countdown Timer */}
                <Text style={styles.timerDisplay}>
                  00:{String(secondsRemaining).padStart(2, '0')}
                </Text>
                <Text style={styles.timerSub}>TIME REMAINING IN DRILL</Text>

                <Text style={styles.instructionText}>{activeDrill.instruction}</Text>

                {/* Drill Control Button */}
                {!drillRunning && !drillCompleted && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={startDrill}
                    style={styles.primaryActionButton}
                  >
                    <LinearGradient
                      colors={Palette.cyanGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.absoluteFill}
                    />
                    <Text style={styles.primaryActionText}>ENGAGE DRILL ({activeDrill.durationSeconds}S)</Text>
                  </TouchableOpacity>
                )}

                {drillRunning && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={abortDrill}
                    style={styles.abortButton}
                  >
                    <Text style={styles.abortButtonText}>ABORT DRILL</Text>
                  </TouchableOpacity>
                )}

                {/* Claim Aura Button (Only enabled upon verifiable elapsed time) */}
                {drillCompleted && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!canClaimIntervention || isClaiming}
                    onPress={handleClaim}
                    style={[
                      styles.claimButton,
                      !canClaimIntervention && styles.claimButtonDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={canClaimIntervention ? Palette.specularGradient : ['transparent', 'transparent']}
                      style={styles.absoluteFill}
                    />
                    <Ionicons name="checkmark-circle" size={18} color={Palette.signalSuccess} style={{ marginRight: 6 }} />
                    <Text style={styles.claimButtonText}>
                      {canClaimIntervention ? 'CLAIM +25 AURA REPUTATION' : 'DRILL CLEARED // COOLDOWN RESTRICTED'}
                    </Text>
                  </TouchableOpacity>
                )}
              </BlurView>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.dismissButton}
            >
              <Text style={styles.dismissButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    marginTop: 48,
    backgroundColor: Palette.canvasRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xxl + 20,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginBottom: Layout.spacing.md,
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: Palette.textSecondary,
  },
  cooldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    gap: 10,
  },
  cooldownBannerText: {
    flex: 1,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  cooldownHighlight: {
    color: Palette.textPrimary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    ...Typography.kicker,
    color: Palette.textTertiary,
    marginBottom: Layout.spacing.sm,
  },
  drillSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Layout.spacing.lg,
  },
  drillOptionCard: {
    flex: 1,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  drillOptionCardActive: {
    borderColor: Palette.signalCold,
  },
  drillOptionInner: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.sm,
    alignItems: 'center',
    backgroundColor: Palette.glassSurface,
  },
  drillOptionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  drillOptionTitleActive: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  drillOptionDuration: {
    fontSize: 10,
    color: Palette.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  drillOptionDurationActive: {
    color: Palette.signalCold,
  },
  executionBoxWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
    marginBottom: Layout.spacing.lg,
    ...Shadows.subtleSpecular,
  },
  executionBox: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
    backgroundColor: Palette.glassSurface,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mechanismBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(100, 210, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.2)',
    marginBottom: Layout.spacing.md,
  },
  mechanismText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Palette.signalCold,
  },
  timerDisplay: {
    ...Typography.chronometerValue,
    fontSize: 54,
    color: Palette.textPrimary,
  },
  timerSub: {
    ...Typography.chronometerUnit,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: -4,
    marginBottom: Layout.spacing.md,
  },
  instructionText: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.sm,
  },
  primaryActionButton: {
    width: '100%',
    height: 52,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.4)',
    marginBottom: Layout.spacing.sm,
    ...Shadows.cyanGlow,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textPrimary,
  },
  abortButton: {
    width: '100%',
    height: 48,
    borderRadius: Layout.radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  abortButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.signalAlert,
  },
  claimButton: {
    width: '100%',
    height: 52,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48, 209, 88, 0.18)',
    borderWidth: 1,
    borderColor: Palette.signalSuccess,
    ...Shadows.emeraldGlow,
  },
  claimButtonDisabled: {
    backgroundColor: Palette.glassSurfaceSubtle,
    borderColor: Palette.specularBorderSubtle,
    opacity: 0.6,
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