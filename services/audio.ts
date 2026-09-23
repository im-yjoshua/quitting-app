/**
 * Audio journals (dashboard surface) — thin adapter over the canonical
 * voice-journal implementation in services/voiceJournal.ts.
 *
 * The AudioJournalEntry shape is preserved so existing callers don't change;
 * all persistence, file management, and permission work happens in the
 * canonical module.
 */
import {
  VoiceJournalEntry,
  deleteVoiceJournal,
  listVoiceJournals,
  requestRecordingPermission,
  saveVoiceJournal,
} from './voiceJournal';

export interface AudioJournalEntry {
  id: string;
  timestamp: string;
  durationMillis: number;
  uri: string;
}

function toAudioJournalEntry(entry: VoiceJournalEntry): AudioJournalEntry {
  return {
    id: entry.id,
    timestamp: new Date(entry.createdAt).toLocaleString(),
    durationMillis: entry.durationMillis,
    uri: entry.uri,
  };
}

export async function requestAudioPermissions(): Promise<boolean> {
  return requestRecordingPermission();
}

export async function getAudioJournals(): Promise<AudioJournalEntry[]> {
  const entries = await listVoiceJournals();
  return entries.map(toAudioJournalEntry);
}

export async function saveAudioJournal(
  entry: AudioJournalEntry
): Promise<AudioJournalEntry[]> {
  const updated = await saveVoiceJournal({
    tempUri: entry.uri,
    durationMillis: entry.durationMillis,
  });
  return updated.map(toAudioJournalEntry);
}

export async function deleteAudioJournal(
  id: string
): Promise<AudioJournalEntry[]> {
  const updated = await deleteVoiceJournal(id);
  return updated.map(toAudioJournalEntry);
}
