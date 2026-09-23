import { useState, useRef, useEffect } from 'react';
import { Audio } from '@/lib/expo-av-mock';
import * as Haptics from 'expo-haptics';
import { requestAudioPermissionsSecure } from '@/services/audioJournal';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermissionsSecure();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status: any) => {
          if (status.isRecording) {
            setDurationMillis(status.durationMillis);
            if (status.metering !== undefined) {
              setMeteringLevels((prev) => {
                const updated = [...prev, status.metering!];
                if (updated.length > 20) return updated.slice(-20);
                return updated;
              });
            }
          }
        },
        100
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDurationMillis(0);
      setMeteringLevels([]);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      timerRef.current = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1000);

    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  };

  const stopRecording = async (): Promise<{ uri: string; durationMillis: number } | null> => {
    if (!recording) return null;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      setRecording(null);

      if (uri && status.durationMillis > 0) {
        return { uri, durationMillis: status.durationMillis };
      }
      return null;
    } catch (err) {
      console.warn('Failed to stop recording', err);
      return null;
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      setRecording(null);
    } catch (err) {
      console.warn('Failed to cancel recording', err);
    }
  };

  return {
    isRecording,
    durationMillis,
    meteringLevels,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
