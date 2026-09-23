import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette, Layout, GlassBlur, Shadows } from '../../constants/theme';

interface SovereignLockPillProps {
  onPress?: () => void;
  label?: string;
  size?: 'sm' | 'md';
}

export const SovereignLockPill: React.FC<SovereignLockPillProps> = ({
  onPress,
  label = 'SOVEREIGN PASS',
  size = 'md',
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    }
  };

  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={[
        styles.wrapper,
        isSmall && styles.wrapperSmall,
      ]}
    >
      <BlurView
        intensity={GlassBlur.intensity.standard}
        tint={GlassBlur.tint}
        blurMethod={GlassBlur.blurMethod}
        style={[
          styles.pill,
          isSmall && styles.pillSmall,
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.22)', 'rgba(255, 159, 10, 0.04)']}
          style={styles.absoluteFill}
          pointerEvents="none"
        />
        <Ionicons
          name="lock-closed"
          size={isSmall ? 10 : 12}
          color={Palette.tierSovereign}
        />
        <Text
          style={[
            styles.label,
            isSmall && styles.labelSmall,
          ]}
        >
          {label}
        </Text>
      </BlurView>
    </TouchableOpacity>
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
  wrapper: {
    borderRadius: Layout.radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    ...Shadows.amberGlow,
    alignSelf: 'flex-start',
  },
  wrapperSmall: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: Palette.glassSurface,
  },
  pillSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  label: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: Palette.tierSovereign,
  },
  labelSmall: {
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
});
