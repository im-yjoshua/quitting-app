import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Mic } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { VoiceRecordBubble } from '@/components/journal/VoiceRecordBubble';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalReminderModal } from '@/components/journal/JournalReminderModal';
import { JournalRecord, getJournalRecords, deleteJournalRecord } from '@/services/audioJournal';

export default function JournalScreen() {
  const { colors } = useAppTheme();
  const { isSovereignUser, openPaywall } = useAppData();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<JournalRecord[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getJournalRecords();
    setRecords(data);
  };

  const handleSaveRecord = async (uri: string, durationMillis: number, notes?: string) => {
    const { saveJournalRecord } = await import('@/services/audioJournal');
    
    const totalSeconds = Math.floor(durationMillis / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const durationFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const newRecord: JournalRecord = {
      id: Date.now().toString(),
      uri,
      durationFormatted,
      durationMillis,
      createdAt: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      notes: notes?.trim() || undefined,
    };
    
    const updated = await saveJournalRecord(newRecord);
    setRecords(updated);
  };

  const handleDeleteRecord = async (id: string) => {
    const updated = await deleteJournalRecord(id);
    setRecords(updated);
    if (playingId === id) setPlayingId(null);
  };

  const handlePlayToggle = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const handleProGated = () => {
    openPaywall();
  };

  const canRecord = isSovereignUser || records.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Journal</Text>
        <TouchableOpacity onPress={() => setReminderModalVisible(true)} hitSlop={15} style={styles.bellBtn}>
          <Bell size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 100, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECORD REFLECTION</Text>
        <VoiceRecordBubble 
          onSave={handleSaveRecord} 
          onProGated={handleProGated}
          canRecord={canRecord}
        />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>ARCHIVE</Text>
        
        {records.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No audio reflections yet. Record your thoughts above.
          </Text>
        ) : (
          <View style={styles.list}>
            {records.map((record) => (
              <JournalEntryCard
                key={record.id}
                entry={record}
                onDelete={handleDeleteRecord}
                isPlaying={playingId === record.id}
                onPlayToggle={handlePlayToggle}
              />
            ))}
          </View>
        )}

      </ScrollView>

      <JournalReminderModal 
        visible={reminderModalVisible} 
        onClose={() => setReminderModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bellBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  list: {
    gap: 0,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  }
});
