import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Honest trigger-app picker. There is no OS-level app picker available to
 * this app, so the user declares their commitment list directly: common
 * distractors as toggles plus a free-text field. Nothing here blocks or
 * limits the listed apps — it is a personal pledge, tracked on-device.
 */

const PRESET_APPS = [
  'Instagram',
  'TikTok',
  'X',
  'YouTube',
  'Facebook',
  'Reddit',
  'Snapchat',
  'Twitch',
  'Netflix',
  'Discord',
  'Safari',
  'Chrome',
];

interface TriggerAppsModalProps {
  visible: boolean;
  initialApps: string[];
  onClose: () => void;
  onSave: (apps: string[]) => void;
}

export function TriggerAppsModal({
  visible,
  initialApps,
  onClose,
  onSave,
}: TriggerAppsModalProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(initialApps);
      setCustomInput('');
    }
  }, [visible, initialApps]);

  const toggleApp = (name: string) => {
    Haptics.selectionAsync();
    setSelected((prev) =>
      prev.some((a) => a.toLowerCase() === name.toLowerCase())
        ? prev.filter((a) => a.toLowerCase() !== name.toLowerCase())
        : [...prev, name]
    );
  };

  const addCustom = () => {
    const name = customInput.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (selected.some((a) => a.toLowerCase() === name.toLowerCase())) {
      setCustomInput('');
      return;
    }
    Haptics.selectionAsync();
    setSelected((prev) => [...prev, name]);
    setCustomInput('');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(selected);
    onClose();
  };

  const isSelected = (name: string) =>
    selected.some((a) => a.toLowerCase() === name.toLowerCase());

  const customApps = selected.filter(
    (a) => !PRESET_APPS.some((p) => p.toLowerCase() === a.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Apps I'm Avoiding
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={15} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.honestNote, { color: colors.textSecondary }]}>
            Sovereign can't block or limit these apps — this is your personal
            commitment list. Pair it with iOS Screen Time for enforced limits.
          </Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {PRESET_APPS.map((name) => {
              const active = isSelected(name);
              return (
                <TouchableOpacity
                  key={name}
                  activeOpacity={0.7}
                  onPress={() => toggleApp(name)}
                  style={[
                    styles.row,
                    {
                      borderColor: active
                        ? colors.accent
                        : isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                      backgroundColor: active
                        ? colors.accentSubtle
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.rowText, { color: colors.textPrimary }]}>
                    {name}
                  </Text>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={active ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}

            {customApps.map((name) => (
              <View
                key={name}
                style={[
                  styles.row,
                  {
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSubtle,
                  },
                ]}
              >
                <Text style={[styles.rowText, { color: colors.textPrimary }]}>
                  {name}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleApp(name)}
                  hitSlop={12}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <View
              style={[
                styles.addRow,
                {
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Add another app…"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.textPrimary }]}
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={addCustom}
              />
              <TouchableOpacity
                onPress={addCustom}
                style={[styles.addBtn, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.saveBtnText, { color: colors.canvas }]}>
              Save Commitment{selected.length > 0 ? ` (${selected.length})` : ''}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150,150,150,0.15)',
  },
  honestNote: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 24,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
