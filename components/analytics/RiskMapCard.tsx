import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { AnalyticsData } from '@/services/analyticsService';

interface RiskMapCardProps {
  data: AnalyticsData | null;
}

export function RiskMapCard({ data }: RiskMapCardProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  if (!data) return null;

  const { morning, afternoon, evening, lateNight } = data.timeOfDayRisk;
  const total = morning + afternoon + evening + lateNight;
  
  const blocks = [
    { label: 'Morning', time: '05:00 - 12:00', count: morning },
    { label: 'Afternoon', time: '12:00 - 17:00', count: afternoon },
    { label: 'Evening', time: '17:00 - 22:00', count: evening },
    { label: 'Late Night', time: '22:00 - 05:00', count: lateNight },
  ];

  let maxBlock = blocks[0];
  for (const b of blocks) {
    if (b.count > maxBlock.count) maxBlock = b;
  }

  return (
    <LiquidGlassCard intensity={isDark ? 20 : 50} style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>VULNERABILITY MAP</Text>
        
        {total > 0 && maxBlock.count > 0 && (
          <View style={styles.badge}>
            <AlertTriangle size={12} color="#FF9F0A" />
            <Text style={styles.badgeText}>Peak Risk: {maxBlock.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.list}>
        {blocks.map((block) => {
          const pct = total > 0 ? (block.count / total) * 100 : 0;
          const isPeak = total > 0 && block === maxBlock;
          
          return (
            <View key={block.label} style={styles.row}>
              <View style={styles.labelCol}>
                <Text style={[styles.blockLabel, { color: colors.textPrimary }]}>{block.label}</Text>
                <Text style={[styles.blockTime, { color: colors.textSecondary }]}>{block.time}</Text>
              </View>
              <View style={styles.barCol}>
                <View style={[styles.trackBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <View style={[
                    styles.trackFill, 
                    { 
                      width: `${pct}%`,
                      backgroundColor: isPeak ? '#FF9F0A' : colors.accent 
                    }
                  ]} />
                </View>
              </View>
              <Text style={[styles.pctText, { color: colors.textPrimary }]}>{Math.round(pct)}%</Text>
            </View>
          );
        })}
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9F0A',
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelCol: {
    width: 90,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  blockTime: {
    fontSize: 10,
  },
  barCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  pctText: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
