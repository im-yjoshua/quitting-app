import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface SeverePanicCardProps {
  onPress: () => void;
}

export const SeverePanicCard: React.FC<SeverePanicCardProps> = ({ onPress }) => {
  const { canClaimIntervention, interventionCooldownSeconds } = useAppData();

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onPress();
  };

  const formatCooldown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.cardWrapper}
      >
        <BlurView
          intensity={GlassBlur.intensity.heavy}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.glassCard}
        >
          {/* Tactical Atmospheric Glow */}
          <LinearGradient
            colors={Palette.crimsonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.absoluteFill}
            pointerEvents="none"
          />

          {/* Top Specular Edge Highlight */}
          <LinearGradient
            colors={Palette.specularGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.specularBorder}
            pointerEvents="none"
          />

          <View style={styles.contentRow}>
            <View style={styles.beaconContainer}>
              <View style={styles.pulsingBeacon}>
                <Ionicons
                  name="shield-sharp"
                  size={20}
                  color={canClaimIntervention ? Palette.signalAlert : Palette.textMuted}
                />
              </View>
            </View>

            <View style={styles.textContainer}>
              <View style={styles.kickerRow}>
                <Text
                  style={[
                    styles.kicker,
                    !canClaimIntervention && { color: Palette.textMuted },
                  ]}
                >
                  {canClaimIntervention
                    ? 'ACUTE URGE OVERRIDE'
                    : `LOCKOUT RECOVERY // ${formatCooldown(interventionCooldownSeconds)}`}
                </Text>
              </View>

              <Text style={styles.title}>Somatic Circuit Breaker</Text>
              <Text style={styles.subtitle}>
                {canClaimIntervention
                  ? 'Sever dopamine craving loop via 30s physical intervention protocol.'
                  : 'Cooldown active. Physical dopamine equilibrium stabilizing.'}
              </Text>
            </View>

            <View style={styles.actionArrowContainer}>
              <View
                style={[
                  styles.actionPill,
                  !canClaimIntervention && styles.actionPillLocked,
                ]}
              >
                <Ionicons
                  name={canClaimIntervention ? 'flash' : 'time-outline'}
                  size={15}
                  color={canClaimIntervention ? Palette.signalAlert : Palette.textMuted}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
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
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.sm,
  },
  cardWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.28)',
    ...Shadows.crimsonGlow,
  },
  glassCard: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beaconContainer: {
    marginRight: 14,
  },
  pulsingBeacon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.6,
    color: Palette.signalAlert,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: Palette.textSecondary,
  },
  actionArrowContainer: {
    marginLeft: 10,
  },
  actionPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 69, 58, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  actionPillLocked: {
    backgroundColor: Palette.glassSurfaceSubtle,
    borderColor: Palette.specularBorderSubtle,
  },
});