import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface DrawerNavigation {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

import { useAppData } from '@/context/AppDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { Palette } from '@/constants/theme';
import { SleekChronometer } from '@/components/dashboard/SleekChronometer';
import { TodoModule } from '@/components/dashboard/modules/TodoModule';
import { JournalModule } from '@/components/dashboard/modules/JournalModule';
import { ChallengesModule } from '@/components/dashboard/modules/ChallengesModule';
import { AudioJournalCard } from '@/components/utilities/AudioJournalCard';

import { ResetConfirmationModal } from '@/components/dashboard/ResetConfirmationModal';
import { ImpulseNeutralizerModal } from '@/components/dashboard/ImpulseNeutralizerModal';
import { BreathingSphereModal } from '@/components/dashboard/BreathingSphereModal';
import { EmergencyModal } from '@/components/EmergencyModal';
import { startEmergencySession } from '@/services/commitments';
import { recordEmergencySession } from '@/services/analyticsService';
import { useNow } from '@/hooks/useNow';
import { calculateCleanDurationMs } from '@/services/chronometerEngine';
import { calculateCleanReceipt, formatMinutesReclaimed, formatMoneyKept } from '@/services/cleanReceipt';

export default function CommandDashboardScreen() {
  const { refreshState, state, openPaywall } = useAppData();
  const now = useNow(60_000);
  const { colors, theme } = useAppTheme();
  const { bestRecordMs, attemptCount } = state.profile;
  const { modal } = useLocalSearchParams<{ modal?: string }>();
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigation>();

  const [refreshing, setRefreshing] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [urgeModalVisible, setUrgeModalVisible] = useState(false);
  const [breathingModalVisible, setBreathingModalVisible] = useState(false);

  // Coordinate modal triggers (Air-gapped: no camera/optical modals)
  useEffect(() => {
    if (!modal) return;
    const normalized = modal.toLowerCase().trim();
    if (normalized === 'emergency' || normalized === 'panic' || normalized === 'circuit') {
      setEmergencyModalVisible(true);
    } else if (normalized === 'urge' || normalized === 'optical' || normalized === 'grounding') {
      setUrgeModalVisible(true);
    } else if (normalized === 'breathing' || normalized === 'vagus') {
      setBreathingModalVisible(true);
    } else if (normalized === 'reset' || normalized === 'slip') {
      setResetModalVisible(true);
    } else if (normalized === 'paywall' || normalized === 'sovereign') {
      // Deep-link trigger: open the single global paywall and clear the param.
      openPaywall();
      router.setParams({ modal: '' });
    }
  }, [modal]);

  const dismissModal = useCallback((setter: (visible: boolean) => void) => {
    setter(false);
    if (modal) router.setParams({ modal: '' });
  }, [modal, router]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refreshState();
    setRefreshing(false);
  }, [refreshState]);

  // Simple, friendly 5th-grade duration format
  const formatBestRecord = (ms: number) => {
    if (ms <= 0) return '0 Days';
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days === 0) return `${hours} Hours`;
    return `${days}d ${hours}h`;
  };

  const currentDay = Math.max(
    1,
    Math.floor(calculateCleanDurationMs(now, state.profile.startDate) / (24 * 60 * 60 * 1000)) + 1
  );
  const receipt = calculateCleanReceipt(
    calculateCleanDurationMs(now, state.profile.startDate),
    state.profile.weeklyCostEstimated,
    state.profile.dailyMinutesWasted
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        {/* Top-Left: Visible Hamburger Menu + User Profile Status Badge */}
        <View style={styles.headerLeftGroup}>
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openPaywall();
            }}
            style={[styles.headerProfileBadge, { backgroundColor: colors.glassSubtle, borderColor: colors.border }]}
            accessibilityLabel="View Profile and Current Run"
          >
            <View style={[styles.headerAvatarCircle, { backgroundColor: `${colors.accent}2E` }]}>
              <Ionicons name="person" size={12} color={colors.accent} />
            </View>
            <View>
              <Text style={[styles.headerBadgeSub, { color: colors.textSecondary }]}>CURRENT RUN</Text>
              <Text style={[styles.headerBadgeTitle, { color: colors.textPrimary }]}>Day {currentDay}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Top-Right: Prominent Emergency Circuit Breaker Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await startEmergencySession(15);
            await recordEmergencySession();
            setEmergencyModalVisible(true);
          }}
          style={[
            styles.headerEmergencyButton,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255, 69, 58, 0.15)' : 'rgba(215, 0, 21, 0.12)',
              borderColor: theme === 'dark' ? 'rgba(255, 69, 58, 0.4)' : 'rgba(215, 0, 21, 0.3)',
            },
          ]}
          accessibilityLabel="Emergency Button"
          accessibilityRole="button"
        >
          <Ionicons name="flame" size={15} color={theme === 'dark' ? '#FF453A' : '#D70015'} />
          <Text
            style={[
              styles.headerEmergencyText,
              { color: theme === 'dark' ? '#FF453A' : '#D70015' },
            ]}
          >
            Emergency
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textSecondary}
            />
          }
        >
          {/* Apple Fitness-Style Concentric Activity Rings */}
          <View style={styles.chronometerSection}>
            <SleekChronometer />
          </View>

          {/* Primary Interactive Controls (With Subtle Floating Shadows) */}
          <View style={styles.actionsContainer}>
            {/* Left: Beat the Urge Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setUrgeModalVisible(true);
              }}
              style={styles.floatingPillWrapper}
            >
              <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.floatingPill}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
                <Text style={[styles.floatingPillText, { color: colors.textPrimary }]}>Beat Urge</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Center Hero: Perfectly Circular Breathe Button (equal width and height with borderRadius 999) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setBreathingModalVisible(true);
              }}
              style={[
                styles.circularBreatheWrapper,
                {
                  borderColor: `${colors.accent}59`,
                  shadowColor: colors.accent,
                },
              ]}
              accessibilityLabel="Start Breathing Exercise"
            >
              <BlurView
                intensity={50}
                tint={theme === 'dark' ? 'dark' : 'light'}
                style={[
                  styles.circularBreatheContent,
                  { backgroundColor: `${colors.accent}14` },
                ]}
              >
                <Ionicons name="flower-outline" size={26} color={colors.accent} />
                <Text style={[styles.breatheLabel, { color: theme === 'dark' ? '#FFFFFF' : colors.textPrimary }]}>Breathe</Text>
              </BlurView>
            </TouchableOpacity>

            {/* Right: Reset Timer Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setResetModalVisible(true);
              }}
              style={styles.floatingPillWrapper}
            >
              <BlurView intensity={40} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.floatingPill}>
                <Ionicons name="refresh" size={15} color="#8E929B" />
                <Text style={[styles.floatingPillText, { color: colors.textPrimary }]}>Reset Timer</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Simplified Stats Cards (5th-grade language) */}
          <View style={styles.statsSection}>
            <Text style={[styles.statsSectionHeader, { color: colors.textSecondary }]}>YOUR PROGRESS</Text>
            <View style={[styles.statsGrid, { backgroundColor: colors.glassSubtle, borderColor: colors.border }]}>
              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>BEST STREAK</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatBestRecord(bestRecordMs)}</Text>
                <Text style={styles.statSub}>Personal Record</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>CURRENT TRY</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>Attempt #{attemptCount}</Text>
                <Text style={styles.statSub}>Active Streak</Text>
              </View>
            </View>
            <View style={[styles.statsGrid, styles.receiptGrid, { backgroundColor: colors.glassSubtle, borderColor: colors.border }]}>
              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KEPT</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatMoneyKept(receipt.moneyKept)}</Text>
                <Text style={styles.statSub}>Not spent</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statCard}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TIME BACK</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatMinutesReclaimed(receipt.minutesReclaimed)}</Text>
                <Text style={styles.statSub}>From your estimate</Text>
              </View>
            </View>
          </View>

          {/* Utility Modules */}
          <View style={styles.utilitySection}>
            <TodoModule />
            <JournalModule />
            <AudioJournalCard />
            <ChallengesModule />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action Modals (Air-Gapped: Zero Camera / Zero Sensor Transmission) */}
      <EmergencyModal
        visible={emergencyModalVisible}
        onClose={() => dismissModal(setEmergencyModalVisible)}
      />
      <ResetConfirmationModal
        visible={resetModalVisible}
        onClose={() => dismissModal(setResetModalVisible)}
      />
      <ImpulseNeutralizerModal
        visible={urgeModalVisible}
        onClose={() => dismissModal(setUrgeModalVisible)}
      />
      <BreathingSphereModal
        visible={breathingModalVisible}
        onClose={() => dismissModal(setBreathingModalVisible)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMenuButton: {
    padding: 6,
    marginLeft: -4,
  },
  headerProfileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  headerAvatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeSub: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerBadgeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerEmergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 59, 48, 0.35)',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerEmergencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingBottom: 120,
    alignItems: 'center',
  },
  chronometerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 12,
  },
  floatingPillWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  floatingPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Perfectly circular Breathe button (equal width and height with borderRadius 999)
  circularBreatheWrapper: {
    width: 76,
    height: 76,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(46, 242, 184, 0.35)',
    shadowColor: '#2EF2B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  circularBreatheContent: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 242, 184, 0.08)',
  },
  breatheLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statsSection: {
    width: '90%',
    maxWidth: 360,
    marginTop: 8,
  },
  utilitySection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  statsSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 0.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  receiptGrid: {
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statSub: {
    fontSize: 9,
    color: 'rgba(150, 150, 150, 0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
  },
});