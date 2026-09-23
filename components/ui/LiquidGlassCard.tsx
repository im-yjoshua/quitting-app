import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  intensity?: number;
}

export function LiquidGlassCard({ children, style, onPress, intensity = 40 }: LiquidGlassCardProps) {
  const { theme, colors } = useAppTheme();
  const isDark = theme === 'dark';

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Gentle continuous floating idle animation
    translateY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.97, { damping: 15, stiffness: 120, mass: 0.8 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 120, mass: 0.8 });
    }
  };

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={styles.pressable}
      >
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtle inner glow / surface reflection */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)']
              : ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.1)']
          }
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Specular border wrapper to ensure border sits inside or over content seamlessly */}
        <View style={styles.contentWrapper}>
          {children}
        </View>

        {/* Specular gradient border */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']
              : ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.4)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.specularBorder}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  pressable: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    zIndex: 1,
  },
  specularBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
});
