import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { RelapseTrigger } from '../../types/app';

interface ResetConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface TriggerOption {
  id: RelapseTrigger;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FORENSIC_TRIGGERS: TriggerOption[] = [
  {
    id: 'late_night_bed_scrolling',
    label: 'Late-Night Bed Scrolling',
    sublabel: 'Circadian friction failure past bedtime',
    icon: 'moon-outline',
  },
  {
    id: 'boredom_isolation',
    label: 'Boredom & Isolation',
    sublabel: 'Unstructured downtime dopamine seeking',
    icon: 'cube-outline',
  },
  {
    id: 'stress_cortisol',
    label: 'Stress & Cortisol Surge',
    sublabel: 'Compulsive emotional numbing reflex',
    icon: 'flash-outline',
  },
  {
    id: 'fatigue_burnout',
    label: 'Fatigue & Willpower Depletion',
    sublabel: 'Ego depletion after prolonged demand',
    icon: 'battery-dead-outline',
  },
  {
    id: 'alcohol_substance_cross_trigger',
    label: 'Substance Cross-Trigger',
    sublabel: 'Inhibition lowered by chemical vector',
    icon: 'wine-outline',
  },
  {
    id: 'other',
    label: 'Uncategorized Deviation',
    sublabel: 'Unplanned somatic surrender',
    icon: 'alert-circle-outline',
  },
];

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  visible,
  onClose,
}) => {
  const { state, cleanDurationMs, recordRelapse } = useAppData();
  const { attemptCount, weeklyCostEstimated, dailyMinutesWasted } = state.profile;

  const [selectedTrigger, setSelectedTrigger] = useState<RelapseTrigger>('late_night_bed_scrolling');
  const [isResetting, setIsResetting] = useState(false);

  // 3-second solemn hold execution driver
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Time & resource forfeiture calculation
  const totalHoursClean = Math.floor(cleanDurationMs / (1000 * 60 * 60));
  const forfeitedDays = Math.floor(totalHoursClean / 24);
  const forfeitedHours = totalHoursClean % 24;

  const hoursWastedProjected = ((cleanDurationMs / (1000 * 60 * 60 * 24)) * (dailyMinutesWasted / 60)).toFixed(1);
  const capitalProtectedProjected = (
    (cleanDurationMs / (1000 * 60 * 60 * 24 * 7)) *
    weeklyCostEstimated
  ).toFixed(0);

  const handleSelectTrigger = (trigger: RelapseTrigger) => {
    Haptics.selectionAsync();
    setSelectedTrigger(trigger);
  };

  const handlePressIn = () => {
    if (isResetting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    holdTimeoutRef.current = setTimeout(async () => {
      setIsResetting(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await recordRelapse(selectedTrigger);
      setIsResetting(false);
      holdProgress.setValue(0);
      onClose();
    }, 3000);
  };

  const handlePressOut = () => {
    if (isResetting) return;
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const progressWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
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
            {/* Header / Forewarning */}
            <View style={styles.header}>
              <View style={styles.alertKickerRow}>
                <Ionicons name="warning-outline" size={13} color={Palette.signalAlert} />
                <Text style={styles.alertKicker}>RESET TIMER</Text>
              </View>
              <Text style={styles.title}>Confront the Loss.</Text>
              <Text style={styles.subtitle}>
                Resetting is not an escape. Be honest about why you slipped up so you can learn from it.
              </Text>
            </View>

            {/* Loss Telemetry Deck */}
            <View style={styles.forfeitureCardWrapper}>
              <BlurView
                intensity={GlassBlur.intensity.heavy}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.forfeitureCard}
              >
                <LinearGradient
                  colors={Palette.crimsonGradient}
                  style={styles.crimsonGlowOverlay}
                  pointerEvents="none"
                />
                <Text style={styles.sectionKicker}>MY STATS</Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>
                      {forfeitedDays}d {forfeitedHours}h
                    </Text>
                    <Text style={styles.statLabel}>CLEAN RUN FORFEITED</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statCol}>
                    <Text style={[styles.statNumber, { color: Palette.signalAlert }]}>
                      #{attemptCount + 1}
                    </Text>
                    <Text style={styles.statLabel}>NEXT ATTEMPT INDEX</Text>
                  </View>
                </View>

                <View style={styles.projectionSubRow}>
                  <Text style={styles.projectionText}>
                    Streak safeguarded <Text style={styles.projectionHighlight}>{hoursWastedProjected} hrs</Text> and <Text style={styles.projectionHighlight}>${capitalProtectedProjected}</Text> before surrender.
                  </Text>
                </View>
              </BlurView>
            </View>

            {/* Forensic Trigger Classification */}
            <Text style={styles.triggerSectionTitle}>WHY DID YOU SLIP UP?</Text>
            <View style={styles.triggerList}>
              {FORENSIC_TRIGGERS.map((item) => {
                const isSelected = selectedTrigger === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectTrigger(item.id)}
                    style={[
                      styles.triggerCardWrapper,
                      isSelected && styles.triggerCardWrapperActive,
                    ]}
                  >
                    <BlurView
                      intensity={isSelected ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                      tint={GlassBlur.tint}
                      blurMethod={GlassBlur.blurMethod}
                      style={styles.triggerCard}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isSelected ? Palette.signalAlert : Palette.textSecondary}
                        style={styles.triggerIcon}
                      />
                      <View style={styles.triggerTextContainer}>
                        <Text
                          style={[
                            styles.triggerLabel,
                            isSelected && styles.triggerLabelActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.triggerSublabel}>{item.sublabel}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3-Second Hold-to-Reset Trigger */}
            <View style={styles.holdTriggerWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isResetting}
                style={styles.holdButton}
              >
                <BlurView
                  intensity={GlassBlur.intensity.heavy}
                  tint={GlassBlur.tint}
                  blurMethod={GlassBlur.blurMethod}
                  style={styles.holdButtonInner}
                >
                  <Animated.View
                    style={[
                      styles.holdProgressBar,
                      { width: progressWidth },
                    ]}
                  />
                  <LinearGradient
                    colors={Palette.crimsonGradient}
                    style={styles.absoluteFill}
                    pointerEvents="none"
                  />
                  <View style={styles.holdTextContainer}>
                    <Text style={styles.holdButtonKicker}>IRREVERSIBLE COMMAND</Text>
                    <Text style={styles.holdButtonLabel}>
                      HOLD 3 SECONDS TO RESET
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* Cancel / Abort Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.abortButton}
            >
              <Text style={styles.abortButtonText}>ABORT // RETURN TO FRONT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    marginTop: 54,
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
  header: {
    marginBottom: Layout.spacing.lg,
  },
  alertKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Layout.spacing.xs,
  },
  alertKicker: {
    ...Typography.kickerAlert,
    fontSize: 10,
    letterSpacing: 2,
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
    lineHeight: 19,
    color: Palette.textSecondary,
  },
  forfeitureCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    marginBottom: Layout.spacing.xl,
  },
  forfeitureCard: {
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  crimsonGlowOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  sectionKicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.signalAlert,
    marginBottom: Layout.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Layout.spacing.xs,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Palette.specularBorderSubtle,
  },
  projectionSubRow: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectionText: {
    fontSize: 11,
    color: Palette.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  projectionHighlight: {
    color: Palette.textPrimary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  triggerSectionTitle: {
    ...Typography.kicker,
    color: Palette.textTertiary,
    marginBottom: Layout.spacing.sm,
  },
  triggerList: {
    gap: 10,
    marginBottom: Layout.spacing.xl,
  },
  triggerCardWrapper: {
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  triggerCardWrapperActive: {
    borderColor: Palette.signalAlert,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  triggerIcon: {
    marginRight: 12,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  triggerLabelActive: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  triggerSublabel: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Palette.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Palette.signalAlert,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.signalAlert,
  },
  holdTriggerWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    marginBottom: Layout.spacing.md,
    ...Shadows.crimsonGlow,
  },
  holdButton: {
    height: 64,
  },
  holdButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Palette.signalAlert,
    opacity: 0.35,
  },
  holdTextContainer: {
    alignItems: 'center',
  },
  holdButtonKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: Palette.signalAlert,
    marginBottom: 2,
  },
  holdButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textPrimary,
  },
  abortButton: {
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abortButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMuted,
  },
});