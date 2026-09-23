/**
 * StorageRecoveryModal — the user-facing side of storage integrity.
 *
 * Shown when this launch's app-state payload failed its integrity check and
 * was quarantined by the storage layer. Plain language, no silent resets:
 * the user learns their data couldn't be verified (NOT "your data is gone"),
 * sees that the original copy was preserved, and picks explicitly between
 * restoring from a backup file or starting fresh with a deliberate,
 * clearly-destructive confirmation.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '@/context/AppDataContext';
import { useAppTheme } from '@/context/ThemeContext';
import { pickBackupFileContents } from '@/services/dataBackup';

type RecoveryPhase = 'notice' | 'confirmErase' | 'working' | 'restoreError';

/** Extracts the quarantine timestamp from keys like "@sovereign/app_state.corrupt.<epochMs>". */
function quarantinedAtLabel(key: string | null): string | null {
  if (!key) return null;
  const match = key.match(/\.(\d{10,})$/);
  if (!match) return null;
  const at = new Date(Number(match[1]));
  if (isNaN(at.getTime())) return null;
  return at.toLocaleString();
}

export const StorageRecoveryModal: React.FC = () => {
  const {
    isLoading,
    isStorageRecoveryVisible,
    quarantinedStorageKey,
    dismissStorageRecoveryNotice,
    importTelemetry,
    eraseAllDataAndStartFresh,
  } = useAppData();
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  const [phase, setPhase] = useState<RecoveryPhase>('notice');
  const [workingLabel, setWorkingLabel] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const visible = !isLoading && isStorageRecoveryVisible;

  const handleNotNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('notice');
    dismissStorageRecoveryNotice();
  }, [dismissStorageRecoveryNotice]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRestoreError(null);
    setWorkingLabel('Choose a backup file…');
    setPhase('working');
    const picked = await pickBackupFileContents();
    if (picked.canceled) {
      setPhase('notice');
      return;
    }
    if (picked.error || !picked.json) {
      setRestoreError(picked.error ?? 'Could not read the selected file.');
      setPhase('restoreError');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setWorkingLabel('Verifying backup…');
    const result = await importTelemetry(picked.json);
    if (result.success) {
      // A validated restore marks the store trusted again, which hides this modal.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('notice');
    } else {
      setRestoreError(
        result.error ?? 'This file could not be restored. Nothing was changed.'
      );
      setPhase('restoreError');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [importTelemetry]);

  const handleConfirmErase = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setWorkingLabel('Starting fresh…');
    setPhase('working');
    try {
      await eraseAllDataAndStartFresh();
      setPhase('notice');
    } catch {
      setRestoreError(
        'Could not write a fresh state on this device. Nothing was changed.'
      );
      setPhase('restoreError');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [eraseAllDataAndStartFresh]);

  const setAsideLabel = quarantinedAtLabel(quarantinedStorageKey);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityLabel="Data recovery notice"
    >
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? 'rgba(20, 22, 28, 0.97)'
                : 'rgba(255, 255, 255, 0.97)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          {phase === 'working' ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {workingLabel}
              </Text>
            </View>
          ) : phase === 'restoreError' ? (
            <>
              <View style={styles.iconRow}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: 'rgba(255, 69, 58, 0.12)' },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={26}
                    color="#FF453A"
                  />
                </View>
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                That didn't work
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {restoreError}
                {'\n\n'}
                Your current data was not touched. You can try a different
                backup file, or choose another option.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPhase('notice')}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.accent },
                ]}
                accessibilityLabel="Back to recovery options"
              >
                <Text style={styles.primaryButtonText}>Back to options</Text>
              </TouchableOpacity>
            </>
          ) : phase === 'confirmErase' ? (
            <>
              <View style={styles.iconRow}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: 'rgba(255, 69, 58, 0.12)' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={26} color="#FF453A" />
                </View>
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Start over from zero?
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                This permanently erases everything — your streak, journal
                entries, rituals, and settings — and starts a brand-new
                attempt. Your set-aside copy stays on this device, but the app
                will not use it. This cannot be undone.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirmErase}
                style={[styles.primaryButton, styles.eraseButton]}
                accessibilityLabel="Yes, erase everything and start over"
              >
                <Text style={styles.primaryButtonText}>
                  Yes, erase everything
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setPhase('notice')}
                style={styles.textButton}
                accessibilityLabel="Go back"
              >
                <Text
                  style={[
                    styles.textButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Go back
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconRow}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: 'rgba(255, 159, 10, 0.12)' },
                  ]}
                >
                  <Ionicons
                    name="shield-half-outline"
                    size={26}
                    color="#FF9F0A"
                  />
                </View>
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                We couldn't verify your saved data
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Sovereign checks your saved data every time it opens. This
                time the check failed, so your data was set aside instead of
                being loaded. Nothing was silently deleted — the original copy
                is preserved on this device.
                {setAsideLabel ? `\n\nSet aside: ${setAsideLabel}.` : ''}
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleRestore}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.accent },
                ]}
                accessibilityLabel="Restore from a backup file"
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={17}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryButtonText}>
                  Restore from backup…
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhase('confirmErase');
                }}
                style={styles.textButton}
                accessibilityLabel="Start fresh"
              >
                <Text style={[styles.textButtonText, { color: '#FF453A' }]}>
                  Start fresh…
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleNotNow}
                style={styles.textButton}
                accessibilityLabel="Decide later"
              >
                <Text
                  style={[
                    styles.textButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Not now
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 6,
  },
  eraseButton: {
    backgroundColor: '#FF453A',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
