import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../../context/AppDataContext';
import { Palette } from '../../constants/theme';
import { HabitCategory } from '../../types/app';
import { requestNotificationPermissions, scheduleDailyCheckIn } from '../../services/notifications';

interface CategoryOption {
  id: HabitCategory;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultTitle: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'limbic_scrolling',
    label: 'Phone Scrolling',
    sublabel: 'Social media, reels, feeds',
    icon: 'phone-portrait-outline',
    defaultTitle: 'Phone Scrolling',
  },
  {
    id: 'adult_content',
    label: 'Adult Content',
    sublabel: 'Pornography, explicit sites',
    icon: 'eye-off-outline',
    defaultTitle: 'Adult Content',
  },
  {
    id: 'substance_nicotine',
    label: 'Vaping & Smoking',
    sublabel: 'Vapes, cigarettes, nicotine',
    icon: 'flame-outline',
    defaultTitle: 'Vaping & Smoking',
  },
  {
    id: 'digital_distraction',
    label: 'Gaming & Binging',
    sublabel: 'Video games, video streaming',
    icon: 'game-controller-outline',
    defaultTitle: 'Gaming & Binging',
  },
  {
    id: 'compulsive_gambling',
    label: 'Gambling & Bets',
    sublabel: 'Casinos, sports betting, crypto',
    icon: 'trending-down-outline',
    defaultTitle: 'Gambling & Bets',
  },
  {
    id: 'custom',
    label: 'Other Habit',
    sublabel: 'Anything else you want to quit',
    icon: 'create-outline',
    defaultTitle: 'My Bad Habit',
  },
];

export default function OnboardingStep1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAppData();

  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('limbic_scrolling');
  const [habitTitle, setHabitTitle] = useState('Phone Scrolling');
  const [weeklyCost, setWeeklyCost] = useState<number>(30);
  const [dailyMinutes, setDailyMinutes] = useState<number>(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectCategory = (cat: CategoryOption) => {
    Haptics.selectionAsync();
    setSelectedCategory(cat.id);
    setHabitTitle(cat.defaultTitle);
  };

  const adjustCost = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeeklyCost((prev) => Math.max(0, prev + delta));
  };

  const adjustTime = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDailyMinutes((prev) => Math.max(15, prev + delta));
  };

  const handleCommit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Request local notification permissions securely
    await requestNotificationPermissions();
    await scheduleDailyCheckIn(9, 0);

    await completeOnboarding(habitTitle, selectedCategory, weeklyCost, dailyMinutes);
    router.replace('/(drawer)');
  };

  const hoursWastedPerDay = (dailyMinutes / 60).toFixed(1);
  const annualDrain = (weeklyCost * 52).toLocaleString();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 16, 52),
            paddingBottom: Math.max(insets.bottom + 24, 48),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Simple Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>STEP 1 OF 1</Text>
          <Text style={styles.title}>Choose what to quit.</Text>
          <Text style={styles.subtitle}>
            Pick the habit you want to stop. We will track your progress, time, and money saved.
          </Text>
        </View>

        {/* Section 1: Categories */}
        <Text style={styles.sectionLabel}>WHAT DO YOU WANT TO STOP?</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleSelectCategory(cat)}
                style={[
                  styles.categoryCardWrapper,
                  isSelected && styles.categoryCardWrapperActive,
                ]}
              >
                <BlurView
                  intensity={35}
                  tint="dark"
                  style={[
                    styles.categoryCard,
                    isSelected && styles.categoryCardActive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={22}
                    color={isSelected ? Palette.accent : '#6E7179'}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  <Text style={styles.categorySublabel} numberOfLines={1}>
                    {cat.sublabel}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Custom Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.sectionLabel}>NAME YOUR GOAL</Text>
          <View style={styles.glassInputWrapper}>
            <BlurView intensity={35} tint="dark" style={styles.glassInputBox}>
              <TextInput
                value={habitTitle}
                onChangeText={setHabitTitle}
                placeholder="e.g. Late night scrolling"
                placeholderTextColor="#6E7179"
                style={styles.textInput}
                selectionColor={Palette.accent}
                maxLength={40}
              />
            </BlurView>
          </View>
        </View>

        {/* Section 3: Money Saved */}
        <View style={styles.metricSection}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.sectionLabel}>MONEY SPENT EACH WEEK</Text>
            <Text style={styles.metricProjection}>Saves ${annualDrain} / year</Text>
          </View>
          <View style={styles.metricCardWrapper}>
            <BlurView intensity={35} tint="dark" style={styles.metricCard}>
              <View style={styles.metricControls}>
                <TouchableOpacity
                  onPress={() => adjustCost(-10)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease money spent"
                >
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>${weeklyCost}</Text>
                  <Text style={styles.metricUnit}>PER WEEK</Text>
                </View>
                <TouchableOpacity
                  onPress={() => adjustCost(10)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase money spent"
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Section 4: Time Saved */}
        <View style={styles.metricSection}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.sectionLabel}>TIME LOST EACH DAY</Text>
            <Text style={styles.metricProjection}>{hoursWastedPerDay} hours back / day</Text>
          </View>
          <View style={styles.metricCardWrapper}>
            <BlurView intensity={35} tint="dark" style={styles.metricCard}>
              <View style={styles.metricControls}>
                <TouchableOpacity
                  onPress={() => adjustTime(-15)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease minutes lost"
                >
                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.metricValueContainer}>
                  <Text style={styles.metricValue}>{dailyMinutes}</Text>
                  <Text style={styles.metricUnit}>MINUTES / DAY</Text>
                </View>
                <TouchableOpacity
                  onPress={() => adjustTime(15)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase minutes lost"
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Section 5: Primary Action - Floating Pill Capsule */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleCommit}
          disabled={isSubmitting}
          style={styles.floatingPillButton}
          accessibilityLabel="Start My Streak"
          accessibilityRole="button"
        >
          <Text style={styles.pillButtonText}>Start My Streak</Text>
          <Ionicons name="arrow-forward" size={18} color="#000000" style={styles.buttonIcon} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 28,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.accent,
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6E7179',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E7179',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryCardWrapper: {
    width: '48.5%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryCardWrapperActive: {
    borderColor: Palette.accent,
  },
  categoryCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  categoryCardActive: {
    backgroundColor: 'rgba(46, 242, 184, 0.06)',
  },
  categoryIcon: {
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E7179',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categorySublabel: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    marginTop: 3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  glassInputWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassInputBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  metricSection: {
    marginBottom: 20,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricProjection: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.accent,
    fontVariant: ['tabular-nums'],
  },
  metricCardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metricControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  metricValueContainer: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6E7179',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  floatingPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 999,
    backgroundColor: Palette.accent,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});