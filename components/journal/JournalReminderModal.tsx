import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

const JOURNAL_REMINDER_KEY = '@sovereign/journal_reminder_enabled';

interface JournalReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JournalReminderModal({ visible, onClose }: JournalReminderModalProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [time, setTime] = useState('21:00'); // Default to 9:00 PM

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_REMINDER_KEY);
      if (stored === 'true') {
        setIsEnabled(true);
      }
    } catch (err) {
      console.warn('Failed to load journal reminder setting', err);
    }
  };

  const scheduleReminder = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(JOURNAL_REMINDER_KEY, enabled ? 'true' : 'false');
      
      // Cancel previous journal reminders
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'journal_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setIsEnabled(false);
          await AsyncStorage.setItem(JOURNAL_REMINDER_KEY, 'false');
          return;
        }

        const [hourStr, minuteStr] = time.split(':');
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Evening Reflection',
            body: 'Take a moment to record your daily forensic journal.',
            sound: true,
            data: { type: 'journal_reminder' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: parseInt(hourStr, 10),
            minute: parseInt(minuteStr, 10),
          },
        });
      }
    } catch (err) {
      console.warn('Failed to schedule journal reminder', err);
    }
  };

  const handleToggle = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEnabled(val);
    await scheduleReminder(val);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} hitSlop={20} style={styles.closeBtn}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Journal Reminders</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set a daily evening reminder to offload your thoughts and track your emotional state.
            </Text>

            <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.row}>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Daily Reflection</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Notifies you at {time}</Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={handleToggle}
                  trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleClose}
              style={[styles.doneBtn, { backgroundColor: colors.textPrimary }]}
            >
              <Text style={[styles.doneBtnText, { color: colors.canvas }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(150,150,150,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 14,
  },
  doneBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
