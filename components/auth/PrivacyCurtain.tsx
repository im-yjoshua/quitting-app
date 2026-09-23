import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface PrivacyCurtainProps {
  visible: boolean;
}

/**
 * PrivacyCurtain Component
 *
 * Obscures sensitive habit telemetry, streak counters, and relapse history
 * whenever the application transitions to inactive or background states.
 * This guarantees that iOS Multitasking App Switcher cached snapshots
 * contain zero personal data leakage.
 */
export const PrivacyCurtain: React.FC<PrivacyCurtainProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Absolute solid dark substrate to prevent underlying frame leakage */}
      <View style={styles.solidSubstrate} />

      {/* Heavy Frosted Glass Shield */}
      <BlurView
        intensity={GlassBlur.intensity.heavy}
        tint={GlassBlur.tint}
        blurMethod={GlassBlur.blurMethod}
        style={styles.absoluteFill}
      />

      {/* Atmospheric Enclave Glow */}
      <View style={styles.ambientAtmosphere} pointerEvents="none" />

      {/* Specular Shield Centerpiece */}
      <View style={styles.centerContainer}>
        <View style={styles.shieldBeaconWrapper}>
          <BlurView
            intensity={GlassBlur.intensity.standard}
            tint={GlassBlur.tint}
            blurMethod={GlassBlur.blurMethod}
            style={styles.shieldBeacon}
          >
            <LinearGradient
              colors={Palette.specularGradient}
              style={styles.absoluteFill}
              pointerEvents="none"
            />
            <Ionicons
              name="shield-checkmark"
              size={46}
              color={Palette.textPrimary}
            />
          </BlurView>
        </View>

        {/* Utilitarian Monochromatic Typography Stack */}
        <Text style={styles.kicker}>PRIVACY SHIELD</Text>
        <Text style={styles.title}>Screen Protected</Text>
        <Text style={styles.subtitle}>
          Your data is hidden while you switch apps. Everything stays private on your device.
        </Text>

        {/* Hardware Status Pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>PRIVATE • ON-DEVICE ONLY</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  solidSubstrate: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Palette.canvasRaised,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  ambientAtmosphere: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Palette.monochromeGlow,
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  shieldBeaconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorderBright,
    marginBottom: Layout.spacing.lg,
    ...Shadows.subtleSpecular,
  },
  shieldBeacon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.glassSurface,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 10,
    letterSpacing: 2.2,
    color: Palette.textSecondary,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: Palette.textSecondary,
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Layout.radius.pill,
    backgroundColor: Palette.glassSurface,
    borderWidth: 1,
    borderColor: Palette.specularBorderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.tierSentinel,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textSecondary,
  },
});
