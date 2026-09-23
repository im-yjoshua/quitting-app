import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from '@/lib/expo-av-mock';
import { Play, Pause, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { JournalRecord } from '@/services/audioJournal';

interface JournalEntryCardProps {
  entry: JournalRecord;
  onDelete: (id: string) => void;
  isPlaying: boolean;
  onPlayToggle: (id: string) => void;
}

export function JournalEntryCard({ entry, onDelete, isPlaying, onPlayToggle }: JournalEntryCardProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  
  const [sound, setSound] = useState<any>(null);
  const [positionMillis, setPositionMillis] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    const managePlayback = async () => {
      if (isPlaying) {
        try {
          if (!sound) {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
            });
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: entry.uri },
              { shouldPlay: true },
              (status: any) => {
                if (status.isLoaded) {
                  setPositionMillis(status.positionMillis);
                  if (status.didJustFinish) {
                    onPlayToggle(entry.id); // Triggers pause
                    setPositionMillis(0);
                  }
                }
              }
            );
            setSound(newSound);
          } else {
            await sound.playAsync();
          }
        } catch (err) {
          console.warn('Failed to play audio', err);
        }
      } else {
        if (sound) {
          await sound.pauseAsync();
        }
      }
    };
    
    managePlayback();
  }, [isPlaying]);

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(entry.id);
  };

  const progressPercent = entry.durationMillis > 0 ? (positionMillis / entry.durationMillis) * 100 : 0;

  return (
    <LiquidGlassCard style={styles.container} intensity={isDark ? 20 : 50}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>{entry.createdAt}</Text>
          <Text style={[styles.durationText, { color: colors.textSecondary }]}>{entry.durationFormatted}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={15} style={styles.deleteBtn}>
          <Trash2 size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} />
        </TouchableOpacity>
      </View>

      {entry.notes ? (
        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{entry.notes}</Text>
      ) : null}

      <View style={styles.audioRow}>
        <TouchableOpacity 
          onPress={() => onPlayToggle(entry.id)} 
          style={[styles.playButton, { backgroundColor: colors.accentSubtle }]}
        >
          {isPlaying ? (
            <Pause size={18} color={colors.accent} fill={colors.accent} />
          ) : (
            <Play size={18} color={colors.accent} fill={colors.accent} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
        
        <View style={styles.trackContainer}>
          <View style={[styles.trackBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
          <View style={[styles.trackProgress, { backgroundColor: colors.accent, width: `${Math.min(progressPercent, 100)}%` }]} />
        </View>
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  trackProgress: {
    height: '100%',
  },
});
