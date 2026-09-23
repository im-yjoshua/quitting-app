import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { usePro } from '@/context/ProContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export function PaywallModal() {
  const { colors, theme } = useAppTheme();
  const { isPro, setProStatus, isPaywallVisible, hidePaywall } = usePro();
  
  const [selectedTier, setSelectedTier] = useState<'weekly' | 'monthly' | 'annual' | 'lifetime'>('annual');

  const isDark = theme === 'dark';

  const handleSubscribe = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setProStatus(true);
    hidePaywall();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hidePaywall();
  };

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.content}>
            <Ionicons name="shield-checkmark" size={44} color={colors.accent} style={styles.glyph} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Unlock Sovereign Dominion</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Private, air-gapped discipline with advanced tracking.</Text>

            <View style={[styles.featuresList, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
              <View style={styles.featureItem}>
                <Ionicons name="color-palette" size={20} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>Dynamic Spectral Palettes (Gold, Cobalt, Crimson, Emerald)</Text>
              </View>
              <View style={[styles.hairline, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
              
              <View style={styles.featureItem}>
                <Ionicons name="mic" size={20} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>In-App Audio Forensic Journaling</Text>
              </View>
              <View style={[styles.hairline, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
              
              <View style={styles.featureItem}>
                <Ionicons name="eye-off" size={20} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>Stealth Mode & Header Title Masking</Text>
              </View>
              <View style={[styles.hairline, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
              
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={20} color={colors.accent} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>Priority Urge Intervention Tools</Text>
              </View>
            </View>

            <View style={styles.tiersContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setSelectedTier('weekly')}
                style={[styles.tierCard, { borderColor: selectedTier === 'weekly' ? colors.accent : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') }]}
              >
                <Text style={[styles.tierName, { color: colors.textPrimary }]}>Weekly</Text>
                <Text style={[styles.tierPrice, { color: colors.textSecondary }]}>$1.99 / week</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setSelectedTier('monthly')}
                style={[styles.tierCard, { borderColor: selectedTier === 'monthly' ? colors.accent : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') }]}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierName, { color: colors.textPrimary }]}>Monthly</Text>
                  <View style={[styles.pill, { backgroundColor: colors.accentSubtle }]}><Text style={[styles.pillText, { color: colors.accent }]}>Most Flexible</Text></View>
                </View>
                <Text style={[styles.tierPrice, { color: colors.textSecondary }]}>$9.99 / month</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setSelectedTier('annual')}
                style={[styles.tierCard, { borderColor: selectedTier === 'annual' ? colors.accent : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') }]}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierName, { color: colors.textPrimary }]}>Annual</Text>
                  <View style={[styles.pill, { backgroundColor: colors.accent }]}><Text style={[styles.pillText, { color: '#FFF' }]}>Best Value - Save 58%</Text></View>
                </View>
                <Text style={[styles.tierPrice, { color: colors.textSecondary }]}>$49.99 / year</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setSelectedTier('lifetime')}
                style={[styles.tierCard, { borderColor: selectedTier === 'lifetime' ? colors.accent : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') }]}
              >
                <Text style={[styles.tierName, { color: colors.textPrimary }]}>Lifetime</Text>
                <Text style={[styles.tierPrice, { color: colors.textSecondary }]}>$149.99 one-time</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={handleSubscribe}
              style={[styles.actionBtn, { backgroundColor: colors.textPrimary }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.canvas }]}>Claim Sovereign Access</Text>
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={handleSubscribe}><Text style={[styles.footerText, { color: colors.textSecondary }]}>Restore Purchases</Text></TouchableOpacity>
              <Text style={[styles.footerText, { color: colors.textSecondary, marginHorizontal: 8 }]}>•</Text>
              <TouchableOpacity><Text style={[styles.footerText, { color: colors.textSecondary }]}>Terms & Privacy</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  glyph: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  featuresList: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  tiersContainer: {
    gap: 12,
    marginBottom: 32,
  },
  tierCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
  },
  tierPrice: {
    fontSize: 14,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
