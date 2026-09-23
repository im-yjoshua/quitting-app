import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  useAppTheme,
  ACCENT_PALETTES,
  AccentPaletteId,
} from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import {
  getShieldState,
  requestFamilyControlsAuth,
  openTriggerAppPicker,
  setAdultContentFilter,
  ShieldState,
} from '@/services/shield';
import { scheduleDailyCheckIn, cancelAllNotifications } from '@/services/notifications';
import { NotificationScheduleCard } from '@/components/settings/NotificationScheduleCard';

interface DrawerNavigation {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const NOTIFICATIONS_STORAGE_KEY = '@sovereign_notifications_enabled';

const PALETTE_ORDER: AccentPaletteId[] = ['cobalt', 'crimson', 'gold', 'emerald'];

export default function SettingsScreen() {
  const {
    theme,
    toggleTheme,
    colors,
    accent,
    setAccent,
    stealthMode,
    toggleStealthMode,
    appTitle,
  } = useAppTheme();
  const { state, isSovereignUser, toggleBiometrics, openPaywall } = useAppData();
  const navigation = useNavigation<DrawerNavigation>();

  
  const [shieldState, setShieldState] = useState<ShieldState>({
    isAuthorized: false,
    isActive: false,
    activeUntil: null,
    shieldedAppCount: 0,
    adultContentFilterEnabled: true,
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    async function loadSettings() {
      try {
        const [storedNotif, currentShield] = await Promise.all([
          AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
          getShieldState(),
        ]);

        setShieldState(currentShield);

        if (storedNotif !== null) {
          
        }
      } catch (err) {
        console.warn('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleSelectAccent = async (nextAccent: AccentPaletteId) => {
    if (!isSovereignUser && nextAccent !== 'emerald') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      openPaywall();
      return;
    }
    Haptics.selectionAsync();
    await setAccent(nextAccent);
  };

  const handleToggleStealthMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleStealthMode();
  };

  const handleToggleBiometrics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleBiometrics();
  };

  const handleOpenDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.openDrawer();
  };

  const handleTierPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openPaywall();
  };

