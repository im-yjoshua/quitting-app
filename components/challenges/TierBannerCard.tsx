import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { useChallenges } from '@/context/ChallengesContext';

export function TierBannerCard() {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  const { data, currentTier, nextTier } = useChallenges();

  const glowOpacity = useSharedValue(0.4);
  const floatAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    // Breathing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle floating
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    let pct = 1;
    if (nextTier) {
      const range = nextTier.minXp - currentTier.minXp;
      const current = data.xp - currentTier.minXp;
      pct = Math.min(Math.max(current / range, 0), 1);
    }
    progressAnim.value = withSpring(pct, { damping: 15, stiffness: 90 });
  }, [data.xp, currentTier, nextTier]);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const animatedProgress = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.container, animatedFloat]}>
      {/* Ambient Backlight */}
      <Animated.View style={[styles.ambientGlow, animatedGlow]}>
        <LinearGradient
          colors={[currentTier.colors[0], currentTier.colors[1], 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <LiquidGlassCard intensity={isDark ? 30 : 60} style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.tierSub, { color: colors.textSecondary }]}>CURRENT RANK</Text>
            <Text style={[styles.tierTitle, { color: colors.textPrimary }]}>Tier {currentTier.level}: {currentTier.name}</Text>
          </View>
          <View style={[styles.badge, { borderColor: currentTier.colors[0], backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={[styles.xpText, { color: currentTier.colors[1] }]}>{data.xp} XP</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {nextTier ? `${data.xp} / ${nextTier.minXp} XP` : 'Max Tier Reached'}
            </Text>
            {nextTier && (
              <Text style={[styles.progressText, { color: currentTier.colors[0] }]}>
                {nextTier.minXp - data.xp} XP to go
              </Text>
            )}
          </View>

          <View style={[styles.trackBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <Animated.View style={[styles.trackFill, animatedProgress]}>
              <LinearGradient
                colors={currentTier.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>
      </LiquidGlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: -20,
    right: -20,
    borderRadius: 40,
    filter: 'blur(30px)',
  },
  card: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  tierTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
});
