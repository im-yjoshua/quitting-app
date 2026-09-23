import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';
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

  const [positionMillis, setPositionMillis] = useState(0);
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusSubRef = useRef<EventSubscription | null>(null);
  // onPlayToggle is re-created by the parent each render; keep a ref so the
  // playback-status listener never calls a stale closure.
  const onPlayToggleRef = useRef(onPlayToggle);
  onPlayToggleRef.current = onPlayToggle;

  const releasePlayer = () => {
    statusSubRef.current?.remove();
    statusSubRef.current = null;
    if (playerRef.current) {
      playerRef.current.remove();
      playerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      releasePlayer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const managePlayback = async () => {
      if (isPlaying) {
        try {
          if (!playerRef.current) {
            await setAudioModeAsync({
              allowsRecording: false,
              playsInSilentMode: true,
            });
            const player = createAudioPlayer({ uri: entry.uri });
            if (cancelled) {
              player.remove();
              return;
            }
            playerRef.current = player;
            statusSubRef.current = player.addListener(
              'playbackStatusUpdate',
              (status) => {
                setPositionMillis(Math.round(status.currentTime * 1000));
                if (status.didJustFinish) {
                  onPlayToggleRef.current(entry.id);
                  setPositionMillis(0);
                }
              }
            );
          }
          playerRef.current?.play();
        } catch (err) {
          console.warn('[JournalEntryCard] Failed to play recording:', err);
          if (!cancelled) {
            Alert.alert(
              'Playback failed',
              'This recording could not be played. The audio file may be missing.'
            );
            onPlayToggleRef.current(entry.id);
          }
        }
      } else {
        playerRef.current?.pause();
      }
    };

    managePlayback();
    return () => {
      cancelled = true;
    };
  }, [isPlaying, entry.id, entry.uri]);

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
