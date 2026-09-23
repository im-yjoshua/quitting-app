import React, { useMemo } from 'react';
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

import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { RelapseTrigger, RelapseRecord } from '../../types/app';
import { SovereignLockPill } from '../../components/monetization/SovereignLockPill';


const TRIGGER_META: Record<
  RelapseTrigger,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  late_night_bed_scrolling: {
    label: 'Late-Night Bed Scrolling',
    icon: 'moon-outline',
    color: Palette.tierSentinel,
  },
  boredom_isolation: {
    label: 'Boredom & Isolation',
    icon: 'cube-outline',
    color: Palette.signalCold,
  },
  stress_cortisol: {
    label: 'Stress & Cortisol Surge',
    icon: 'flash-outline',
    color: Palette.signalAlert,
  },
  fatigue_burnout: {
    label: 'Fatigue & Burnout',
    icon: 'battery-dead-outline',
    color: Palette.signalWarning,
  },
  alcohol_substance_cross_trigger: {
    label: 'Substance Cross-Trigger',
    icon: 'wine-outline',
    color: Palette.tierSovereign,
  },
  other: {
    label: 'Uncategorized Deviation',
    icon: 'alert-circle-outline',
    color: Palette.textSecondary,
  },
};

import { useNavigation } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';

interface DrawerNavigation {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export default function LedgerScreen() {
  const { state, isSovereignUser, openPaywall } = useAppData();
  const { relapseHistory, profile } = state;
  const { colors, theme } = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();
  const isDark = theme === 'dark';


  const triggerStats = useMemo(() => {
    const counts: Partial<Record<RelapseTrigger, number>> = {};
    relapseHistory.forEach((record) => {
      counts[record.trigger] = (counts[record.trigger] || 0) + 1;
    });
    return counts;
  }, [relapseHistory]);

  const formatDuration = (durationMs: number) => {
    const totalHours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const mins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${Math.max(1, mins)}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
          <Ionicons name="file-tray-full" size={13} color={Palette.textSecondary} />
          <Text style={styles.kicker}>MY HISTORY & PATTERNS</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My History</Text>
        <Text style={styles.subtitle}>
          Slip ups leave clues. Review what caused your slips to build better habits.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Metric Telemetry Deck */}
        <View style={styles.metricsDeck}>
          <View style={styles.metricPill}>
            <BlurView
              intensity={GlassBlur.intensity.standard}
              tint={GlassBlur.tint}
              blurMethod={GlassBlur.blurMethod}
              style={styles.metricPillInner}
            >
              <LinearGradient
                colors={Palette.specularGradient}
                style={styles.specularBorder}
                pointerEvents="none"
              />
              <Text style={styles.metricLabel}>TOTAL TRIES</Text>
              <Text style={styles.metricValue}>#{profile.attemptCount}</Text>
            </BlurView>
          </View>
          <View style={styles.metricPill}>
            <BlurView
              intensity={GlassBlur.intensity.standard}
              tint={GlassBlur.tint}
              blurMethod={GlassBlur.blurMethod}
              style={styles.metricPillInner}
            >
              <LinearGradient
                colors={Palette.specularGradient}
                style={styles.specularBorder}
                pointerEvents="none"
              />
              <Text style={styles.metricLabel}>SLIP UPS</Text>
              <Text style={[styles.metricValue, { color: Palette.signalAlert }]}>
                {relapseHistory.length}
              </Text>
            </BlurView>
          </View>
        </View>

