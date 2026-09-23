import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import { useNavigation } from 'expo-router';

interface DrawerNavigation {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

import { useAppData } from '../../context/AppDataContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { SovereignLockPill } from '../../components/monetization/SovereignLockPill';


interface RecoveryStage {
  id: string;
  stageNumber: number;
  startDay: number;
  endDay: number;
  title: string;
  phaseName: string;
  neurobiology: string;
  symptoms: string;
  tacticalRule: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const RECOVERY_STAGES: RecoveryStage[] = [
  {
    id: 'stage_1',
    stageNumber: 1,
    startDay: 1,
    endDay: 7,
    title: 'Acute Receptor Starvation',
    phaseName: 'LIMBIC REBELLION',
    neurobiology: 'Dopamine baseline plummets to trough levels. Striatal D2 receptor availability remains severely down-regulated. The amygdala exhibits hyper-reactivity.',
    symptoms: 'Feeling restless, can\'t sleep, irritable mood, strong urge to slip up.',
    tacticalRule: 'No excuses. Rely on blocks and your Emergency Button.',
    icon: 'flame-outline',
  },
  {
    id: 'stage_2',
    stageNumber: 2,
    startDay: 8,
    endDay: 21,
    title: 'Neurochemical Stabilization',
    phaseName: 'DELTA-FOSB ATTENUATION',
    neurobiology: 'Accumulated transcription factor Delta-FosB in the nucleus accumbens begins degrading. Baseline extracellular dopamine stops dropping and begins stabilizing.',
    symptoms: 'Flatline apathy, mental fog, emotional blunting, subtle cognitive rationalizations.',
    tacticalRule: 'Expect the "Flatline". Do not artificially test libido or motivation. Maintain AM/PM non-negotiables.',
    icon: 'water-outline',
  },
  {
    id: 'stage_3',
    stageNumber: 3,
    startDay: 22,
    endDay: 45,
    title: 'Frontal Lobe Re-Engagement',
    phaseName: 'SYNAPTIC PRUNING',
    neurobiology: 'Prefrontal cortex (PFC) gray matter density increases. Executive function channels re-establish dominance over involuntary ventral striatal craving loops.',
    symptoms: 'Spontaneous energy rebounds, sharper visual focus, restored latency between impulse and physical action.',
    tacticalRule: 'Watch for the "Overconfidence Trap". You are not healed; neuroplastic pathways have merely begun remodeling.',
    icon: 'bulb-outline',
  },
  {
    id: 'stage_4',
    stageNumber: 4,
    startDay: 46,
    endDay: 90,
    title: 'Full D2 Receptor Upregulation',
    phaseName: 'DOPAMINERGIC HOMEOSTASIS',
    neurobiology: 'Striatal dopamine receptor density returns to optimal baseline sensitivity. Healthy natural stimuli (exercise, social connection, deep work) trigger normal reward cascades.',
    symptoms: 'Deep emotional equilibrium, stable morning motivation, unfragmented sustained focus.',
    tacticalRule: 'Build a strong new identity. Protect your sleep and device rules as a permanent habit.',
    icon: 'shield-checkmark-outline',
  },
];

export default function RoadmapScreen() {
  const { cleanDurationMs, isSovereignUser, openPaywall } = useAppData();
  const { colors, theme } = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);


  // Derive active clean days — honest count: day zero shows 0, not 1.
  const currentDaysClean = Math.floor(cleanDurationMs / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((currentDaysClean / 90) * 100));

