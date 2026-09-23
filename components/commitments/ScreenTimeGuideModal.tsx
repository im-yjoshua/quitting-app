import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Static guided setup for iOS Screen Time. Sovereign cannot enforce app
 * limits itself, so this teaches the user to set real, OS-enforced limits in
 * the Settings app. Every step is something the user does — nothing here
 * claims the app does it for them.
 */

const APP_LIMIT_STEPS = [
  {
    title: 'Open Settings → Screen Time',
    body: 'On your iPhone, open the Settings app and tap Screen Time. Turn it on if you haven\u2019t already.',
  },
  {
    title: 'Add an App Limit',
    body: 'Tap App Limits → Add Limit, then select the categories (or specific apps) you committed to avoid.',
  },
  {
    title: 'Set a daily allowance',
    body: 'Pick a small daily limit — 30 minutes is a good start. Tap Add when done.',
  },
  {
    title: 'Lock it with a passcode',
    body: 'Back in Screen Time, tap Lock Screen Time Settings and set a passcode. Ask someone you trust to keep it if willpower is thin.',
  },
];

const DOWNTIME_STEPS = [
  {
    title: 'Schedule Downtime (optional)',
    body: 'Tap Downtime and schedule your vulnerable hours — e.g. 11 PM to 7 AM. Only calls and apps you allow will work.',
  },
  {
    title: 'Content Restrictions (optional)',
    body: 'Tap Content & Privacy Restrictions → Content Restrictions → Web Content → Limit Adult Websites. This is the real adult-content filter — it\u2019s enforced by iOS.',
  },
];

interface ScreenTimeGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ScreenTimeGuideModal({
  visible,
  onClose,
}: ScreenTimeGuideModalProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const renderStep = (
    step: { title: string; body: string },
    index: number,
    offset: number
  ) => (
    <View
      key={step.title}
      style={[
        styles.step,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
      ]}
    >
      <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
        <Text style={styles.stepNumberText}>{index + 1 + offset}</Text>
      </View>
      <View style={styles.stepTextBlock}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
          {step.title}
        </Text>
        <Text style={[styles.stepBody, { color: colors.textSecondary }]}>
          {step.body}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Set Up Screen Time
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={15}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.honestNote, { color: colors.textSecondary }]}>
            Sovereign can't limit apps for you — but your iPhone can. These
            steps set real limits enforced by iOS itself.
          </Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              APP LIMITS
            </Text>
            {APP_LIMIT_STEPS.map((s, i) => renderStep(s, i, 0))}

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary, marginTop: 20 },
              ]}
            >
              DOWNTIME & CONTENT
            </Text>
            {DOWNTIME_STEPS.map((s, i) =>
              renderStep(s, i, APP_LIMIT_STEPS.length)
            )}

            <View style={styles.footerNote}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                Your commitment list in Sovereign is your personal pledge —
                these iOS limits are the enforcement. They work best together.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={[styles.doneBtn, { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.doneBtnText, { color: colors.canvas }]}>
              Got It
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150,150,150,0.15)',
  },
  honestNote: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  step: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepTextBlock: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  footerNote: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  doneBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