  const handleRequestAuth = async () => {
    if (!isSovereignUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      openPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestFamilyControlsAuth();
    const updated = await getShieldState();
    setShieldState(updated);
  };

  const handlePickApps = async () => {
    if (!isSovereignUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      openPaywall();
      return;
    }
    Haptics.selectionAsync();
    await openTriggerAppPicker();
    const updated = await getShieldState();
    setShieldState(updated);
  };

  const handleToggleAdultFilter = async (val: boolean) => {
    if (!isSovereignUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      openPaywall();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setAdultContentFilter(val);
    const updated = await getShieldState();
    setShieldState(updated);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.canvas }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Minimalist Hamburger Menu */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenDrawer}
            style={styles.menuButton}
            accessibilityLabel="Open Navigation Drawer"
          >
            <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Settings
          </Text>
        </View>

        {/* Group 1: Preferences & Palette */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          PREFERENCES
        </Text>
        <View
          style={[
            styles.capsuleContainer,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(150, 150, 150, 0.2)',
            },
          ]}
        >
          <BlurView
            intensity={35}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurCapsule}
          >
            {/* Dark Mode Row */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {isDark ? 'OLED Absolute Black' : 'Warm Beige Light Mode'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleToggleTheme}
                trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
              />
            </View>

            {/* Hairline Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            />

            {/* Dynamic Accent Palette Picker */}
            <View style={styles.paletteSection}>
              <View style={styles.paletteHeaderRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons name="color-palette-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.paletteHeaderText}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Accent Palette
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    Chronometer rings, pills & active glows
                  </Text>
                </View>
              </View>

              {/* Horizontal Palette Swatches */}
              <View style={styles.paletteGrid}>
                {PALETTE_ORDER.map((paletteKey) => {
                  const opt = ACCENT_PALETTES[paletteKey];
                  const isSelected = accent === paletteKey;
                  const chipColor = isDark ? opt.darkHex : opt.lightHex;

                  return (
                    <TouchableOpacity
                      key={paletteKey}
                      activeOpacity={0.8}
                      onPress={() => handleSelectAccent(paletteKey)}
                      style={[
                        styles.paletteCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.06)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'rgba(0, 0, 0, 0.02)',
                          borderColor: isSelected
                            ? chipColor
                            : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(150, 150, 150, 0.15)',
                        },
                      ]}
                      accessibilityLabel={`Select ${opt.name} accent`}
                    >
                      <View style={[styles.paletteDot, { backgroundColor: chipColor, justifyContent: 'center', alignItems: 'center' }]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                        )}
                        {!isSelected && !isSovereignUser && paletteKey !== 'emerald' && (
                          <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.paletteLabel,
                          {
                            color: isSelected
                              ? colors.textPrimary
                              : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Hairline Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            />

            {/* Notification Schedule Card */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <NotificationScheduleCard />
            </View>
          </BlurView>
        </View>

        {/* Group 2: Stealth Mode (Preview) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            STEALTH & DISGUISE (PREVIEW)
          </Text>
          <View
            style={[
              styles.proTag,
              {
                backgroundColor: isSovereignUser
                  ? colors.accentSubtle
                  : 'rgba(255, 215, 0, 0.15)',
                borderColor: isSovereignUser
                  ? colors.accent
                  : 'rgba(255, 215, 0, 0.4)',
              },
            ]}
          >
            <Text
              style={[
                styles.proTagText,
                { color: isSovereignUser ? colors.accent : '#FFD60A' },
              ]}
            >
              PRO
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.capsuleContainer,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(150, 150, 150, 0.2)',
            },
          ]}
        >
          <BlurView
            intensity={35}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurCapsule}
          >
            {/* Clean UI Toggle: Stealth Mode (Preview) */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name={stealthMode ? 'eye-off' : 'eye-off-outline'}
                    size={18}
                    color={stealthMode ? colors.accent : colors.textPrimary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Stealth Mode (Preview)
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {stealthMode
                      ? 'Active: App disguised as "Focus Utility"'
                      : 'Mask navigation headers & recovery telemetry'}
                  </Text>
                </View>
              </View>
              <Switch
                value={stealthMode}
                onValueChange={handleToggleStealthMode}
                trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
              />
            </View>

            {/* Explanatory Footer */}
            <View style={styles.iconFootnote}>
              <Ionicons
                name="information-circle-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={[styles.iconFootnoteText, { color: colors.textSecondary }]}>
                Pure Expo Go preview: Disguises interface titles and recovery telemetry in local state without invoking native iOS APIs.
              </Text>
            </View>
          </BlurView>
        </View>

        {/* Group 3: Active Defense (Screen Time & ManagedSettings) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            ACTIVE DEFENSE (SCREEN TIME)
          </Text>
          <View
            style={[
              styles.proTag,
              {
                backgroundColor: isSovereignUser
                  ? colors.accentSubtle
                  : 'rgba(255, 215, 0, 0.15)',
                borderColor: isSovereignUser
                  ? colors.accent
                  : 'rgba(255, 215, 0, 0.4)',
              },
            ]}
          >
            <Text
              style={[
                styles.proTagText,
                { color: isSovereignUser ? colors.accent : '#FFD60A' },
              ]}
            >
              PRO
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.capsuleContainer,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(150, 150, 150, 0.2)',
            },
          ]}
        >
          <BlurView
            intensity={35}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurCapsule}
          >
            {/* Screen Time Authorization Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRequestAuth}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={shieldState.isAuthorized ? colors.accent : colors.textPrimary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    FamilyControls Access
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {shieldState.isAuthorized
                      ? 'OS-level shield permissions active'
                      : 'Required to enforce emergency app block'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.authBadge,
                  {
                    backgroundColor: shieldState.isAuthorized
                      ? colors.accentSubtle
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                    borderColor: shieldState.isAuthorized
                      ? colors.accent
                      : isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.authBadgeText,
                    {
                      color: shieldState.isAuthorized
                        ? colors.accent
                        : colors.textPrimary,
                    },
                  ]}
                >
                  {shieldState.isAuthorized ? 'AUTHORIZED' : 'AUTHORIZE'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Hairline Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            />

            {/* Trigger App Selection Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickApps}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="apps-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Shielded Trigger Apps
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {shieldState.shieldedAppCount > 0
                      ? `${shieldState.shieldedAppCount} app${shieldState.shieldedAppCount === 1 ? '' : 's'} locked during emergency`
                      : 'Choose distracting apps (Opaque Tokens)'}
                  </Text>
                </View>
              </View>

              <View style={styles.chevronBadge}>
                <Text
                  style={[
                    styles.chevronBadgeText,
                    {
                      color: shieldState.shieldedAppCount > 0
                        ? colors.accent
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {shieldState.shieldedAppCount > 0
                    ? `${shieldState.shieldedAppCount} Selected`
                    : 'Select'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {/* Hairline Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            />

            {/* Explicit Web Filter Row */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.rowTextBlock}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Adult Content Filter
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    OS WebContent block during active shield
                  </Text>
                </View>
              </View>
              <Switch
                value={shieldState.adultContentFilterEnabled}
                onValueChange={handleToggleAdultFilter}
                trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
              />
            </View>

            {/* Explanatory Footer */}
            <View style={styles.iconFootnote}>
              <Ionicons
                name="shield-outline"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={[styles.iconFootnoteText, { color: colors.textSecondary }]}>
                Air-Gapped: Uses Apple Opaque Tokens. Sovereign never sees your app list or browsing history.
              </Text>
            </View>
          </BlurView>
        </View>

        {/* Group 4: Security & Membership */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          SECURITY & MEMBERSHIP
        </Text>
        <View
          style={[
            styles.capsuleContainer,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(150, 150, 150, 0.2)',
            },
          ]}
        >
          <BlurView
            intensity={35}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurCapsule}
          >
            {/* Biometric Enclave Row */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    Biometric Enclave
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    Face ID & Touch ID lock
                  </Text>
                </View>
              </View>
              <Switch
                value={state.profile.biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ true: colors.accent, false: 'rgba(150, 150, 150, 0.3)' }}
              />
            </View>

            {/* Hairline Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            />

            {/* Tier Indicator Row (Masked in Stealth Mode) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTierPress}
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="diamond-outline"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                    {stealthMode ? 'Pro Membership' : 'Sovereign Tier'}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                    {isSovereignUser
                      ? stealthMode
                        ? 'Full Pro Access Unlocked'
                        : 'Full Sovereign Access Unlocked'
                      : 'Free Edition • Tap to Upgrade'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isSovereignUser
                        ? colors.accent
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {isSovereignUser ? 'ACTIVE' : 'FREE'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* System Info (Masked in Stealth Mode) */}
        <View style={styles.systemInfoContainer}>
          <Text style={[styles.systemInfoText, { color: colors.textSecondary }]}>
            {stealthMode ? 'FOCUS UTILITY v1.0' : `${appTitle} TERMINAL v1.0`}
          </Text>
          <Text style={[styles.systemInfoSub, { color: colors.textSecondary }]}>
            100% On-Device • Zero Remote Telemetry
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  topBar: {
    marginBottom: 24,
  },
  menuButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginLeft: 4,
    marginRight: 4,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  proTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  capsuleContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as any } : {}),
  },
  blurCapsule: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTextBlock: {
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  rowSubtitle: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
    marginRight: 16,
  },
  paletteSection: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  paletteHeaderText: {
    flex: 1,
  },
  paletteGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  paletteCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  paletteDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  iconFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    opacity: 0.8,
  },
  iconFootnoteText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  authBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  authBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevronBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  systemInfoContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  systemInfoText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  systemInfoSub: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
});

