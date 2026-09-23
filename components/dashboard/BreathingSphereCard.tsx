import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette, Typography, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface BreathingSphereCardProps {
  onPress: () => void;
}

export const BreathingSphereCard: React.FC<BreathingSphereCardProps> = ({ onPress }) => {
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    breatheScale.value = withRepeat(withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }]
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
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
          {/* Top Specular Edge Highlight */}
          <LinearGradient
            colors={Palette.specularGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specularBorder}
            pointerEvents="none"
          />

          <View style={styles.contentRow}>
            <View style={styles.beaconContainer}>
              <Animated.View style={[styles.breathingBeacon, breatheStyle]}>
                <Ionicons name="pulse" size={20} color="#FFFFFF" />
              </Animated.View>
            </View>

            <View style={styles.textContainer}>
              <View style={styles.kickerRow}>
                <Text style={styles.kicker}>BREATHE</Text>
              </View>
              <Text style={styles.title}>4-7-8 Breathing Sphere</Text>
              <Text style={styles.subtitle}>
                Slow your heart rate & earn 50 Aura
              </Text>
            </View>

            <View style={styles.actionPill}>
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
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
    borderColor: Palette.specularBorder,
    ...Shadows.subtleSpecular,
  },
  glassCard: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Palette.glassSurface,
  },
  specularBorder: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  beaconContainer: {
    marginRight: 14,
  },
  breathingBeacon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#8E8E93',
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
  actionPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(100, 210, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.25)',
    marginLeft: 10,
  },
});