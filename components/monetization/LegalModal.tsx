import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Typography, Layout, GlassBlur } from '../../constants/theme';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

type TabType = 'terms' | 'privacy';

export const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleSwitchTab = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <BlurView
          intensity={GlassBlur.intensity.heavy}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.absoluteFill}
        />

        <View style={styles.sheetContainer}>
          {/* Header Drag / Dismiss Bar */}
          <View style={styles.dragBarContainer}>
            <View style={styles.dragPill} />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>COMPLIANCE & PROTOCOLS</Text>
              <Text style={styles.title}>Legal Disclosures</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={Palette.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSwitchTab('terms')}
              style={[styles.tabButton, activeTab === 'terms' && styles.tabButtonActive]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'terms' && styles.tabButtonTextActive,
                ]}
              >
                TERMS OF USE (EULA)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSwitchTab('privacy')}
              style={[styles.tabButton, activeTab === 'privacy' && styles.tabButtonActive]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'privacy' && styles.tabButtonTextActive,
                ]}
              >
                PRIVACY MANIFEST
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'terms' ? (
              <View style={styles.legalSection}>
                <Text style={styles.sectionHeader}>Apple App Store Review Guideline 3.1.1 Disclosures</Text>

                <View style={styles.calloutCard}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Palette.tierSovereign} />
                  <Text style={styles.calloutText}>
                    Subscription automatically renews unless auto-renew is turned off at least 24 hours prior to the conclusion of the active billing period.
                  </Text>
                </View>

                <Text style={styles.bodyParagraph}>
                  1. <Text style={styles.boldText}>Sovereign Annual Pass Subscription</Text>: The Sovereign Annual Pass ($59.00 USD/year) unlocks full 90-day roadmap stages (Stages 2–4), full history and patterns, and custom daily bonus settings. Payment will be charged to your Apple ID Account at confirmation of purchase.
                </Text>

                <Text style={styles.bodyParagraph}>
                  2. <Text style={styles.boldText}>Renewal & Cancellation</Text>: Your subscription automatically renews unless auto-renew is disabled in Apple ID Settings at least 24 hours before the end of the current period. Your Apple ID will be charged for renewal within 24 hours prior to the end of the current billing cycle at $59.00 USD.
                </Text>

                <Text style={styles.bodyParagraph}>
                  3. <Text style={styles.boldText}>Managing Subscriptions</Text>: You can manage and cancel your subscriptions anytime by navigating to your iOS device Settings → [Your Name] → Subscriptions after purchase. Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.
                </Text>

                <Text style={styles.bodyParagraph}>
                  4. <Text style={styles.boldText}>Sovereign Lifetime Autonomy Pass</Text>: The Sovereign Lifetime Pass ($149.00 USD one-time purchase) is a non-consumable, permanent license that grants unrestricted access to all current and future Sovereign capabilities without recurring fees.
                </Text>

                <Text style={styles.bodyParagraph}>
                  5. <Text style={styles.boldText}>Restoration Rights</Text>: Purchases may be restored at any time on any iOS device linked to the purchasing Apple ID via the in-app "Restore Purchases" terminal action, protected by biometric authorization.
                </Text>

                <Text style={styles.bodyParagraph}>
                  6. <Text style={styles.boldText}>Standard Apple Licensed Application EULA</Text>: Sovereign is governed by the standard Apple Licensed Application End User License Agreement: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
                </Text>
              </View>
            ) : (
              <View style={styles.legalSection}>
                <Text style={styles.sectionHeader}>Zero-Tracking Air-Gapped Privacy Architecture</Text>
                <Text style={styles.paragraphText}>
                  Sovereign operates entirely locally. We do not track, upload, or analyze your data on external servers.
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletText}>
                    • <Text style={styles.boldText}>On-Device Storage</Text>: Your habit data, reset history, and journal notes are stored strictly on your device's secure enclave (SQLite/AsyncStorage).
                  </Text>
                  <Text style={styles.bulletText}>
                    • <Text style={styles.boldText}>No Tracking</Text>: 100% on-device local storage. Zero telemetry. Zero remote servers. Your habit data never leaves this device.
                  </Text>
                  <Text style={styles.bulletText}>
                    • <Text style={styles.boldText}>Biometric Protection</Text>: The app locks behind Face ID or Touch ID, ensuring your data is inaccessible to anyone else holding your device.
                  </Text>
                </View>

                <Text style={styles.sectionHeader}>Hardware & Storage Permissions</Text>
                <Text style={styles.paragraphText}>
                  Sovereign operates 100% on-device with zero remote servers or tracking.
                </Text>
                <Text style={styles.bulletText}>
                  1. <Text style={styles.boldText}>Device Motion & Haptics</Text>: Haptic feedback is processed locally through iOS system engines. No camera, microphone, or external recording permissions are requested or used.
                </Text>

                <Text style={styles.bodyParagraph}>
                  4. <Text style={styles.boldText}>Third-Party Tracking</Text>: Sovereign contains zero advertising networks, zero tracking cookies, and zero behavioral analytics. StoreKit purchasing is routed through Apple's official sandbox/production endpoints for cryptographic receipt validation.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 14, 0.88)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    backgroundColor: Palette.canvasRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  dragBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.4,
    color: Palette.tierSovereign,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderRadius: Layout.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.pill,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: Palette.tierSovereign,
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Palette.textTertiary,
  },
  tabButtonTextActive: {
    color: Palette.tierSovereign,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl + 20,
  },
  legalSection: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: 0.5,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  paragraphText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  bulletList: {
    paddingLeft: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  calloutText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16.5,
    color: Palette.textSecondary,
  },
  bodyParagraph: {
    fontSize: 12,
    lineHeight: 18,
    color: Palette.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: Palette.textPrimary,
  },
});
