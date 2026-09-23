import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface ResetTimerButtonProps {
  onPress: () => void;
}

export const ResetTimerButton: React.FC<ResetTimerButtonProps> = ({ onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handlePress}
        style={styles.buttonWrapper}
      >
        <BlurView
          intensity={GlassBlur.intensity.standard}
          tint={GlassBlur.tint}
          blurMethod={GlassBlur.blurMethod}
          style={styles.glassButton}
        >
          {/* Ambient Crimson Gradient Overlay */}
          <LinearGradient
            colors={Palette.crimsonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.absoluteFill}
            pointerEvents="none"
          />

          {/* Specular Edge Border */}
          <LinearGradient
            colors={['rgba(255, 69, 58, 0.45)', 'rgba(255, 69, 58, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.specularBorder}
            pointerEvents="none"
          />

          <View style={styles.contentRow}>
            <View style={styles.iconBeacon}>
              <Ionicons name="alert-circle" size={16} color={Palette.signalAlert} />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.kicker}>CONFRONT SLIP</Text>
              <Text style={styles.buttonLabel}>RESET TIMER / REPORT SLIP</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color="rgba(255, 69, 58, 0.65)"
            />
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
  buttonWrapper: {
    borderRadius: Layout.radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.25)',
    ...Shadows.crimsonGlow,
  },
  glassButton: {
    paddingVertical: 14,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
    justifyContent: 'center',
  },
  specularBorder: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBeacon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  textStack: {
    flex: 1,
    marginHorizontal: 12,
  },
  kicker: {
    ...Typography.kickerAlert,
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Palette.textPrimary,
  },
});