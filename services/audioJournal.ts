/**
 * Journal records (journal screen surface) — thin adapter over the canonical
 * voice-journal implementation in services/voiceJournal.ts.
 *
 * The JournalRecord shape is preserved so existing callers don't change;
 * all persistence, file management, and permission work happens in the
 * canonical module.
 */
import { Alert } from 'react-native';
import {
  VoiceJournalEntry,
  deleteVoiceJournal,
  listVoiceJournals,
  requestRecordingPermission,
  saveVoiceJournal,
} from './voiceJournal';

export interface JournalRecord {
  id: string;
  uri: string;
  durationFormatted: string;
  createdAt: string;
  notes?: string;
  durationMillis: number;
}

function formatDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function toJournalRecord(entry: VoiceJournalEntry): JournalRecord {
  return {
    id: entry.id,
    uri: entry.uri,
    durationFormatted: formatDuration(entry.durationMillis),
    createdAt: new Date(entry.createdAt).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    notes: entry.notes,
    durationMillis: entry.durationMillis,
  };
}

export async function requestAudioPermissionsSecure(): Promise<boolean> {
  const granted = await requestRecordingPermission();
  if (!granted) {
    Alert.alert(
      'Microphone Access Denied',
      'Please allow microphone access in device settings to use voice journaling.'
    );
  }
  return granted;
}

export async function getJournalRecords(): Promise<JournalRecord[]> {
  const entries = await listVoiceJournals();
  return entries.map(toJournalRecord);
}

export async function saveJournalRecord(
  entry: JournalRecord
): Promise<JournalRecord[]> {
  const updated = await saveVoiceJournal({
    tempUri: entry.uri,
    durationMillis: entry.durationMillis,
    notes: entry.notes,
  });
  return updated.map(toJournalRecord);
}

export async function deleteJournalRecord(
  id: string
): Promise<JournalRecord[]> {
  const updated = await deleteVoiceJournal(id);
  return updated.map(toJournalRecord);
}
