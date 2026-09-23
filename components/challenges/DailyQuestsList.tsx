import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dumbbell, Brain, Zap, Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { useChallenges, DailyQuest } from '@/context/ChallengesContext';

export function DailyQuestsList() {
  const { colors, theme } = useAppTheme();
  const { data, completeDailyQuest } = useChallenges();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DAILY PROTOCOLS</Text>
      <View style={styles.list}>
        {data.dailyQuests.map((quest) => (
          <QuestItem 
            key={quest.id} 
            quest={quest} 
            onComplete={() => completeDailyQuest(quest.id)} 
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
}

function QuestItem({ quest, onComplete, colors, isDark }: { quest: DailyQuest; onComplete: () => void; colors: any; isDark: boolean }) {
  const scaleAnim = useSharedValue(quest.completed ? 1 : 0.9);

  React.useEffect(() => {
    scaleAnim.value = withSpring(quest.completed ? 1 : 0.95, { damping: 12, stiffness: 200 });
  }, [quest.completed]);

  const animatedCheck = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: quest.completed ? 1 : 0,
  }));

  const getIcon = () => {
    switch (quest.category) {
      case 'Physical': return <Dumbbell size={20} color={quest.completed ? colors.accent : colors.textPrimary} />;
      case 'Mind': return <Brain size={20} color={quest.completed ? colors.accent : colors.textPrimary} />;
      case 'Discipline': return <Zap size={20} color={quest.completed ? colors.accent : colors.textPrimary} />;
      default: return null;
    }
  };

  return (
    <LiquidGlassCard 
      intensity={isDark ? 20 : 50} 
      style={styles.card}
      onPress={!quest.completed ? onComplete : undefined}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>{quest.category}</Text>
          <Text style={[
            styles.title, 
            { color: colors.textPrimary },
            quest.completed && { textDecorationLine: 'line-through', opacity: 0.5 }
          ]}>
            {quest.title}
          </Text>
        </View>
        
        <View style={[styles.checkboxContainer, { borderColor: quest.completed ? colors.accent : colors.border }]}>
          <Animated.View style={[styles.checkboxFill, { backgroundColor: colors.accent }, animatedCheck]}>
            <Check size={14} color="#FFF" />
          </Animated.View>
        </View>
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
    padding: 12,
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkboxContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  checkboxFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
