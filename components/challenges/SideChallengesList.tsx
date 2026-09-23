import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { useChallenges, SideChallenge } from '@/context/ChallengesContext';

export function SideChallengesList() {
  const { colors, theme } = useAppTheme();
  const { data, progressSideChallenge } = useChallenges();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SIDE CHALLENGES</Text>
      <View style={styles.list}>
        {data.sideChallenges.map((challenge) => (
          <SideChallengeItem 
            key={challenge.id} 
            challenge={challenge} 
            onProgress={() => progressSideChallenge(challenge.id)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
}

function SideChallengeItem({ challenge, onProgress, colors, isDark }: { challenge: SideChallenge; onProgress: () => void; colors: any; isDark: boolean }) {
  
  const pct = challenge.totalDays > 0 ? challenge.currentDay / challenge.totalDays : 0;
  
  return (
    <LiquidGlassCard 
      intensity={isDark ? 20 : 50} 
      style={[styles.card, challenge.completed && { opacity: 0.6 }]}
      onPress={!challenge.completed ? onProgress : undefined}
    >
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{challenge.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {challenge.completed ? 'Completed' : `Day ${challenge.currentDay} of ${challenge.totalDays}`}
          </Text>
        </View>

        {challenge.completed ? (
          <CheckCircle2 size={24} color={colors.accent} />
        ) : (
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={[styles.pillFill, { backgroundColor: colors.accent, width: `${pct * 100}%` }]} />
            <Text style={[styles.pillText, { color: colors.textPrimary }]}>{Math.round(pct * 100)}%</Text>
          </View>
        )}
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  pill: {
    height: 28,
    width: 60,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pillFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    zIndex: 1,
  },
});
