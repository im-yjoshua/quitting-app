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

const STORAGE_KEY = '@sovereign_todo_tasks';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const DEFAULT_TASKS: TaskItem[] = [
  { id: '1', text: 'Morning stretch & deep breath', completed: false, createdAt: 1 },
  { id: '2', text: 'Drink water before screen time', completed: false, createdAt: 2 },
];

export function TodoModule() {
  const { colors } = useAppTheme();
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reanimated shared values with Apple spring physics
  const inputHeight = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  // Hydrate stored tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load tasks from storage:', err);
      }
    }
    loadTasks();
  }, []);

  // Persist tasks on update
  const persistTasks = async (updated: TaskItem[]) => {
    setTasks(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist tasks:', err);
    }
  };

  const toggleTask = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    persistTasks(updated);
  };

  const handleOpenAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAdding(true);
    inputHeight.value = withSpring(54, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(1, { damping: 20, stiffness: 90 });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const closeInput = () => {
    Keyboard.dismiss();
    setNewTaskText('');
    setIsAdding(false);
    setIsFocused(false);
    inputHeight.value = withSpring(0, { damping: 20, stiffness: 90 });
    inputOpacity.value = withSpring(0, { damping: 20, stiffness: 90 });
  };

  const handleSubmit = () => {
    const trimmed = newTaskText.trim();
    if (trimmed) {
      const newTask: TaskItem = {
        id: Date.now().toString(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      };
      persistTasks([newTask, ...tasks]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    closeInput();
  };

  const deleteTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = tasks.filter((t) => t.id !== id);
    persistTasks(updated);
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
      accessibilityLabel={isAdding ? 'Cancel adding task' : 'Add new task'}
    >
      <Ionicons
        name={isAdding ? 'close' : 'add'}
        size={14}
        color={colors.textPrimary}
      />
      <Text style={[styles.addButtonText, { color: colors.textPrimary }]}>
        {isAdding ? 'Cancel' : 'Add'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <UtilityCard title="To-Do List" headerAction={headerAction}>
      {/* Animated Input Field with Apple Spring Physics */}
      <Animated.View style={animatedInputStyle}>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.glassSubtle,
              borderColor: isFocused ? colors.accent : colors.border,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Add a task..."
            placeholderTextColor={colors.textSecondary}
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={handleSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            style={[styles.inputSubmitBtn, { backgroundColor: colors.accent }]}
            accessibilityLabel="Save Task"
          >
            <Ionicons name="checkmark" size={14} color="#000000" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Task List Rendered via .map() */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkbox-outline"
            size={22}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No tasks added yet
          </Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {tasks.map((task) => {
            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.glassSubtle,
                    borderColor: task.completed
                      ? 'rgba(255, 255, 255, 0.04)'
                      : colors.border,
                  },
                ]}
              >
                {/* Interactive Checkbox */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTask(task.id, task.completed)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed
                        ? colors.accent
                        : colors.textSecondary,
                      backgroundColor: task.completed
                        ? colors.accent
                        : 'transparent',
                    },
                  ]}
                  accessibilityLabel={
                    task.completed ? 'Mark task as incomplete' : 'Mark task as completed'
                  }
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={12} color="#000000" />
                  )}
                </TouchableOpacity>

                {/* Task Label */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTask(task.id, task.completed)}
                  style={styles.taskTextWrapper}
                >
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
                  >
                    {task.text}
                  </Text>
                </TouchableOpacity>

                {/* 'X' Icon to Delete Entry */}
                <TouchableOpacity
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => deleteTask(task.id)}
                  style={styles.deleteButton}
                  accessibilityLabel="Delete task"
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  inputSubmitBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  taskList: {
    gap: 8,
  },
  taskCard: {
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
  taskTextWrapper: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  deleteButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
