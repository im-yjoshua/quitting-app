import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/context/ThemeContext';
import {
  DailyChallenge,
  getChallenges,
  saveChallenges,
} from '@/services/legacyStorage';
// Single app-wide local YYYY-MM-DD day key (services/chronometerEngine.ts).
import { getLocalDateKey } from '@/services/chronometerEngine';

export function ChallengesCard() {
  const { colors, theme } = useAppTheme();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load challenges and automatically apply daily reset logic
  useEffect(() => {
    async function load() {
      try {
        const synchronized = await getChallenges();
        setChallenges(synchronized);
      } catch (err) {
        console.warn('[ChallengesCard] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleChallenge = async (id: string, currentlyCompleted: boolean) => {
    const todayStr = getLocalDateKey(Date.now());

    if (!currentlyCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = challenges.map((c) => {
      if (c.id === id) {
        const nextCompleted = !currentlyCompleted;
        return {
          ...c,
          completed: nextCompleted,
          lastCompletedDate: nextCompleted ? todayStr : undefined,
        };
      }
      return c;
    });

    setChallenges(updated);
    await saveChallenges(updated);
  };

  const isDark = theme === 'dark';
  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
        },
      ]}
    >
      <BlurView
        intensity={35}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContent}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="flame-outline" size={15} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
              DAILY SOMATIC CHALLENGES
            </Text>
          </View>

          {challenges.length > 0 && (
            <View
              style={[
                styles.progressBadge,
                {
                  backgroundColor: completedCount === challenges.length
                    ? `${colors.accent}2E`
                    : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: completedCount === challenges.length
                    ? colors.accent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.progressText,
                  {
                    color: completedCount === challenges.length
                      ? colors.accent
                      : colors.textSecondary,
                  },
                ]}
              >
                {completedCount} OF {challenges.length} DONE
              </Text>
            </View>
          )}
        </View>

        {/* Challenges List */}
        <View style={styles.listContainer}>
          {!isLoading && challenges.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="trophy-outline"
                size={22}
                color={colors.textSecondary}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                All daily challenges cleared. Resilience compounds every day.
              </Text>
            </View>
          ) : (
            challenges.map((challenge, index) => {
              const isLast = index === challenges.length - 1;
              return (
                <View key={challenge.id} style={styles.challengeItemWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleChallenge(challenge.id, challenge.completed)}
                    style={styles.challengeRow}
                    accessibilityLabel={`Toggle challenge: ${challenge.title}`}
                  >
                    <View
                      style={[
                        styles.checkboxCircle,
                        {
                          borderColor: challenge.completed
                            ? colors.accent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.25)'
                            : 'rgba(0, 0, 0, 0.25)',
                          backgroundColor: challenge.completed
                            ? colors.accent
                            : 'transparent',
                        },
                      ]}
                    >
                      {challenge.completed && (
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.challengeTitle,
                        {
                          color: challenge.completed
                            ? colors.textSecondary
                            : colors.textPrimary,
                          textDecorationLine: challenge.completed
                            ? 'line-through'
                            : 'none',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {challenge.title}
                    </Text>
                  </TouchableOpacity>

                  {!isLast && (
                    <View
                      style={[
                        styles.hairlineDivider,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
      </BlurView>
    </View>
  );
}

export default ChallengesCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as any } : {}),
  },
  blurContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  progressText: {
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.6,
  },
  listContainer: {
    marginTop: 2,
  },
  challengeItemWrapper: {
    paddingVertical: 6,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    marginBottom: 6,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
  },
});
