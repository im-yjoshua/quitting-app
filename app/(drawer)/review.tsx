import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAppData } from '@/context/AppDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { formatMinutesReclaimed, formatMoneyKept } from '@/services/cleanReceipt';
import {
  TRIGGER_LABEL,
  buildWeeklyReview,
  formatDayLabel,
  formatWeekLabel,
  shiftWeek,
  slipPattern,
  startOfLocalWeek,
} from '@/services/weeklyReview';

interface DrawerNavigation {
  openDrawer: () => void;
}

export default function WeeklyReviewScreen() {
  const { state, isSovereignUser, openPaywall } = useAppData();
  const { colors, theme } = useAppTheme();
  const navigation = useNavigation<DrawerNavigation>();
  const currentWeek = startOfLocalWeek(Date.now());
  const [weekStart, setWeekStart] = useState(currentWeek);
  const review = buildWeeklyReview(state, weekStart, Date.now());
  const pattern = isSovereignUser ? slipPattern(state) : null;
  const isCurrentWeek = weekStart === currentWeek;

  const goBack = () => {
    Haptics.selectionAsync();
    if (!isSovereignUser) {
      openPaywall();
      return;
    }
    setWeekStart((value) => shiftWeek(value, -1));
  };

  const shareReview = async () => {
    const lines = [
      `Sovereign week of ${formatWeekLabel(review.weekStartMs)}`,
      `Urges faced: ${review.urgesFaced}`,
      `Slips: ${review.slips}`,
      `Rituals kept: ${review.ritualsKept} of 14`,
      `Money kept: ${formatMoneyKept(review.moneyKept)}`,
      `Time back: ${formatMinutesReclaimed(review.minutesReclaimed)}`,
      review.topTrigger ? `Top trigger: ${TRIGGER_LABEL[review.topTrigger]}` : 'Top trigger: none',
      review.bestDay ? `Best day: ${formatDayLabel(review.bestDay)}` : 'Best day: none yet',
      review.worstDay ? `Hardest day: ${formatDayLabel(review.worstDay)}` : 'Hardest day: none',
    ];
    if (pattern) {
      lines.push(`${TRIGGER_LABEL[pattern.trigger]} is ${pattern.percent}% of your slips (${pattern.count} of ${pattern.total}).`);
    }
    try {
      const file = new File(Paths.document, `sovereign-week-${review.weekStartMs}.txt`);
      file.write(lines.join('\n'));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: 'Save this week' });
      }
    } catch (error) {
      console.warn('Failed to share the weekly review:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} accessibilityLabel="Open Navigation Menu">
          <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>This Week</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.weekRow}>
          <TouchableOpacity onPress={goBack} accessibilityLabel="Previous week">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.weekLabel, { color: colors.textPrimary }]}>{formatWeekLabel(weekStart)}</Text>
          <TouchableOpacity
            disabled={isCurrentWeek}
            onPress={() => setWeekStart((value) => shiftWeek(value, 1))}
            accessibilityLabel="Next week"
          >
            <Ionicons name="chevron-forward" size={22} color={isCurrentWeek ? colors.border : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.grid, { borderColor: colors.border, backgroundColor: colors.glassSubtle }]}>
          <Stat label="URGES FACED" value={String(review.urgesFaced)} />
          <Stat label="SLIPS" value={String(review.slips)} />
          <Stat label="RITUALS" value={`${review.ritualsKept}/14`} />
          <Stat label="KEPT" value={formatMoneyKept(review.moneyKept)} />
          <Stat label="TIME BACK" value={formatMinutesReclaimed(review.minutesReclaimed)} />
          <Stat label="TOP TRIGGER" value={review.topTrigger ? TRIGGER_LABEL[review.topTrigger] : 'None'} />
        </View>

        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Best day: {review.bestDay ? formatDayLabel(review.bestDay) : 'None yet'}
        </Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Hardest day: {review.worstDay ? formatDayLabel(review.worstDay) : 'None'}
        </Text>

        {pattern && (
          <Text style={[styles.pattern, { color: colors.textPrimary }]}>
            {TRIGGER_LABEL[pattern.trigger]} is {pattern.percent}% of your slips ({pattern.count} of {pattern.total}).
          </Text>
        )}

        {!isSovereignUser && (
          <TouchableOpacity onPress={openPaywall} style={styles.lockRow}>
            <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
            <Text style={[styles.lockText, { color: colors.textSecondary }]}>
              Earlier weeks and your slip pattern are part of Sovereign.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={shareReview} style={[styles.share, { borderColor: colors.border }]}>
          <Text style={[styles.shareText, { color: colors.textPrimary }]}>Save this week</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekLabel: { fontSize: 16, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 0.5,
    borderRadius: 18,
    paddingVertical: 8,
  },
  stat: { width: '33%', paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  line: { fontSize: 15, fontWeight: '600', marginTop: 14 },
  pattern: { fontSize: 16, fontWeight: '700', marginTop: 18 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  lockText: { flex: 1, fontSize: 13 },
  share: {
    marginTop: 22,
    borderWidth: 0.5,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  shareText: { fontSize: 15, fontWeight: '700' },
});
