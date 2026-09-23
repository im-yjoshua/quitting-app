import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Siren, Target, CalendarDays, Flame } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { AnalyticsData } from '@/services/analyticsService';

interface MetricCardsGridProps {
  data: AnalyticsData | null;
}

export function MetricCardsGrid({ data }: MetricCardsGridProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  if (!data) return null;

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <MetricCard 
          title="Commitment" 
          value={`${data.commitmentRate.toFixed(1)}%`} 
          subtitle="Discipline Score" 
          icon={<Target size={20} color={colors.accent} />}
          colors={colors}
          isDark={isDark}
        />
        <MetricCard 
          title="Clean Days" 
          value={`${data.cleanDays}`} 
          subtitle={`/ ${data.totalDaysLogged} Days Logged`} 
          icon={<CalendarDays size={20} color={colors.accent} />}
          colors={colors}
          isDark={isDark}
        />
      </View>
      <View style={styles.row}>
        <MetricCard 
          title="Active Streak" 
          value={`${data.currentStreakDays}d`} 
          subtitle={`Record: ${data.recordStreakDays}d`} 
          icon={<Flame size={20} color={colors.accent} />}
          colors={colors}
          isDark={isDark}
        />
        <MetricCard 
          title="Emergency Sessions" 
          value={`${data.emergencySessions}`} 
          subtitle="Urge Circuit-Breakers Used" 
          icon={<Siren size={20} color={colors.accent} />}
          colors={colors}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

function MetricCard({ title, value, subtitle, icon, colors, isDark }: any) {
  return (
    <LiquidGlassCard intensity={isDark ? 20 : 50} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.accentSubtle }]}>
          {icon}
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
  },
});
