import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Mic, Trash, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface VoiceRecordBubbleProps {
  onSave: (uri: string, durationMillis: number, notes?: string) => Promise<void>;
  onProGated: () => void;
  canRecord: boolean;
}

export function VoiceRecordBubble({ onSave, onProGated, canRecord }: VoiceRecordBubbleProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  const { isRecording, durationMillis, startRecording, stopRecording, cancelRecording } = useAudioRecorder();
  
  const [notes, setNotes] = useState('');
  
  const pulseAnim = useSharedValue(1);

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMicPress = async () => {
    if (!canRecord && !isRecording) {
      onProGated();
      return;
    }

    if (isRecording) {
      // do nothing on tap if recording, they should use discard/save
    } else {
      const started = await startRecording();
      if (started) {
        pulseAnim.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
      }
      // If permission was denied, the hook already explained via alert;
      // the UI simply stays idle.
    }
  };

  const handleDiscard = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    pulseAnim.value = withTiming(1);
    await cancelRecording();
    setNotes('');
  };

  const handleSave = async () => {
    pulseAnim.value = withTiming(1);
    const result = await stopRecording();
    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave(result.uri, result.durationMillis, notes);
      setNotes('');
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: isRecording ? 0.3 : 0,
  }));

  return (
    <LiquidGlassCard style={styles.container} intensity={isDark ? 30 : 60}>
      <View style={styles.recorderArea}>
        <View style={styles.micWrapper}>
          <Animated.View style={[styles.pulseRing, { backgroundColor: colors.accent }, pulseStyle]} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMicPress}
            style={[
              styles.micButton,
              { backgroundColor: isRecording ? colors.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }
            ]}
          >
            <Mic size={32} color={isRecording ? '#FFF' : colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.timerText, { color: isRecording ? colors.accent : colors.textSecondary }]}>
          {isRecording ? formatDuration(durationMillis) : 'Tap to Reflect'}
        </Text>
      </View>

      {isRecording && (
        <View style={styles.activeRecordingArea}>
          <TextInput
            style={[styles.inlineInput, { color: colors.textPrimary, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
            placeholder="Add quick notes (optional)..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleDiscard} style={styles.actionBtn}>
              <Trash size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, { backgroundColor: colors.accentSubtle }]}>
              <Check size={20} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]}>Save Reflection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    overflow: 'visible',
  },
  recorderArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  micWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  activeRecordingArea: {
    marginTop: 10,
  },
  inlineInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
