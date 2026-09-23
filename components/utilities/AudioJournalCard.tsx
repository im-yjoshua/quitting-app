import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Audio } from '@/lib/expo-av-mock';
import { useAppTheme } from '@/context/ThemeContext';
import { usePro } from '@/context/ProContext';
import {
  AudioJournalEntry,
  getAudioJournals,
  saveAudioJournal,
  deleteAudioJournal,
  requestAudioPermissions,
} from '@/services/audio';

export function AudioJournalCard() {
  const { colors, theme } = useAppTheme();
  const { isPro, showPaywall } = usePro();
  
  const [journals, setJournals] = useState<AudioJournalEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);
  
  const pulseAnim = useSharedValue(1);
  const isDark = theme === 'dark';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadJournals();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadJournals = async () => {
    const data = await getAudioJournals();
    setJournals(data);
  };

  const startPulse = () => {
    pulseAnim.value = withRepeat(withTiming(1.2, { duration: 800 }), -1, true);
  };

  const stopPulse = () => {
    pulseAnim.value = withTiming(1);
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (!isPro && journals.length >= 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showPaywall();
      return;
    }

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone access is required to record forensic audio journals.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      startPulse();

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1000);

    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      stopPulse();
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (uri && status.durationMillis > 0) {
        const newEntry: AudioJournalEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString(),
          durationMillis: status.durationMillis,
          uri,
        };
        const updated = await saveAudioJournal(newEntry);
        setJournals(updated);
      }
      setRecording(null);
    } catch (err) {
      console.warn('Failed to stop recording', err);
    }
  };

  const handlePlayPause = async (item: AudioJournalEntry) => {
    if (playingId === item.id) {
      // Pause
      if (sound) {
        await sound.pauseAsync();
        setPlayingId(null);
      }
      return;
    }

    // Play new
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingId(item.id);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.warn('Failed to play audio', err);
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const updated = await deleteAudioJournal(id);
    setJournals(updated);
    if (playingId === id && sound) {
      sound.unloadAsync();
      setPlayingId(null);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: isRecording ? 0.3 : 0,
  }));

  return (
    <View style={[styles.cardContainer, { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border }]}>
      <BlurView intensity={35} tint={isDark ? 'dark' : 'light'} style={styles.blurContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="mic-outline" size={15} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>AUDIO FORENSICS</Text>
          </View>
        </View>

        <View style={styles.recorderContainer}>
          <View style={styles.recordButtonWrapper}>
            <Animated.View style={[styles.pulseRing, { backgroundColor: colors.accent }, pulseStyle]} />
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleRecordPress}
              style={[styles.recordButton, { backgroundColor: isRecording ? colors.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }]}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color={isRecording ? '#FFF' : colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.timerText, { color: isRecording ? colors.accent : colors.textSecondary }]}>
            {isRecording ? formatDuration(recordingDuration) : 'Tap to Record'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {journals.map((item, index) => {
            const isLast = index === journals.length - 1;
            const isPlaying = playingId === item.id;
            
            return (
              <View key={item.id} style={styles.journalItem}>
                <TouchableOpacity onPress={() => handlePlayPause(item)} style={styles.playButton}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={colors.accent} />
                </TouchableOpacity>
                
                <View style={styles.journalInfo}>
                  <Text style={[styles.journalDate, { color: colors.textPrimary }]}>{item.timestamp}</Text>
                  <Text style={[styles.journalDuration, { color: colors.textSecondary }]}>{formatDuration(item.durationMillis)}</Text>
                </View>

                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={16} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
                </TouchableOpacity>
                
                {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />}
              </View>
            );
          })}
          
          {journals.length === 0 && !isRecording && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No audio forensic logs. Tap to analyze a slip.</Text>
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  blurContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  recorderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonWrapper: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  listContainer: {
    marginTop: 8,
  },
  journalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journalInfo: {
    flex: 1,
  },
  journalDate: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  journalDuration: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 48,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  }
});
