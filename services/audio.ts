import { Audio } from '@/lib/expo-av-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const AUDIO_JOURNALS_KEY = '@sovereign/audio_journals';

export interface AudioJournalEntry {
  id: string;
  timestamp: string;
  durationMillis: number;
  uri: string;
}

export async function requestAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Failed to request audio permissions:', error);
    return false;
  }
}

export async function getAudioJournals(): Promise<AudioJournalEntry[]> {
  try {
    const data = await AsyncStorage.getItem(AUDIO_JOURNALS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load audio journals:', error);
  }
  return [];
}

export async function saveAudioJournal(entry: AudioJournalEntry): Promise<AudioJournalEntry[]> {
  try {
    const journals = await getAudioJournals();
    const updated = [entry, ...journals];
    await AsyncStorage.setItem(AUDIO_JOURNALS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to save audio journal:', error);
    return [];
  }
}

export async function deleteAudioJournal(id: string): Promise<AudioJournalEntry[]> {
  try {
    const journals = await getAudioJournals();
    const entryToDelete = journals.find((j) => j.id === id);
    if (entryToDelete) {
      await FileSystem.deleteAsync(entryToDelete.uri, { idempotent: true });
    }
    const updated = journals.filter((j) => j.id !== id);
    await AsyncStorage.setItem(AUDIO_JOURNALS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to delete audio journal:', error);
    return [];
  }
}
