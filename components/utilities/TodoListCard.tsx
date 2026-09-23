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
  TodoItem,
  getTodos,
  saveTodos,
} from '@/services/legacyStorage';

export function TodoListCard() {
  const { colors, theme } = useAppTheme();
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const inputRef = useRef<TextInput>(null);

  // Reanimated spring expansion physics
  const inputHeight = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  // Hydrate stored tasks on initial render
  useEffect(() => {
    async function load() {
      try {
        const stored = await getTodos();
        setTasks(stored);
      } catch (err) {
        console.warn('[TodoListCard] Load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const openAddInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAdding(true);
    inputHeight.value = withSpring(85, { damping: 18, stiffness: 90 });
    inputOpacity.value = withSpring(1, { damping: 18, stiffness: 90 });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  };

  const closeAddInput = () => {
    Keyboard.dismiss();
    setNewTaskText('');
    setIsAdding(false);
    setIsFocused(false);
    inputHeight.value = withSpring(0, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(0, { damping: 20, stiffness: 90 });
  };

  const handleAddTask = async () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) {
      closeAddInput();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newTask: TodoItem = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    closeAddInput();
    await saveTodos(updated);
  };

  const handleToggleTask = async (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    // Persist in background
    await saveTodos(updated);
  };

  const handleDeleteTask = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    await saveTodos(updated);
  };

  const animatedInputStyle = useAnimatedStyle(() => ({
    maxHeight: inputHeight.value,
    opacity: inputOpacity.value,
  }));

  const isDark = theme === 'dark';
  const completedCount = tasks.filter((t) => t.completed).length;

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
            <Ionicons name="checkbox-outline" size={15} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
              DISCIPLINE PROTOCOLS
            </Text>
          </View>

          <View style={styles.headerRight}>
            {tasks.length > 0 && (
              <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                {completedCount}/{tasks.length}
              </Text>
            )}

            {!isAdding && (
              <TouchableOpacity
                onPress={openAddInput}
                activeOpacity={0.7}
                style={[
                  styles.addActionButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                accessibilityLabel="Add new protocol item"
              >
                <Ionicons name="add" size={13} color={colors.textPrimary} />
                <Text style={[styles.addBtnText, { color: colors.textPrimary }]}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expandable Add Input */}
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
                ref={inputRef}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="New daily habit protocol..."
                placeholderTextColor={colors.textSecondary}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
                style={[styles.inputField, { color: colors.textPrimary }]}
                maxLength={80}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={closeAddInput}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddTask}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: newTaskText.trim() ? 1 : 0.4,
                  },
                ]}
                activeOpacity={0.8}
                disabled={!newTaskText.trim()}
              >
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Commit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Tasks List */}
        <View style={styles.listContainer}>
          {!isLoading && tasks.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={22}
                color={colors.textSecondary}
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active tasks. Your path is clear.
              </Text>
            </View>
          ) : (
            tasks.map((task, index) => {
              const isLast = index === tasks.length - 1;
              return (
                <View key={task.id} style={styles.taskItemWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleTask(task.id, task.completed)}
                    style={styles.taskClickableRow}
                    accessibilityLabel={`Toggle task ${task.text}`}
                  >
                    <View
                      style={[
                        styles.checkboxSquare,
                        {
                          borderColor: task.completed
                            ? colors.accent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.25)'
                            : 'rgba(0, 0, 0, 0.25)',
                          backgroundColor: task.completed
                            ? colors.accent
                            : 'transparent',
                        },
                      ]}
                    >
                      {task.completed && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.taskText,
                        {
                          color: task.completed
                            ? colors.textSecondary
                            : colors.textPrimary,
                          textDecorationLine: task.completed
                            ? 'line-through'
                            : 'none',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {task.text}
                    </Text>
                  </TouchableOpacity>

                  {/* Delete Action */}
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteButton}
                    accessibilityLabel="Delete task"
                  >
                    <Ionicons
                      name="close"
                      size={14}
                      color={isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'}
                    />
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

export default TodoListCard;

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
    marginBottom: 10,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterText: {
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.8,
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
    marginBottom: 10,
  },
  textInputBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  inputField: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 2,
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
    marginTop: 2,
  },
  taskItemWrapper: {
    paddingVertical: 6,
    position: 'relative',
  },
  taskClickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 32,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 4,
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
