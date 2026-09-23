import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Drawer, DrawerContentScrollView } from 'expo-router/drawer';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Trophy, BookOpen, BarChart3, Settings, Gem } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';
import { Palette } from '@/constants/theme';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

interface DrawerNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  isAction?: boolean;
}

function CustomDrawerContent(props: any) {
  const { colors, theme, appTitle, appSubtitle, stealthMode } = useAppTheme();
  const { isSovereignUser, openPaywall } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark';

  const navItems: DrawerNavItem[] = [
    { id: 'home', label: 'Home', icon: Home, route: '/(drawer)' },
    { id: 'challenges', label: 'Challenges', icon: Trophy, route: '/(drawer)/challenges' },
    { id: 'journal', label: 'Journal', icon: BookOpen, route: '/(drawer)/journal' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/(drawer)/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/(drawer)/settings' },
    {
      id: 'premium',
      label: stealthMode ? 'Pro Membership' : 'Sovereign Premium',
      icon: Gem,
      isAction: true,
    },
  ];

  const handleNav = (item: DrawerNavItem) => {
    props.navigation.closeDrawer();

    if (item.isAction) {
      setTimeout(() => {
        openPaywall();
      }, 200);
      return;
    }

    if (item.route) {
      router.push(item.route as any);
    }
  };

  const isCurrentActive = (item: DrawerNavItem) => {
    if (item.id === 'home') {
      return pathname === '/' || pathname === '/(drawer)' || pathname === '/(drawer)/' || pathname.endsWith('drawer');
    }
    if (item.id === 'challenges') {
      return pathname.includes('challenges');
    }
    if (item.id === 'journal') {
      return pathname.includes('journal');
    }
    if (item.id === 'analytics') {
      return pathname.includes('analytics');
    }
    if (item.id === 'settings') {
      return pathname.includes('settings');
    }
    return false;
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Heavily frosted glass background matching active theme */}
      <BlurView
        intensity={65}
        tint={isDark ? 'dark' : 'light'}
        style={styles.absoluteFill}
      />
      <View
        style={[
          styles.themeTintOverlay,
          {
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.45)'
              : 'rgba(247, 247, 245, 0.75)',
          },
        ]}
      />
      <LinearGradient
        colors={isDark ? Palette.specularGradient : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.specularTopLine}
      />

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding (Dynamically masked in Stealth Mode) */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {appTitle}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {appSubtitle}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(150, 150, 150, 0.2)' }]} />

        {/* Spaced-out, High-Contrast Text Links */}
        <View style={styles.linksContainer}>
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            const isPremium = item.id === 'premium';
            const IconComponent = item.icon;

            return (
              <LiquidGlassCard
                key={item.id}
                onPress={() => handleNav(item)}
                intensity={active ? (isDark ? 60 : 80) : 0} // highlight active state
                style={[
                  styles.navItemCard,
                  active && {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
              >
                <View style={styles.navItemLeft}>
                  <IconComponent
                    size={20}
                    color={
                      active
                        ? colors.accent
                        : isPremium
                        ? colors.accent
                        : colors.textPrimary
                    }
                  />
                  <Text
                    style={[
                      styles.navItemLabel,
                      {
                        color: active
                          ? colors.textPrimary
                          : colors.textPrimary,
                        fontWeight: active ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>

                {isPremium && (
                  <View
                    style={[
                      styles.proBadge,
                      {
                        backgroundColor: isSovereignUser
                          ? colors.accentSubtle
                          : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isSovereignUser
                          ? colors.accent
                          : 'rgba(255, 255, 255, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.proBadgeText,
                        {
                          color: isSovereignUser
                            ? colors.accent
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {isSovereignUser ? 'ACTIVE' : 'TIER'}
                    </Text>
                  </View>
                )}
              </LiquidGlassCard>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer Info */}
      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(150, 150, 150, 0.15)', paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {stealthMode ? 'FOCUS UTILITY v1.0 • ON-DEVICE SECURE' : 'SOVEREIGN v1.0 • ON-DEVICE SECURE'}
        </Text>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          backgroundColor: 'transparent',
          width: '78%',
          maxWidth: 320,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(150, 150, 150, 0.2)',
        },
        sceneStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }} />
      <Drawer.Screen name="challenges" options={{ headerShown: false }} />
      <Drawer.Screen name="journal" options={{ headerShown: false }} />
      <Drawer.Screen name="analytics" options={{ headerShown: false }} />
      <Drawer.Screen name="settings" options={{ headerShown: false }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  themeTintOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  drawerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 0,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  linksContainer: {
    gap: 12,
  },
  navItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navItemLabel: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  proBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
