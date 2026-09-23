import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UtilityCard } from '../UtilityCard';
import { useAppTheme } from '../../../context/ThemeContext';

const STORAGE_KEY = '@sovereign_daily_challenges';

interface ChallengeItem {
  id: string;
  text: string;
  completed: boolean;
  tag: string;
}

const DEFAULT_CHALLENGES: ChallengeItem[] = [
  { id: '1', text: '5-minute deep breathing', completed: false, tag: 'Calm' },
  { id: '2', text: 'Drink 2 liters of water', completed: false, tag: 'Body' },
  { id: '3', text: '15-minute walk outside', completed: false, tag: 'Mind' },
  { id: '4', text: 'No screens 30 mins before sleep', completed: false, tag: 'Habit' },
];

export function ChallengesModule() {
  const { colors } = useAppTheme();
  const [challenges, setChallenges] = useState<ChallengeItem[]>(DEFAULT_CHALLENGES);

  // Hydrate stored challenges
  useEffect(() => {
    async function loadChallenges() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setChallenges(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load daily challenges:', err);
      }
    }
    loadChallenges();
  }, []);

  const persistChallenges = async (updated: ChallengeItem[]) => {
    setChallenges(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist daily challenges:', err);
    }
  };

  const toggleChallenge = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = challenges.map((c) =>
      c.id === id ? { ...c, completed: !c.completed } : c
    );
    persistChallenges(updated);
  };

  const completedCount = challenges.filter((c) => c.completed).length;

  const headerAction = (
    <View style={styles.progressBadge}>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        {completedCount} OF {challenges.length} DONE
      </Text>
    </View>
  );

  return (
    <UtilityCard title="Daily Challenges" headerAction={headerAction}>
      <View style={styles.list}>
        {challenges.map((challenge) => {
          return (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeCard,
                {
                  backgroundColor: colors.glassSubtle,
                  borderColor: challenge.completed
                    ? 'rgba(255, 255, 255, 0.04)'
                    : colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => toggleChallenge(challenge.id, challenge.completed)}
              accessibilityLabel={`Challenge: ${challenge.text}. ${challenge.completed ? 'Completed' : 'Incomplete'}`}
            >
              {/* Interactive Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: challenge.completed
                      ? colors.accent
                      : colors.textSecondary,
                    backgroundColor: challenge.completed
                      ? colors.accent
                      : 'transparent',
                  },
                ]}
              >
                {challenge.completed && (
                  <Ionicons name="star" size={11} color="#000000" />
                )}
              </View>

              {/* Challenge Text */}
              <Text
                style={[
                  styles.challengeText,
                  {
                    color: challenge.completed
                      ? colors.textSecondary
                      : colors.textPrimary,
                    textDecorationLine: challenge.completed
                      ? 'line-through'
                      : 'none',
                  },
                ]}
              >
                {challenge.text}
              </Text>

              {/* Category Tag Highlight in Secondary Color */}
              <View
                style={[
                  styles.tagBadge,
                  {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  },
                ]}
              >
                <Text
                  style={[styles.tagText, { color: colors.textSecondary }]}
                >
                  {challenge.tag}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </UtilityCard>
  );
}

const styles = StyleSheet.create({
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: 8,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as any } : {}),
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
