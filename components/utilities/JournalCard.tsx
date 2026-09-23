import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/context/ThemeContext';
import {
  JournalEntry,
  getJournalEntries,
  saveJournalEntries,
} from '@/services/legacyStorage';

export function JournalCard() {
  const { colors, theme } = useAppTheme();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [titleText, setTitleText] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const titleInputRef = useRef<TextInput>(null);

  // Reanimated spring expansion physics
  const inputHeight = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  // Hydrate stored reflections on initial mount
  useEffect(() => {
    async function load() {
      try {
        const stored = await getJournalEntries();
        setEntries(stored);
      } catch (err) {
        console.warn('[JournalCard] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const openAddForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAdding(true);
    inputHeight.value = withSpring(145, { damping: 18, stiffness: 90 });
    inputOpacity.value = withSpring(1, { damping: 18, stiffness: 90 });
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 60);
  };

  const closeAddForm = () => {
    Keyboard.dismiss();
    setTitleText('');
    setBodyText('');
    setIsAdding(false);
    setIsFocused(false);
    inputHeight.value = withSpring(0, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(0, { damping: 20, stiffness: 90 });
  };

  const handleSaveEntry = async () => {
    const trimmedBody = bodyText.trim();
    const trimmedTitle = titleText.trim();

    if (!trimmedBody && !trimmedTitle) {
      closeAddForm();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const timestampTag = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      timestamp: timestampTag,
      title: trimmedTitle || 'Daily Reflection',
      body: trimmedBody || trimmedTitle,
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    closeAddForm();
    await saveJournalEntries(updated);
  };

  const handleDeleteEntry = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    await saveJournalEntries(updated);
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    maxHeight: inputHeight.value,
    opacity: inputOpacity.value,
  }));

  const isDark = theme === 'dark';

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
            <Ionicons name="book-outline" size={15} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
              REFLECTIONS & JOURNAL
            </Text>
          </View>

          {!isAdding && (
            <TouchableOpacity
              onPress={openAddForm}
              activeOpacity={0.7}
              style={[
                styles.addActionButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              accessibilityLabel="Add new reflection"
            >
              <Ionicons name="add" size={13} color={colors.textPrimary} />
              <Text style={[styles.addBtnText, { color: colors.textPrimary }]}>Record</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expandable Add Input Container */}
        {isAdding && (
          <Animated.View style={[styles.inputExpansionWrapper, animatedInputStyle]}>
            <View
              style={[
                styles.textInputBox,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isFocused ? colors.accent : isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <TextInput
                ref={titleInputRef}
                value={titleText}
                onChangeText={setTitleText}
                placeholder="Title (e.g. Urge Surfed, Mental Clarity)"
                placeholderTextColor={colors.textSecondary}
                style={[styles.titleInput, { color: colors.textPrimary }]}
                maxLength={60}
                returnKeyType="next"
              />
              <TextInput
                value={bodyText}
                onChangeText={setBodyText}
                placeholder="Document your mindset through the friction..."
                placeholderTextColor={colors.textSecondary}
                multiline
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={[styles.bodyInput, { color: colors.textPrimary }]}
                maxLength={400}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={closeAddForm}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEntry}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: (titleText.trim() || bodyText.trim()) ? 1 : 0.4,
                  },
                ]}
                activeOpacity={0.8}
                disabled={!titleText.trim() && !bodyText.trim()}
              >
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Reflection</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Entries List */}
        <View style={styles.listContainer}>
          {!isLoading && entries.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.textSecondary}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No reflections logged yet. Document your mindset through the storm.
              </Text>
            </View>
          ) : (
            entries.map((entry, index) => {
              const isLast = index === entries.length - 1;
              return (
                <View key={entry.id} style={styles.entryItemContainer}>
                  <View style={styles.entryHeaderRow}>
                    <View style={styles.entryTitleGroup}>
                      <Text style={[styles.entryTitleText, { color: colors.textPrimary }]}>
                        {entry.title}
                      </Text>
                      <View style={styles.timestampBadge}>
                        <Ionicons name="time-outline" size={10} color={colors.accent} />
                        <Text style={[styles.timestampText, { color: colors.accent }]}>
                          {entry.timestamp}
                        </Text>
                      </View>
                    </View>

                    {/* Delete / Remove Action */}
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteButton}
                      accessibilityLabel="Delete journal reflection"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.entryBodyText, { color: colors.textSecondary }]}>
                    {entry.body}
                  </Text>

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

export default JournalCard;

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
  addActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputExpansionWrapper: {
    overflow: 'hidden',
    marginBottom: 12,
  },
  textInputBox: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  titleInput: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 2,
    marginBottom: 6,
  },
  bodyInput: {
    fontSize: 12,
    minHeight: 46,
    textAlignVertical: 'top',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContainer: {
    marginTop: 4,
  },
  entryItemContainer: {
    paddingVertical: 8,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  entryTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  entryTitleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  timestampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  timestampText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  deleteButton: {
    padding: 4,
    opacity: 0.8,
  },
  entryBodyText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 10,
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
