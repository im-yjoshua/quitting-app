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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { UtilityCard } from '../UtilityCard';
import { useAppTheme } from '../../../context/ThemeContext';

const STORAGE_KEY = '@sovereign_journal_entries';

interface JournalEntry {
  id: string;
  text: string;
  createdAt: number;
}

const DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    text: 'Started my journey today. Feeling clear-headed and ready to break this habit.',
    createdAt: Date.now() - 3600000,
  },
];

export function JournalModule() {
  const { colors } = useAppTheme();
  const [entries, setEntries] = useState<JournalEntry[]>(DEFAULT_ENTRIES);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reanimated shared values with Apple spring physics
  const inputHeight = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  // Hydrate stored journal entries
  useEffect(() => {
    async function loadEntries() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setEntries(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load journal entries from storage:', err);
      }
    }
    loadEntries();
  }, []);

  // Persist entries on update
  const persistEntries = async (updated: JournalEntry[]) => {
    setEntries(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist journal entries:', err);
    }
  };

  const handleOpenAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAdding(true);
    inputHeight.value = withSpring(115, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(1, { damping: 20, stiffness: 90 });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const closeInput = () => {
    Keyboard.dismiss();
    setNewEntryText('');
    setIsAdding(false);
    setIsFocused(false);
    inputHeight.value = withSpring(0, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(0, { damping: 20, stiffness: 90 });
  };

  const handleSave = () => {
    const trimmed = newEntryText.trim();
    if (trimmed) {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: trimmed,
        createdAt: Date.now(),
      };
      persistEntries([newEntry, ...entries]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    closeInput();
  };

  const deleteEntry = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = entries.filter((e) => e.id !== id);
    persistEntries(updated);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
    opacity: inputOpacity.value,
    overflow: 'hidden',
  }));

  const headerAction = (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.addButton,
        {
          backgroundColor: isAdding ? 'rgba(255, 255, 255, 0.08)' : colors.glassSubtle,
          borderColor: isAdding ? colors.textSecondary : 'rgba(255, 255, 255, 0.08)',
        },
      ]}
      onPress={isAdding ? closeInput : handleOpenAdd}
      accessibilityLabel={isAdding ? 'Cancel note' : 'Write new journal note'}
    >
      <Ionicons
        name={isAdding ? 'close' : 'pencil'}
        size={12}
        color={colors.textPrimary}
      />
      <Text style={[styles.addButtonText, { color: colors.textPrimary }]}>
        {isAdding ? 'Cancel' : 'Write'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <UtilityCard title="My Journal" headerAction={headerAction}>
      {/* Animated Input Field with Apple Spring Physics */}
      <Animated.View style={animatedInputStyle}>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.glassSubtle,
              borderColor: isFocused ? colors.accent : colors.border,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="What's on your mind today?"
            placeholderTextColor={colors.textSecondary}
            value={newEntryText}
            onChangeText={setNewEntryText}
            multiline
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            accessibilityLabel="Save journal entry"
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Journal Entries Rendered via .map() */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="book-outline"
            size={22}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No journal entries yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Write down your thoughts, wins, or triggers.
          </Text>
        </View>
      ) : (
        <View style={styles.entriesList}>
          {entries.map((entry) => {
            return (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: colors.glassSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Meta Header with Secondary Highlight and 'X' Delete Button */}
                <View style={styles.entryHeader}>
                  <View style={styles.timestampBadge}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timestampText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatTimestamp(entry.createdAt)}
                    </Text>
                  </View>

                  {/* 'X' Icon to Delete Entry */}
                  <TouchableOpacity
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => deleteEntry(entry.id)}
                    style={styles.deleteButton}
                    accessibilityLabel="Delete journal note"
                  >
                    <Ionicons
                      name="close"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Journal Note Content */}
                <Text style={[styles.entryText, { color: colors.textPrimary }]}>
                  {entry.text}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </UtilityCard>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputContainer: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    height: 102,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 4,
  },
  saveBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 6,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as any } : {}),
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  deleteButton: {
    padding: 2,
  },
  entryText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});