        {/* Forensic Trigger Breakdown Matrix */}
        {relapseHistory.length > 0 && (
          <View style={styles.breakdownSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>SLIP UP CAUSES</Text>
              {!isSovereignUser && (
                <SovereignLockPill
                  size="sm"
                  onPress={() => openPaywall()}
                />
              )}
            </View>
            <TouchableOpacity
              activeOpacity={isSovereignUser ? 1 : 0.88}
              onPress={() => {
                if (!isSovereignUser) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  openPaywall();
                }
              }}
            >
              <BlurView
                intensity={GlassBlur.intensity.heavy}
                tint={GlassBlur.tint}
                blurMethod={GlassBlur.blurMethod}
                style={styles.breakdownCard}
              >
                <LinearGradient
                  colors={Palette.specularGradient}
                  style={styles.specularBorder}
                  pointerEvents="none"
                />
                {(Object.keys(TRIGGER_META) as RelapseTrigger[]).map((triggerKey) => {
                  const count = triggerStats[triggerKey] || 0;
                  if (count === 0) return null;
                  const meta = TRIGGER_META[triggerKey];
                  const percentage = Math.round((count / relapseHistory.length) * 100);

                  return (
                    <View key={triggerKey} style={styles.triggerStatRow}>
                      <View style={styles.triggerInfo}>
                        <Ionicons name={meta.icon} size={15} color={meta.color} style={{ marginRight: 8 }} />
                        <Text style={styles.triggerName}>{meta.label}</Text>
                      </View>
                      <View style={styles.barAndCount}>
                        <View style={styles.miniBarTrack}>
                          <View
                            style={[
                              styles.miniBarFill,
                              { width: `${percentage}%`, backgroundColor: Palette.signalAlert },
                            ]}
                          />
                        </View>
                        <Text style={styles.countText}>{count} ({percentage}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </BlurView>
            </TouchableOpacity>
          </View>
        )}

        {/* Historical Chronological Records */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>PAST SLIP UPS</Text>
          {!isSovereignUser && relapseHistory.length > 1 && (
            <SovereignLockPill
              size="sm"
              onPress={() => openPaywall()}
            />
          )}
        </View>

        {relapseHistory.length === 0 ? (
          <View style={styles.emptyStateCardWrapper}>
            <BlurView
              intensity={GlassBlur.intensity.heavy}
              tint={GlassBlur.tint}
              blurMethod={GlassBlur.blurMethod}
              style={styles.emptyStateCard}
            >
              <LinearGradient
                colors={['rgba(48, 209, 88, 0.18)', 'rgba(48, 209, 88, 0.02)']}
                style={styles.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.unbrokenBadge}>
                <Ionicons name="shield-checkmark" size={32} color={Palette.signalSuccess} />
              </View>
              <Text style={styles.emptyTitle}>Keep Going!</Text>
              <Text style={styles.emptyBody}>
                No slip ups recorded yet. Keep up the good work and protect your streak!
              </Text>
            </BlurView>
          </View>
        ) : (
          <View style={styles.historyList}>
            {/* Display records: Free users see latest slip; remaining records are gated behind Sovereign Pass */}
            {(isSovereignUser ? relapseHistory : relapseHistory.slice(0, 1)).map((record: RelapseRecord) => {
              const meta = TRIGGER_META[record.trigger] || TRIGGER_META.other;

              return (
                <TouchableOpacity
                  key={record.id}
                  activeOpacity={0.85}
                  onPress={handleCardPress}
                  style={styles.recordCardWrapper}
                >
                  <BlurView
                    intensity={GlassBlur.intensity.standard}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.recordCard}
                  >
                    <LinearGradient
                      colors={Palette.specularGradient}
                      style={styles.specularBorder}
                      pointerEvents="none"
                    />

                    {/* Top Row: Attempt and Date */}
                    <View style={styles.recordHeaderRow}>
                      <View style={styles.attemptBadge}>
                        <Text style={styles.attemptBadgeText}>
                          ATTEMPT #{record.attemptNumber}
                        </Text>
                      </View>
                      <Text style={styles.recordDate}>{formatDate(record.timestamp)}</Text>
                    </View>

                    {/* Core Metric: Forfeited Clean Run Duration */}
                    <View style={styles.forfeitedBlock}>
                      <Text style={styles.forfeitedLabel}>CLEAN STREAK LOST</Text>
                      <Text style={styles.forfeitedDuration}>
                        {formatDuration(record.cleanDurationMs)}
                      </Text>
                    </View>

                    {/* Attribution Tag */}
                    <View style={styles.attributionTag}>
                      <Ionicons name={meta.icon} size={14} color={meta.color} style={{ marginRight: 6 }} />
                      <Text style={[styles.attributionText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>

                    {/* Optional Journal Notes */}
                    {record.notes && (
                      <View style={styles.notesBlock}>
                        <Text style={styles.notesText}>"{record.notes}"</Text>
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              );
            })}

            {/* If free user has multiple records, render Sovereign Forensic Archive Lock Card */}
            {!isSovereignUser && relapseHistory.length > 1 && (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  openPaywall();
                }}
                style={styles.archiveLockCardWrapper}
              >
                <BlurView
                  intensity={GlassBlur.intensity.standard}
                  tint={GlassBlur.tint}
                  blurMethod={GlassBlur.blurMethod}
                  style={styles.archiveLockCard}
                >
                  <LinearGradient
                    colors={['rgba(255, 215, 0, 0.14)', 'rgba(255, 159, 10, 0.02)']}
                    style={styles.absoluteFill}
                    pointerEvents="none"
                  />
                  <View style={styles.archiveLockHeader}>
                    <View style={styles.archiveLockIconBox}>
                      <Ionicons name="lock-closed" size={18} color={Palette.tierSovereign} />
                    </View>
                    <View style={styles.archiveLockTextCol}>
                      <Text style={styles.archiveLockTitle}>
                        + {relapseHistory.length - 1} Past Slip Ups Hidden
                      </Text>
                      <Text style={styles.archiveLockSubtitle}>
                        Sovereign Tier unlocks your full history of slip ups and detailed notes.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.archiveUnlockBtn}>
                    <Text style={styles.archiveUnlockBtnText}>
                      UNLOCK FULL HISTORY // SOVEREIGN
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    color: Palette.textMuted,
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
  metricsDeck: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Layout.spacing.xl,
  },
  metricPill: {
    flex: 1,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  metricPillInner: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    backgroundColor: Palette.glassSurface,
  },
  metricLabel: {
    ...Typography.kicker,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: Palette.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    ...Typography.telemetryValue,
    fontSize: 22,
    color: Palette.textPrimary,
  },
  sectionLabel: {
    ...Typography.kicker,
    color: Palette.textMuted,
    marginBottom: Layout.spacing.sm,
  },
  breakdownSection: {
    marginBottom: Layout.spacing.xl,
  },
  breakdownCard: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
    gap: 12,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  triggerStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  triggerName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  barAndCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBarTrack: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textTertiary,
    fontVariant: ['tabular-nums'],
    minWidth: 46,
    textAlign: 'right',
  },
  emptyStateCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
    ...Shadows.subtleSpecular,
  },
  emptyStateCard: {
    paddingVertical: Layout.spacing.xxl,
    paddingHorizontal: Layout.spacing.xl,
    alignItems: 'center',
    backgroundColor: Palette.glassSurface,
  },
  unbrokenBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emptyBody: {
    ...Typography.body,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    color: Palette.textSecondary,
  },
  historyList: {
    gap: 12,
  },
  recordCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  recordCard: {
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  attemptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  attemptBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.signalAlert,
    fontVariant: ['tabular-nums'],
  },
  recordDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textTertiary,
  },
  forfeitedBlock: {
    marginVertical: 4,
  },
  forfeitedLabel: {
    ...Typography.kicker,
    fontSize: 8,
    letterSpacing: 1.2,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  forfeitedDuration: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  attributionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Layout.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignSelf: 'flex-start',
  },
  attributionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textSecondary,
  },
  notesBlock: {
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  notesText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  archiveLockCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    marginTop: Layout.spacing.xs,
    ...Shadows.amberGlow,
  },
  archiveLockCard: {
    padding: Layout.spacing.lg,
    backgroundColor: Palette.glassSurface,
  },
  archiveLockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: Layout.spacing.md,
  },
  archiveLockIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveLockTextCol: {
    flex: 1,
  },
  archiveLockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  archiveLockSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: Palette.textSecondary,
  },
  archiveUnlockBtn: {
    height: 42,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: Palette.tierSovereign,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveUnlockBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.tierSovereign,
  },
});