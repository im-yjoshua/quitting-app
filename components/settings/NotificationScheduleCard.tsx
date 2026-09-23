import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Sun, Compass, Moon, FlaskConical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { 
  checkDailyCadenceStatus, 
  scheduleDailyCadenceProtocol, 
  disableDailyCadenceProtocol, 
  scheduleTestCheckpoint 
} from '@/services/notificationScheduler';
import { requestNotificationPermissions } from '@/services/notifications';

export function NotificationScheduleCard() {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkDailyCadenceStatus().then(setIsEnabled);
  }, []);

  const handleToggle = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (val) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Notifications Denied',
          'Please enable notifications in your device settings to activate the daily cadence.'
        );
        return;
      }
      setIsEnabled(true);
      await scheduleDailyCadenceProtocol();
    } else {
      setIsEnabled(false);
      await disableDailyCadenceProtocol();
    }
  };

  const handleTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Notifications Denied',
        'Please enable notifications in your device settings to test.'
      );
      return;
    }
    await scheduleTestCheckpoint();
    Alert.alert('Test Scheduled', 'You will receive a notification in 5 seconds.');
  };

  return (
    <LiquidGlassCard intensity={isDark ? 20 : 60} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Daily Cadence Protocol</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>3 automated check-ins per day</Text>
        </View>
        <Switch 
          value={isEnabled} 
          onValueChange={handleToggle} 
          trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
        />
      </View>

      <View style={[styles.subPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
        <View style={styles.checkpoint}>
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Sun size={16} color={colors.textPrimary} />
          </View>
          <View>
            <Text style={[styles.timeText, { color: colors.textPrimary }]}>08:00 AM</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>Morning Directive</Text>
          </View>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.checkpoint}>
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Compass size={16} color={colors.textPrimary} />
          </View>
          <View>
            <Text style={[styles.timeText, { color: colors.textPrimary }]}>02:00 PM</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>Midday Anchor</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.checkpoint}>
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Moon size={16} color={colors.textPrimary} />
          </View>
          <View>
            <Text style={[styles.timeText, { color: colors.textPrimary }]}>08:30 PM</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>Evening Audit</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleTest} style={[styles.testBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
        <FlaskConical size={16} color={colors.textPrimary} />
        <Text style={[styles.testBtnText, { color: colors.textPrimary }]}>Test Checkpoint (5s)</Text>
      </TouchableOpacity>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  subPanel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  checkpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  descText: {
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginVertical: 12,
    marginLeft: 44,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
