import { Audio } from '@/lib/expo-av-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

const JOURNAL_RECORDS_KEY = '@sovereign/journal_records';

export interface JournalRecord {
  id: string;
  uri: string;
  durationFormatted: string;
  createdAt: string;
  notes?: string;
  durationMillis: number;
}

export async function requestAudioPermissionsSecure(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Access Denied',
        'Please allow microphone access in device settings to use voice journaling.'
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to request audio permissions:', err);
    return false;
  }
}

export async function getJournalRecords(): Promise<JournalRecord[]> {
  try {
    const data = await AsyncStorage.getItem(JOURNAL_RECORDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load journal records:', error);
  }
  return [];
}

export async function saveJournalRecord(entry: JournalRecord): Promise<JournalRecord[]> {
  try {
    const journals = await getJournalRecords();
    const updated = [entry, ...journals];
    await AsyncStorage.setItem(JOURNAL_RECORDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to save journal record:', error);
    return [];
  }
}

export async function deleteJournalRecord(id: string): Promise<JournalRecord[]> {
  try {
    const journals = await getJournalRecords();
    const entryToDelete = journals.find((j) => j.id === id);
    if (entryToDelete) {
      await FileSystem.deleteAsync(entryToDelete.uri, { idempotent: true });
    }
    const updated = journals.filter((j) => j.id !== id);
    await AsyncStorage.setItem(JOURNAL_RECORDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to delete journal record:', error);
    return [];
  }
}
