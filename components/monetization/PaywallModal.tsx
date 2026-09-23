import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { PurchasePlan } from '../../types/app';
import { LegalModal } from './LegalModal';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FeatureBenefit {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const SOVEREIGN_BENEFITS: FeatureBenefit[] = [
  {
    icon: 'infinite-outline',
    title: 'Unrestricted 90-Day Dopamine Architecture',
    description: 'Complete clinical stage access, receptor timeline mapping, and synaptic recovery milestones.',
  },
  {
    icon: 'analytics-outline',
    title: 'Detailed History & Patterns',
    description: 'Unlock your full history of slip ups with detailed notes to learn from your mistakes.',
  },
  {
    icon: 'flash-outline',
    title: 'Custom Daily Bonus Settings',
    description: 'Protect your streak with customized daily routines and habits.',
  },
  {
    icon: 'flame-outline',
    title: 'Emergency Button & Streak Protection',
    description: 'Instant guided routines to quickly beat strong urges and protect your streak.',
  },
  {
    icon: 'finger-print-outline',
    title: 'Air-Gapped Biometric Enclave',
    description: 'Face ID / Touch ID perimeter lock. 100% on-device local storage. Zero analytics or server uploads.',
  },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    state,
    isSovereignUser,
    purchasePackage,
    restorePurchasesWithBiometrics,
    purchaseState,
    purchaseError,
  } = useAppData();

  const [selectedPlan, setSelectedPlan] = useState<PurchasePlan>('annual');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [legalModalVisible, setLegalModalVisible] = useState<boolean>(false);
  const [legalInitialTab, setLegalInitialTab] = useState<'terms' | 'privacy'>('terms');

  const handleSelectPlan = (plan: PurchasePlan) => {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
  };

  // Dynamic ROI calculation based on onboarding habit data
  const dynamicROI = useMemo(() => {
    const weeklyCost = state.profile.weeklyCostEstimated || 0;
    const dailyMinutes = state.profile.dailyMinutesWasted || 120;
    const annualHabitCost = weeklyCost * 52;
    const annualPassCost = 59;

    if (weeklyCost > 0) {
      const dailyCost = weeklyCost / 7;
      const daysToBreakEven = Math.max(1, Math.ceil(annualPassCost / dailyCost));
      const weeksToBreakEven = (annualPassCost / weeklyCost).toFixed(1);
      const netAnnualSavings = Math.max(0, annualHabitCost - annualPassCost);

      return {
        hasFinancialCost: true,
        weeklyCost,
        annualHabitCost,
        daysToBreakEven,
        weeksToBreakEven,
        netAnnualSavings,
        headline: `Sovereign Tier pays for itself in ${daysToBreakEven} days of clean discipline.`,
        detail: `Based on your onboarding audit, your habit drains ~$${weeklyCost}/week ($${annualHabitCost.toLocaleString()}/year). Securing the Annual Pass reclaims up to $${netAnnualSavings.toLocaleString()} in net financial capital.`,
      };
    }

    // Zero financial cost entered -> calculate time/attention ROI
    const hoursPerYear = Math.round((dailyMinutes * 365) / 60);
    const fullDaysPerYear = (hoursPerYear / 24).toFixed(1);

    return {
      hasFinancialCost: false,
      weeklyCost: 0,
      annualHabitCost: 0,
      daysToBreakEven: 0,
      weeksToBreakEven: '0',
      netAnnualSavings: 0,
      headline: `Reclaim ~${hoursPerYear} hours of consciousness per year.`,
      detail: `You logged zero direct financial waste, but lose ${dailyMinutes}m every day (~${fullDaysPerYear} continuous days of your year). Sovereign Tier protects your cognitive bandwidth from limbic hijacking.`,
    };
  }, [state.profile.weeklyCostEstimated, state.profile.dailyMinutesWasted]);

  const isProcessing = purchaseState === 'pending' || isRestoring;

  const handleCommitUpgrade = async () => {
    if (isProcessing) return;
    setRestoreMessage(null);

    const result = await purchasePackage(selectedPlan);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleRestorePurchases = async () => {
    if (isProcessing) return;
    setIsRestoring(true);
    setRestoreMessage(null);

    const result = await restorePurchasesWithBiometrics();
    setIsRestoring(false);

    if (result.success && result.restored) {
      setRestoreMessage('Sovereign Pass restored successfully.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 900);
    } else {
      setRestoreMessage(result.message);
    }
  };

  const handleOpenLegal = (tab: 'terms' | 'privacy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegalInitialTab(tab);
    setLegalModalVisible(true);
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalBackdrop}>
          <BlurView
            intensity={GlassBlur.intensity.heavy}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.absoluteFill}
          />

          <View style={styles.sheetContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Top Atmospheric Sovereign Crown */}
              <View style={styles.header}>
                <View style={styles.badgeWrapper}>
                  <BlurView
                    intensity={GlassBlur.intensity.standard}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.sovereignBadge}
                  >
                    <LinearGradient
                      colors={['rgba(255, 215, 0, 0.35)', 'rgba(255, 159, 10, 0.1)']}
                      style={styles.absoluteFill}
                      pointerEvents="none"
                    />
                    <Ionicons name="shield-checkmark" size={14} color={Palette.tierSovereign} />
                    <Text style={styles.badgeText}>
                      {isSovereignUser ? 'SOVEREIGN TIER // ACTIVE PASS' : 'SOVEREIGN TIER // HARDWARE PASS'}
                    </Text>
                  </BlurView>
                </View>

                <Text style={styles.title}>Reclaim Full Autonomy.</Text>
                <Text style={styles.subtitle}>
                  You are not subscribing to content—you are funding an immutable, air-gapped discipline terminal engineered to eliminate dopamine captivity.
                </Text>
              </View>

              {/* Feature Benefits Deck */}
              <View style={styles.benefitsContainer}>
                {SOVEREIGN_BENEFITS.map((item, index) => (
                  <View key={index} style={styles.benefitRow}>
                    <View style={styles.benefitIconBox}>
                      <Ionicons name={item.icon} size={18} color={Palette.tierSovereign} />
                    </View>
                    <View style={styles.benefitTextContainer}>
                      <Text style={styles.benefitTitle}>{item.title}</Text>
                      <Text style={styles.benefitDescription}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Dynamic Financial Contrast Anchor */}
              <View style={styles.contrastCard}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.08)', 'rgba(255, 159, 10, 0.01)']}
                  style={styles.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.contrastIconBox}>
                  <Ionicons name="trending-up" size={18} color={Palette.tierSovereign} />
                </View>
                <View style={styles.contrastTextContainer}>
                  <Text style={styles.contrastHeadline}>{dynamicROI.headline}</Text>
                  <Text style={styles.contrastDetail}>{dynamicROI.detail}</Text>
                </View>
              </View>

              {/* Tier Plan Selection Cards */}
              <View style={styles.plansContainer}>
                {/* Plan 1: Annual Protocol */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleSelectPlan('annual')}
                  style={[
                    styles.planCardWrapper,
                    selectedPlan === 'annual' && styles.planCardActive,
                  ]}
                >
                  <BlurView
                    intensity={selectedPlan === 'annual' ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.planCard}
                  >
                    <LinearGradient
                      colors={
                        selectedPlan === 'annual'
                          ? ['rgba(255, 215, 0, 0.16)', 'rgba(255, 159, 10, 0.03)']
                          : Palette.specularGradient
                      }
                      style={styles.absoluteFill}
                      pointerEvents="none"
                    />
                    <View style={styles.planHeaderRow}>
                      <View style={styles.planTitleCol}>
                        <View style={styles.pillLabelRow}>
                          <Text style={styles.planName}>ANNUAL PROTOCOL</Text>
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>MOST STRATEGIC</Text>
                          </View>
                        </View>
                        <Text style={styles.planBreakdown}>$4.91 / month // $59 billed annually</Text>
                        <Text style={styles.trialText}>7-day trial if configured • Auto-renews yearly</Text>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.planPrice}>$59</Text>
                        <Text style={styles.planDuration}>/ YEAR</Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>

                {/* Plan 2: Lifetime Sovereignty */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleSelectPlan('lifetime')}
                  style={[
                    styles.planCardWrapper,
                    selectedPlan === 'lifetime' && styles.planCardActive,
                  ]}
                >
                  <BlurView
                    intensity={selectedPlan === 'lifetime' ? GlassBlur.intensity.heavy : GlassBlur.intensity.subtle}
                    tint={GlassBlur.tint}
                    blurMethod={GlassBlur.blurMethod}
                    style={styles.planCard}
                  >
                    <LinearGradient
                      colors={
                        selectedPlan === 'lifetime'
                          ? ['rgba(255, 215, 0, 0.16)', 'rgba(255, 159, 10, 0.03)']
                          : Palette.specularGradient
                      }
                      style={styles.absoluteFill}
                      pointerEvents="none"
                    />
                    <View style={styles.planHeaderRow}>
                      <View style={styles.planTitleCol}>
                        <Text style={styles.planName}>LIFETIME AUTONOMY</Text>
                        <Text style={styles.planBreakdown}>Permanent hardware pass // Non-consumable</Text>
                        <Text style={styles.trialText}>Pay once • Zero recurring charges forever</Text>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.planPrice}>$149</Text>
                        <Text style={styles.planDuration}>ONE-TIME</Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>

              {/* Status / Error Toast Notice */}
              {purchaseError && (
                <View style={styles.errorToast}>
                  <Ionicons name="alert-circle" size={16} color={Palette.signalAlert} />
                  <Text style={styles.errorToastText}>{purchaseError}</Text>
                </View>
              )}

              {restoreMessage && (
                <View style={styles.restoreToast}>
                  <Ionicons name="information-circle" size={16} color={Palette.tierSovereign} />
                  <Text style={styles.restoreToastText}>{restoreMessage}</Text>
                </View>
              )}

              {/* High-Status Commit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isProcessing}
                onPress={handleCommitUpgrade}
                style={styles.commitButtonWrapper}
              >
                <BlurView
                  intensity={GlassBlur.intensity.heavy}
                  tint={GlassBlur.tint}
                  blurMethod={GlassBlur.blurMethod}
                  style={styles.commitButton}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FF9F0A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.absoluteFill}
                  />
                  {isProcessing ? (
                    <View style={styles.processingRow}>
                      <ActivityIndicator size="small" color="#000000" />
                      <Text style={styles.commitButtonText}>
                        {isRestoring ? 'VERIFYING BIOMETRIC ENCLAVE...' : 'SECURING PROTOCOL...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.commitButtonText}>
                      {selectedPlan === 'annual'
                        ? 'ENGAGE ANNUAL PASS // $59.00 / YR'
                        : 'CLAIM LIFETIME AUTONOMY // $149.00'}
                    </Text>
                  )}
                </BlurView>
              </TouchableOpacity>

              {/* App Store Guideline 3.1.1 Subscription Disclosure */}
              <View style={styles.legalDisclaimerBox}>
                <Text style={styles.legalDisclaimerText}>
                  Payment charged to Apple ID at confirmation. Annual subscription automatically renews at $59.00/yr unless auto-renew is cancelled at least 24 hours prior to the end of the current period. Manage or cancel subscriptions anytime in iOS Settings → Apple ID.
                </Text>
              </View>

              {/* Privacy Guarantee & Restore Purchases */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isProcessing}
                  onPress={handleRestorePurchases}
                  style={styles.restoreLinkWrapper}
                >
                  <Ionicons name="finger-print-outline" size={12} color={Palette.tierSovereign} />
                  <Text style={styles.footerLinkHighlight}>RESTORE PURCHASES</Text>
                </TouchableOpacity>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenLegal('terms')}
                >
                  <Text style={styles.footerLink}>TERMS OF USE (EULA)</Text>
                </TouchableOpacity>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenLegal('privacy')}
                >
                  <Text style={styles.footerLink}>PRIVACY</Text>
                </TouchableOpacity>

                <View style={styles.footerDivider} />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDismiss}
                >
                  <Text style={styles.footerLink}>DISMISS</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Embedded Legal Modal for Apple Review Compliance */}
      <LegalModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialTab={legalInitialTab}
      />
    </>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 14, 0.94)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 48 : 32,
    backgroundColor: Palette.canvasRaised,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xxl + 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  badgeWrapper: {
    borderRadius: Layout.radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    marginBottom: Layout.spacing.sm,
    ...Shadows.subtleSpecular,
  },
  sovereignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Palette.glassSurface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Palette.tierSovereign,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.sm,
  },
  benefitsContainer: {
    gap: 13,
    marginBottom: Layout.spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 11.5,
    lineHeight: 16,
    color: Palette.textTertiary,
  },
  contrastCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: Layout.spacing.lg,
    overflow: 'hidden',
    ...Shadows.amberGlow,
  },
  contrastIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contrastTextContainer: {
    flex: 1,
  },
  contrastHeadline: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Palette.tierSovereign,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  contrastDetail: {
    fontSize: 11,
    lineHeight: 16,
    color: Palette.textSecondary,
  },
  plansContainer: {
    gap: 12,
    marginBottom: Layout.spacing.md,
  },
  planCardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  planCardActive: {
    borderColor: Palette.tierSovereign,
    ...Shadows.amberGlow,
  },
  planCard: {
    padding: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  pillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  planName: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: 0.5,
  },
  recommendedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: Palette.tierSovereign,
  },
  recommendedText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.tierSovereign,
  },
  planBreakdown: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginTop: 1,
  },
  trialText: {
    fontSize: 9.5,
    color: Palette.tierSovereign,
    fontWeight: '600',
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  planDuration: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textTertiary,
  },
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    marginBottom: Layout.spacing.md,
  },
  errorToastText: {
    flex: 1,
    fontSize: 11,
    color: Palette.signalAlert,
    fontWeight: '600',
  },
  restoreToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: Layout.spacing.md,
  },
  restoreToastText: {
    flex: 1,
    fontSize: 11,
    color: Palette.tierSovereign,
    fontWeight: '600',
  },
  commitButtonWrapper: {
    height: 56,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    marginBottom: Layout.spacing.sm,
    ...Shadows.amberGlow,
  },
  commitButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commitButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#000000',
  },
  legalDisclaimerBox: {
    paddingHorizontal: Layout.spacing.xs,
    marginBottom: Layout.spacing.md,
  },
  legalDisclaimerText: {
    fontSize: 10,
    lineHeight: 14.5,
    color: Palette.textTertiary,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: Layout.spacing.xs,
  },
  restoreLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerLinkHighlight: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: Palette.tierSovereign,
  },
  footerLink: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.textMuted,
  },
  footerDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});