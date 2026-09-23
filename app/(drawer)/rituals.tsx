import React, { useEffect, useRef, useState } from 'react';
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
import { loadTodayRitualChecks, saveRitualChecks } from '../../services/ritualChecklist';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { SovereignLockPill } from '../../components/monetization/SovereignLockPill';



interface RitualItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AM_RITUALS: RitualItem[] = [
  {
    id: 'am_hydrate_splash',
    title: 'Cold Shock & Immediate Hydration',
    description: 'Drink 500ml water + ice cold splash to activate cortisol awakening response naturally.',
    icon: 'water-outline',
  },
  {
    id: 'am_sunlight',
    title: '10 Minutes Direct Solar Photons',
    description: 'Outdoor light exposure without sunglasses to set suprachiasmatic biological clock.',
    icon: 'sunny-outline',
  },
  {
    id: 'am_screen_free',
    title: 'First 60 Minutes Screen-Free',
    description: 'Zero notifications or feed consumption during initial neurochemical reboot.',
    icon: 'phone-portrait-outline',
  },
];

const PM_RITUALS: RitualItem[] = [
  {
    id: 'pm_relocate_charger',
    title: 'Device Quarantine (>5 Feet Away)',
    description: 'Relocate charger beyond arm reach from bed. Eliminate late-night physical access.',
    icon: 'bed-outline',
  },
  {
    id: 'pm_cut_screens',
    title: 'Blue Light Cutoff (60m Prior)',
    description: 'Prevent pineal gland melatonin suppression before deep sleep onset.',
    icon: 'moon-outline',
  },
  {
    id: 'pm_victory_audit',
    title: 'Daily Sovereign Audit',
    description: 'Log clean day execution and attribute any urges conquered to memory.',
    icon: 'checkmark-circle-outline',
  },
];

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RitualsScreen() {
  const { state, completeCircadianRitual, isSovereignUser, openPaywall } = useAppData();
  const { colors, theme } = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();

  const todayKey = getTodayKey();
  const todayRecord = state.circadianHistory[todayKey] || {
    dateString: todayKey,
    amCompleted: false,
    amCompletedAt: null,
    pmCompleted: false,
    pmCompletedAt: null,
    multiplierActive: false,
  };

  const isDark = theme === 'dark';

  // Checkbox state is persisted per local day via services/ritualChecklist.ts —
  // it used to be local-only and reset on every revisit.
  const [checkedAmItems, setCheckedAmItems] = useState<Record<string, boolean>>({});
  const [checkedPmItems, setCheckedPmItems] = useState<Record<string, boolean>>({});
  // Refs mirror state so persisted writes always snapshot the latest values,
  // even when toggles land in quick succession.
  const checkedAmRef = useRef<Record<string, boolean>>({});
  const checkedPmRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadTodayRitualChecks();
      if (cancelled) return;
      checkedAmRef.current = saved.am;
      checkedPmRef.current = saved.pm;
      setCheckedAmItems(saved.am);
      setCheckedPmItems(saved.pm);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistChecks = (am: Record<string, boolean>, pm: Record<string, boolean>) => {
    void saveRitualChecks({ am, pm });
  };

  const toggleAmItem = (id: string) => {
    Haptics.selectionAsync();
    const next = { ...checkedAmRef.current, [id]: !checkedAmRef.current[id] };
    checkedAmRef.current = next;
    setCheckedAmItems(next);
    persistChecks(next, checkedPmRef.current);
  };

  const togglePmItem = (id: string) => {
    Haptics.selectionAsync();
    const next = { ...checkedPmRef.current, [id]: !checkedPmRef.current[id] };
    checkedPmRef.current = next;
    setCheckedPmItems(next);
    persistChecks(checkedAmRef.current, next);
  };

  const handleCompleteAmPhase = async () => {
    if (todayRecord.amCompleted) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeCircadianRitual('am');
  };

  const handleCompletePmPhase = async () => {
    if (todayRecord.pmCompleted) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeCircadianRitual('pm');
  };

  const formatTimestamp = (epochMs: number | null) => {
    if (!epochMs) return null;
    const d = new Date(epochMs);
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const amAllChecked = AM_RITUALS.every((r) => checkedAmItems[r.id]);
  const pmAllChecked = PM_RITUALS.every((r) => checkedPmItems[r.id]);

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
          <Ionicons name="shield-checkmark" size={13} color={Palette.signalSuccess} />
          <Text style={styles.kicker}>DAILY HABITS</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Habits</Text>
        <Text style={styles.subtitle}>
          Build good morning and evening routines to earn your daily streak bonus.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Circadian Multiplier Glass HUD */}
        <View style={styles.multiplierCardWrapper}>
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.multiplierCard}
          >
            <LinearGradient
              colors={
                todayRecord.multiplierActive
                  ? ['rgba(48, 209, 88, 0.22)', 'rgba(48, 209, 88, 0.02)']
                  : Palette.specularGradient
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={Palette.specularGradient}
              style={styles.specularBorder}
              pointerEvents="none"
            />

            <View style={styles.multiplierHeaderRow}>
              <View>
                <Text style={styles.multiplierKicker}>REPUTATION MULTIPLIER</Text>
                <Text style={styles.multiplierTitle}>1.25x Daily Bonus</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  todayRecord.multiplierActive && styles.statusBadgeActive,
                ]}
              >
                <Ionicons
                  name={todayRecord.multiplierActive ? 'flash' : 'lock-closed'}
                  size={12}
                  color={todayRecord.multiplierActive ? Palette.signalSuccess : Palette.textMuted}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    todayRecord.multiplierActive && { color: Palette.signalSuccess },
                  ]}
                >
                  {todayRecord.multiplierActive ? 'ACTIVE' : 'LOCKED'}
                </Text>
              </View>
            </View>

            <View style={styles.multiplierAuditRow}>
              <View style={styles.auditIndicator}>
                <Ionicons
                  name={todayRecord.amCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={todayRecord.amCompleted ? Palette.signalSuccess : Palette.textMuted}
                />
                <Text style={styles.auditIndicatorText}>
                  AM Launch: {todayRecord.amCompleted ? formatTimestamp(todayRecord.amCompletedAt) : 'Pending'}
                </Text>
              </View>
              <View style={styles.auditIndicator}>
                <Ionicons
                  name={todayRecord.pmCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={todayRecord.pmCompleted ? Palette.signalSuccess : Palette.textMuted}
                />
                <Text style={styles.auditIndicatorText}>
                  PM Lockdown: {todayRecord.pmCompleted ? formatTimestamp(todayRecord.pmCompletedAt) : 'Pending'}
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Section 1: AM Dawn Launch */}
        <View style={styles.phaseSection}>
          <View style={styles.phaseHeaderRow}>
            <View>
              <Text style={styles.phaseKicker}>WINDOW: 06:00 – 10:00</Text>
              <Text style={styles.phaseTitle}>AM Dawn Launch</Text>
            </View>
            {todayRecord.amCompleted && (
              <View style={styles.completedTag}>
                <Ionicons name="checkmark" size={12} color={Palette.signalSuccess} />
                <Text style={styles.completedTagText}>SEALED</Text>
              </View>
            )}
          </View>

          <View style={styles.ritualList}>
            {AM_RITUALS.map((item) => {
              const isChecked = todayRecord.amCompleted || !!checkedAmItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  disabled={todayRecord.amCompleted}
                  onPress={() => toggleAmItem(item.id)}
                  style={[
                    styles.ritualCardWrapper,
                    isChecked && styles.ritualCardWrapperChecked,
                  ]}
                >
                  <BlurView
                    intensity={isChecked ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.ritualCard}
                  >
                    <View style={styles.ritualIconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isChecked ? Palette.signalSuccess : Palette.textSecondary}
                      />
                    </View>
                    <View style={styles.ritualTextContainer}>
                      <Text style={[styles.ritualTitle, isChecked && styles.ritualTitleChecked]}>
                        {item.title}
                      </Text>
                      <Text style={styles.ritualDescription}>{item.description}</Text>
                    </View>
                    <View style={[styles.checkboxCircle, isChecked && styles.checkboxCircleActive]}>
                      {isChecked && <Ionicons name="checkmark" size={13} color="#000000" />}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>

          {!todayRecord.amCompleted && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCompleteAmPhase}
              style={[
                styles.sealPhaseButton,
                amAllChecked && styles.sealPhaseButtonReady,
              ]}
            >
              <LinearGradient
                colors={amAllChecked ? Palette.specularGradient : ['transparent', 'transparent']}
                style={styles.absoluteFill}
              />
              <Text style={[styles.sealPhaseButtonText, amAllChecked && styles.sealPhaseButtonTextReady]}>
                {amAllChecked ? 'SEAL AM DAWN LAUNCH' : 'CONFIRM ALL 3 TO SEAL DAWN'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section 2: PM Lockdown */}
        <View style={styles.phaseSection}>
          <View style={styles.phaseHeaderRow}>
            <View>
              <Text style={styles.phaseKicker}>WINDOW: 20:00 – 23:00</Text>
              <Text style={styles.phaseTitle}>PM Perimeter Lockdown</Text>
            </View>
            {todayRecord.pmCompleted && (
              <View style={styles.completedTag}>
                <Ionicons name="checkmark" size={12} color={Palette.signalSuccess} />
                <Text style={styles.completedTagText}>SEALED</Text>
              </View>
            )}
          </View>

          <View style={styles.ritualList}>
            {PM_RITUALS.map((item) => {
              const isChecked = todayRecord.pmCompleted || !!checkedPmItems[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  disabled={todayRecord.pmCompleted}
                  onPress={() => togglePmItem(item.id)}
                  style={[
                    styles.ritualCardWrapper,
                    isChecked && styles.ritualCardWrapperChecked,
                  ]}
                >
                  <BlurView
                    intensity={isChecked ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.ritualCard}
                  >
                    <View style={styles.ritualIconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={isChecked ? Palette.signalSuccess : Palette.textSecondary}
                      />
                    </View>
                    <View style={styles.ritualTextContainer}>
                      <Text style={[styles.ritualTitle, isChecked && styles.ritualTitleChecked]}>
                        {item.title}
                      </Text>
                      <Text style={styles.ritualDescription}>{item.description}</Text>
                    </View>
                    <View style={[styles.checkboxCircle, isChecked && styles.checkboxCircleActive]}>
                      {isChecked && <Ionicons name="checkmark" size={13} color="#000000" />}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>

          {!todayRecord.pmCompleted && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCompletePmPhase}
              style={[
                styles.sealPhaseButton,
                pmAllChecked && styles.sealPhaseButtonReady,
              ]}
            >
              <LinearGradient
                colors={pmAllChecked ? Palette.specularGradient : ['transparent', 'transparent']}
                style={styles.absoluteFill}
              />
              <Text style={[styles.sealPhaseButtonText, pmAllChecked && styles.sealPhaseButtonTextReady]}>
                {pmAllChecked ? 'SEAL PM LOCKDOWN' : 'CONFIRM ALL 3 TO SEAL LOCKDOWN'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section 3: Custom Circadian Configuration (Sovereign Gated) */}
        <View style={styles.phaseSection}>
          <View style={styles.phaseHeaderRow}>
            <View>
              <Text style={styles.phaseKicker}>CUSTOM SETTINGS</Text>
              <Text style={styles.phaseTitle}>Custom Defense Protocols</Text>
            </View>
            {!isSovereignUser && (
              <SovereignLockPill
                size="sm"
                onPress={() => openPaywall()}
              />
            )}
          </View>

          <TouchableOpacity
            activeOpacity={isSovereignUser ? 0.9 : 0.85}
            onPress={() => {
              if (!isSovereignUser) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                openPaywall();
              }
            }}
            style={styles.customConfigCardWrapper}
          >
            <BlurView
              intensity={GlassBlur.intensity.standard}
              tint={GlassBlur.tint}
              blurMethod={GlassBlur.blurMethod}
              style={styles.customConfigCard}
            >
              <LinearGradient
                colors={
                  isSovereignUser
                    ? ['rgba(255, 215, 0, 0.12)', 'rgba(255, 159, 10, 0.02)']
                    : Palette.specularGradient
                }
                style={styles.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.configParamRow}>
                <View style={styles.configParamInfo}>
                  <Ionicons name="time-outline" size={16} color={Palette.tierSovereign} />
                  <Text style={styles.configParamLabel}>AM Launch Window</Text>
                </View>
                <Text style={styles.configParamValue}>
                  {isSovereignUser ? '06:00 – 10:00 (Custom)' : '06:00 – 10:00 (Locked)'}
                </Text>
              </View>

              <View style={styles.configDivider} />

              <View style={styles.configParamRow}>
                <View style={styles.configParamInfo}>
                  <Ionicons name="moon-outline" size={16} color={Palette.signalCold} />
                  <Text style={styles.configParamLabel}>PM Lockdown Window</Text>
                </View>
                <Text style={styles.configParamValue}>
                  {isSovereignUser ? '20:00 – 23:00 (Custom)' : '20:00 – 23:00 (Locked)'}
                </Text>
              </View>

              <View style={styles.configDivider} />

              <View style={styles.configParamRow}>
                <View style={styles.configParamInfo}>
                  <Ionicons name="shield-outline" size={16} color={Palette.signalSuccess} />
                  <Text style={styles.configParamLabel}>Daily Bonus Saver</Text>
                </View>
                <Text style={styles.configParamValue}>
                  {isSovereignUser ? '1.25x Dynamic Boost' : '1.25x Standard'}
                </Text>
              </View>

              {!isSovereignUser && (
                <View style={styles.configUnlockBanner}>
                  <Text style={styles.configUnlockBannerText}>
                    CONFIGURE CUSTOM WINDOWS // SOVEREIGN
                  </Text>
                </View>
              )}
            </BlurView>
          </TouchableOpacity>
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
    color: Palette.signalSuccess,
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
  multiplierCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
    marginBottom: Layout.spacing.xl,
    ...Shadows.subtleSpecular,
  },
  multiplierCard: {
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
  multiplierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  multiplierKicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.signalSuccess,
    marginBottom: 2,
  },
  multiplierTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: Palette.signalSuccess,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  multiplierAuditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  auditIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditIndicatorText: {
    fontSize: 11,
    color: Palette.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  phaseSection: {
    marginBottom: Layout.spacing.xl,
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  phaseKicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Palette.textMuted,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  completedTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.signalSuccess,
  },
  ritualList: {
    gap: 10,
    marginBottom: Layout.spacing.md,
  },
  ritualCardWrapper: {
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  ritualCardWrapperChecked: {
    borderColor: 'rgba(48, 209, 88, 0.35)',
  },
  ritualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  ritualIconContainer: {
    marginRight: 12,
  },
  ritualTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  ritualTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.textSecondary,
    marginBottom: 2,
  },
  ritualTitleChecked: {
    color: Palette.textPrimary,
  },
  ritualDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: Palette.textMuted,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Palette.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: Palette.signalSuccess,
    borderColor: Palette.signalSuccess,
  },
  sealPhaseButton: {
    height: 46,
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  sealPhaseButtonReady: {
    backgroundColor: 'rgba(48, 209, 88, 0.10)',
    borderColor: Palette.signalSuccess,
    ...Shadows.emeraldGlow,
  },
  sealPhaseButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textSecondary,
  },
  sealPhaseButtonTextReady: {
    color: Palette.signalSuccess,
  },
  customConfigCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...Shadows.amberGlow,
  },
  customConfigCard: {
    padding: Layout.spacing.lg,
    backgroundColor: Palette.glassSurface,
    gap: 12,
  },
  configParamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configParamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configParamLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  configParamValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.tierSovereign,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  configDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  configUnlockBanner: {
    marginTop: Layout.spacing.xs,
    height: 38,
    borderRadius: Layout.radius.sm,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configUnlockBannerText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.tierSovereign,
  },
});