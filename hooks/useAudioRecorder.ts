import { useEffect, useRef } from 'react';
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { requestAudioPermissionsSecure } from '@/services/audioJournal';

export interface StopRecordingResult {
  /** Temp URI of the finished recording (callers persist it via the journal services). */
  uri: string;
  durationMillis: number;
}

/**
 * Voice recording built on expo-audio. Recording state is polled from the
 * native recorder; durations come from the OS, not a simulated timer.
 */
export function useAudioRecorder() {
  const recorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const durationRef = useRef(0);

  useEffect(() => {
    if (recorderState.isRecording) {
      durationRef.current = recorderState.durationMillis;
    }
  }, [recorderState]);

  const isRecording = recorderState.isRecording;
  const durationMillis = recorderState.durationMillis;

  const startRecording = async (): Promise<boolean> => {
    try {
      const hasPermission = await requestAudioPermissionsSecure();
      if (!hasPermission) return false;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      durationRef.current = 0;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch (err) {
      console.warn('[useAudioRecorder] Failed to start recording:', err);
      return false;
    }
  };

  const stopRecording = async (): Promise<StopRecordingResult | null> => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const finishedDuration = durationRef.current;
      durationRef.current = 0;

      if (uri && finishedDuration > 0) {
        return { uri, durationMillis: Math.round(finishedDuration) };
      }
      // Zero-length artifact: remove it so it can't linger in the cache dir.
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }
      return null;
    } catch (err) {
      console.warn('[useAudioRecorder] Failed to stop recording:', err);
      return null;
    }
  };

  const cancelRecording = async (): Promise<void> => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
      const uri = recorder.uri;
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
      durationRef.current = 0;
    } catch (err) {
      console.warn('[useAudioRecorder] Failed to cancel recording:', err);
    }
  };

  return {
    isRecording,
    durationMillis,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
