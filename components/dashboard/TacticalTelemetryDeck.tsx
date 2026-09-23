import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppData } from '../../context/AppDataContext';
import { Palette, Typography, Layout, GlassBlur } from '../../constants/theme';

export const TacticalTelemetryDeck: React.FC = () => {
  const { state } = useAppData();
  const { bestRecordMs, attemptCount } = state.profile;

  // Format best record to compact human-readable tactical telemetry
  const formatBestRecord = (ms: number) => {
    if (ms <= 0) return '00D 00H';
    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(days)}D ${pad(hours)}H`;
  };

  const handlePillPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      {/* Pill 1: All-Time Best Record */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePillPress}
        style={styles.pillWrapper}
      >
        <BlurView
          intensity={GlassBlur.intensity.standard}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.glassPill}
        >
          <LinearGradient
            colors={Palette.specularGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specularBorder}
            pointerEvents="none"
          />
          <View style={styles.headerRow}>
            <Ionicons name="trophy-outline" size={13} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.kicker}>BEST STREAK</Text>
          </View>
          <Text style={styles.metricValue}>{formatBestRecord(bestRecordMs)}</Text>
          <Text style={styles.subtext}>PERSONAL RECORD</Text>
        </BlurView>
      </TouchableOpacity>

      {/* Pill 2: Current Attempt Counter */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePillPress}
        style={styles.pillWrapper}
      >
        <BlurView
          intensity={GlassBlur.intensity.standard}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.glassPill}
        >
          <LinearGradient
            colors={Palette.specularGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specularBorder}
            pointerEvents="none"
          />
          <View style={styles.headerRow}>
            <Ionicons name="shield-outline" size={13} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.kicker}>ATTEMPT</Text>
          </View>
          <Text style={styles.metricValue}>#{attemptCount}</Text>
          <Text style={styles.subtext}>CURRENT RUN</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.sm,
  },
  pillWrapper: {
    flex: 1,
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.specularBorder,
  },
  glassPill: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specularBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  kicker: {
    ...Typography.kicker,
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: Palette.textSecondary,
  },
  metricValue: {
    ...Typography.telemetryValue,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
    color: Palette.textPrimary,
  },
  subtext: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Palette.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});