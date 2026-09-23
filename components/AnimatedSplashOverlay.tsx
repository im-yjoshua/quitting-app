import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '../constants/theme';

interface AnimatedSplashOverlayProps {
  onReady: boolean;
  onComplete: () => void;
}

export function AnimatedSplashOverlay({ onReady, onComplete }: AnimatedSplashOverlayProps) {
  const [isExiting, setIsExiting] = useState(false);
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.85);
  
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    iconOpacity.value = withTiming(1, { duration: 300 });
    iconScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    
    textOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
  }, []);

  useEffect(() => {
    if (onReady) {
      setIsExiting(true);
      // Exit animations
      const exitDuration = 500;
      containerOpacity.value = withDelay(
        400,
        withTiming(0, { duration: exitDuration, easing: Easing.out(Easing.quad) })
      );
      containerScale.value = withDelay(
        400,
        withTiming(1.04, { duration: exitDuration, easing: Easing.out(Easing.quad) }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [onReady, onComplete]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View pointerEvents={isExiting ? 'none' : 'auto'} style={[styles.overlay, containerAnimatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons name="shield-checkmark" size={52} color={Palette.textPrimary} />
        </Animated.View>
        <Animated.Text style={[styles.text, textAnimatedStyle]}>
          SOVEREIGN
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 99999,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    color: Palette.textPrimary,
    textTransform: 'uppercase',
  },
});