  const handleStagePress = (stage: RecoveryStage) => {
    const isGated = stage.stageNumber > 1 && !isSovereignUser;
    if (isGated) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedStageId((prev) => (prev === stage.id ? null : stage.id));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.openDrawer();
          }}
          style={styles.headerMenuButton}
          accessibilityLabel="Open Navigation Menu"
        >
          <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.kickerRow}>
          <Ionicons name="pulse" size={13} color={Palette.signalCold} />
          <Text style={styles.kicker}>90-DAY GOAL</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Recovery Progress</Text>
        <Text style={styles.subtitle}>
          Track your recovery stages step by step until you reach 90 days.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Metric Glass HUD */}
        <View style={styles.hudCardWrapper}>
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.hudCard}
          >
            <LinearGradient
              colors={Palette.specularGradient}
              style={styles.specularBorder}
              pointerEvents="none"
            />

            <View style={styles.hudHeaderRow}>
              <View>
                <Text style={styles.hudKicker}>ACTIVE RECOVERY VECTOR</Text>
                <Text style={styles.hudDaysText}>
                  DAY {currentDaysClean} <Text style={styles.hudGoalText}>/ 90 DAYS</Text>
                </Text>
              </View>
              <View style={styles.hudPercentBadge}>
                <Text style={styles.hudPercentText}>{progressPercent}%</Text>
                <Text style={styles.hudPercentSub}>RESTORED</Text>
              </View>
            </View>

            {/* Specular Progress Bar Track */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </BlurView>
        </View>

        {/* Vertical Timeline Stages */}
        <View style={styles.timelineContainer}>
          {/* Vertical Connecting Line */}
          <View style={styles.verticalTrackLine} />

          {RECOVERY_STAGES.map((stage) => {
            const isCompleted = currentDaysClean > stage.endDay;
            const isActive = currentDaysClean >= stage.startDay && currentDaysClean <= stage.endDay;
            const isLocked = currentDaysClean < stage.startDay;
            const isGated = stage.stageNumber > 1 && !isSovereignUser;
            const isExpanded = expandedStageId === stage.id && !isGated;

            const stageColor = isCompleted
              ? Palette.signalSuccess
              : isActive
              ? Palette.signalCold
              : Palette.textMuted;

            return (
              <View key={stage.id} style={styles.stageBlock}>
                {/* Timeline Node Marker */}
                <View style={[styles.nodeMarker, { borderColor: stageColor }]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={13} color={Palette.signalSuccess} />
                  ) : (
                    <View
                      style={[
                        styles.nodeDot,
                        { backgroundColor: stageColor },
                        isActive && styles.activeNodeGlow,
                      ]}
                    />
                  )}
                </View>

                {/* Stage Glass Card */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleStagePress(stage)}
                  style={[
                    styles.stageCardWrapper,
                    isActive && styles.stageCardWrapperActive,
                    isLocked && { opacity: 0.5 },
                  ]}
                >
                  <BlurView
                    intensity={isActive ? GlassBlur.intensity.heavy : GlassBlur.intensity.standard}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.stageCard}
                  >
                    <LinearGradient
                      colors={
                        isActive
                          ? Palette.cyanGradient
                          : isCompleted
                          ? ['rgba(48, 209, 88, 0.15)', 'rgba(48, 209, 88, 0.02)']
                          : Palette.specularGradient
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.absoluteFill}
                      pointerEvents="none"
                    />

                    {/* Card Header Row */}
                    <View style={styles.stageHeaderRow}>
                      <View style={styles.stageMetaCol}>
                        <View style={styles.stageBadgeRow}>
                          <Text style={[styles.stageBadge, { color: stageColor }]}>
                            DAYS {stage.startDay}–{stage.endDay}
                          </Text>
                          <Text style={styles.stagePhaseKicker}>// {stage.phaseName}</Text>
                        </View>
                        <Text style={styles.stageTitle}>{stage.title}</Text>
                      </View>

                      {isGated ? (
                        <SovereignLockPill
                          size="sm"
                          onPress={() => openPaywall()}
                        />
                      ) : (
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Palette.textSecondary}
                        />
                      )}
                    </View>

                    {/* Core Neurobiology Summary */}
                    <Text style={styles.stageSummaryText}>{stage.neurobiology}</Text>

                    {/* Expandable Clinical Deep Dive */}
                    {isExpanded && (
                      <View style={styles.expandedDetails}>
                        <View style={styles.detailBlock}>
                          <Text style={styles.detailLabel}>SYMPTOM MANIFESTATION</Text>
                          <Text style={styles.detailValue}>{stage.symptoms}</Text>
                        </View>
                        <View style={styles.detailBlock}>
                          <Text style={[styles.detailLabel, { color: Palette.signalCold }]}>
                            TACTICAL OPERATING RULE
                          </Text>
                          <Text style={styles.detailValue}>{stage.tacticalRule}</Text>
                        </View>
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sovereign Pass paywall is the single global modal in app/_layout.tsx */}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  headerMenuButton: {
    paddingVertical: 6,
    marginLeft: -4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  kicker: {
    ...Typography.kicker,
    color: Palette.signalCold,
    fontSize: 9.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Palette.textSecondary,
  },
  hudCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.20)',
    marginBottom: Layout.spacing.xl,
    ...Shadows.subtleSpecular,
  },
  hudCard: {
    padding: Layout.spacing.lg,
    backgroundColor: Palette.glassSurface,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  hudKicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.signalCold,
    marginBottom: 2,
  },
  hudDaysText: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  hudGoalText: {
    fontSize: 14,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  hudPercentBadge: {
    alignItems: 'flex-end',
  },
  hudPercentText: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.signalCold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  hudPercentSub: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textTertiary,
  },
  progressTrack: {
    height: 8,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.signalCold,
    borderRadius: Layout.radius.pill,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 24,
  },
  verticalTrackLine: {
    position: 'absolute',
    left: 9,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stageBlock: {
    position: 'relative',
    marginBottom: Layout.spacing.lg,
  },
  nodeMarker: {
    position: 'absolute',
    left: -24,
    top: 18,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeNodeGlow: {
    ...Shadows.cyanGlow,
  },
  stageCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  stageCardWrapperActive: {
    borderColor: 'rgba(100, 210, 255, 0.45)',
    ...Shadows.cyanGlow,
  },
  stageCard: {
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageMetaCol: {
    flex: 1,
    marginRight: 8,
  },
  stageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stageBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  stagePhaseKicker: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.textTertiary,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  stageSummaryText: {
    fontSize: 12,
    lineHeight: 17,
    color: Palette.textSecondary,
  },
  expandedDetails: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  detailBlock: {
    gap: 2,
  },
  detailLabel: {
    ...Typography.kicker,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: Palette.textTertiary,
  },
  detailValue: {
    fontSize: 11.5,
    lineHeight: 16,
    color: Palette.textSecondary,
  },
});