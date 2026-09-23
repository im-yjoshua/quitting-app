import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Plus, Activity } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useChallenges } from '@/context/ChallengesContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

export function WorkoutLoggerModal() {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  const { logWorkout } = useChallenges();

  const [visible, setVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Strength');
  const [duration, setDuration] = useState('');

  const types = ['Strength', 'Cardio', 'Mobility', 'Calisthenics'];

  const handleLog = async () => {
    if (!duration) return;
    await logWorkout(selectedType, parseInt(duration, 10));
    setDuration('');
    setVisible(false);
  };

  return (
    <>
      <LiquidGlassCard intensity={isDark ? 20 : 50} style={styles.card} onPress={() => setVisible(true)}>
        <View style={styles.row}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accentSubtle }]}>
            <Activity size={20} color={colors.accent} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Log Workout</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>+50 XP per session</Text>
          </View>
          <View style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Plus size={20} color={colors.textPrimary} />
          </View>
        </View>
      </LiquidGlassCard>

      <Modal visible={visible} animationType="slide" transparent>
        <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={20} style={styles.closeBtn}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Session</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>EXERCISE TYPE</Text>
              <View style={styles.typeGrid}>
                {types.map((type) => (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    onPress={() => setSelectedType(type)}
                    style={[
                      styles.typeBtn,
                      { 
                        backgroundColor: selectedType === type ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                        borderColor: selectedType === type ? colors.accent : colors.border
                      }
                    ]}
                  >
                    <Text style={[
                      styles.typeText,
                      { color: selectedType === type ? '#FFF' : colors.textPrimary }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>DURATION (MINUTES)</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: colors.border,
                    color: colors.textPrimary
                  }
                ]}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor={colors.textSecondary}
                value={duration}
                onChangeText={setDuration}
              />

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleLog}
                disabled={!duration}
                style={[
                  styles.submitBtn, 
                  { backgroundColor: duration ? colors.textPrimary : 'rgba(150,150,150,0.3)' }
                ]}
              >
                <Text style={[styles.submitBtnText, { color: colors.canvas }]}>Complete Workout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(150,150,150,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 40,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
