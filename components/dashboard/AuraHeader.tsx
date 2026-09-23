import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';
import { AuraTier } from '../../types/app';

interface AuraHeaderProps {
  onPressAura?: () => void;
}

export const AuraHeader: React.FC<AuraHeaderProps> = ({ onPressAura }) => {
  const { state, auraTier, isSovereignUser } = useAppData();
  const { auraScore, habitTitle } = state.profile;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPressAura) {
      onPressAura();
    }
  };

  const effectiveTier: AuraTier = isSovereignUser ? 'Sovereign' : auraTier;

  const getTierColor = (tier: AuraTier) => {
    switch (tier) {
      case 'Sovereign':
        return Palette.tierSovereign;
      case 'Sentinel':
        return Palette.tierSentinel;
      case 'Initiate':
      default:
        return Palette.tierInitiate;
    }
  };

  const tierColor = getTierColor(effectiveTier);
  const isSovereign = isSovereignUser || auraTier === 'Sovereign';


  return (
    <View style={styles.container}>
      {/* Left: Active Habit Identifier */}
      <View style={styles.leftContainer}>
        <Text style={styles.kicker}>HABIT</Text>
        <Text style={styles.habitTitle} numberOfLines={1} ellipsizeMode="tail">
          {habitTitle || 'Digital Freedom'}
        </Text>
      </View>

      {/* Right: Glowing Aura Metric Pill */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.auraPillWrapper,
          isSovereign ? Shadows.amberGlow : Shadows.subtleSpecular,
          { borderColor: isSovereign ? 'rgba(255, 215, 0, 0.35)' : Palette.specularBorder },
        ]}
      >
        <BlurView
          intensity={GlassBlur.intensity.heavy}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.auraPill}
        >
          {/* Tier Specular Highlight */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
            style={styles.specularBorder}
            pointerEvents="none"
          />

          {/* Tier Accent Node */}
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />

          {/* Tabular Aura Points Value */}
          <Text style={[styles.auraValue, { color: isSovereign ? Palette.tierSovereign : Palette.textPrimary }]}>
            {auraScore.toLocaleString()}
          </Text>

          <View style={styles.auraLabelStack}>
            <Text style={styles.auraLabel}>AURA</Text>
            <Text style={[styles.tierBadge, { color: tierColor }]}>
              {effectiveTier.toUpperCase()}
            </Text>
          </View>

          <Ionicons
            name="sparkles"
            size={11}
            color={tierColor}
            style={styles.sparkleIcon}
          />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  leftContainer: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.textMuted,
    marginBottom: 2,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  auraPillWrapper: {
    borderRadius: Layout.radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
  },
  auraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Palette.glassSurface,
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  auraValue: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    marginRight: 6,
  },
  auraLabelStack: {
    marginRight: 4,
  },
  auraLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Palette.textSecondary,
  },
  tierBadge: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sparkleIcon: {
    marginLeft: 2,
  },
});