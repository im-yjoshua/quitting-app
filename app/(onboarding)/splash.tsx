import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function LaunchHookScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  // Animation values for smooth fade & subtle elevation
  const quoteOpacity = useSharedValue(0);
  const quoteTranslateY = useSharedValue(12);
  const promptOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Smoothly fade the quote in (0s to 1.3s)
    quoteOpacity.value = withTiming(1, {
      duration: 1300,
      easing: Easing.out(Easing.cubic),
    });
    quoteTranslateY.value = withTiming(0, {
      duration: 1300,
      easing: Easing.out(Easing.cubic),
    });

    // 2. Hold the quote, then at 3.0s fade in the tap prompt with a subtle breathing pulse
    promptOpacity.value = withDelay(
      3000,
      withSequence(
        withTiming(0.9, { duration: 800, easing: Easing.out(Easing.quad) }),
        withRepeat(
          withSequence(
            withTiming(0.35, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        )
      )
    );
  }, [quoteOpacity, quoteTranslateY, promptOpacity]);

  const handlePress = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(onboarding)/step1');
  };

  const animatedQuoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteTranslateY.value }],
  }));

  const animatedPromptStyle = useAnimatedStyle(() => ({
    opacity: promptOpacity.value,
  }));

  return (
    <Pressable onPress={handlePress} style={styles.container} accessibilityLabel="Tap anywhere to start">
      <StatusBar style="light" />

      {/* Centered High-Contrast Stoic Quote */}
      <View style={styles.quoteWrapper} pointerEvents="none">
        <Animated.View style={[styles.quoteContent, animatedQuoteStyle]}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.quoteText}>
            You have power over your mind — not outside events. Realize this, and you will find your strength.
          </Text>
          <Text style={styles.authorText}>MARCUS AURELIUS</Text>
        </Animated.View>
      </View>

      {/* Bottom Floating Tap Prompt */}
      <Animated.View style={[styles.promptContainer, animatedPromptStyle]} pointerEvents="none">
        <Text style={styles.promptText}>TAP ANYWHERE TO CONTINUE</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  quoteContent: {
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 40,
    color: '#6E7179',
    lineHeight: 40,
    marginBottom: 10,
    opacity: 0.5,
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  authorText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6E7179',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 22,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  promptContainer: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6E7179',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});

