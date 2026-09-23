import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useAppData } from '../../context/AppDataContext';
import { useAppTheme } from '../../context/ThemeContext';
import { breakDownDuration, calculateConcentricDialMetrics } from '../../services/chronometerEngine';

interface SleekChronometerProps {
  customDurationMs?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Proportional, focused footprint
const DIAL_SIZE = 260;
const CENTER = DIAL_SIZE / 2; // 130
const STROKE_WIDTH = 20;
const RING_GAP = 4;

// Tight, calculated concentric radii:
// Outer (Daily 24h): radius 108 -> spans [98, 118], fits with 12px margin in 260px box
const R_OUTER = 108;
// Middle (Weekly 7d): radius 84 -> spans [74, 94], 4px gap with outer ring
const R_MID = R_OUTER - STROKE_WIDTH - RING_GAP; // 84
// Inner (90-Day Reset): radius 60 -> spans [50, 70], 4px gap with mid ring
const R_INNER = R_MID - STROKE_WIDTH - RING_GAP; // 60

// Circumferences for strokeDasharray
const C_OUTER = 2 * Math.PI * R_OUTER;
const C_MID = 2 * Math.PI * R_MID;
const C_INNER = 2 * Math.PI * R_INNER;

export const SleekChronometer: React.FC<SleekChronometerProps> = ({ customDurationMs }) => {
  const { cleanDurationMs, concentricDialMetrics } = useAppData();
  const { colors, theme } = useAppTheme();
  const activeDuration = customDurationMs ?? cleanDurationMs;

  const activeDials = customDurationMs !== undefined
    ? calculateConcentricDialMetrics(customDurationMs)
    : concentricDialMetrics;

  // Daily (24h), Weekly (7d), and 90-Day timelines
  const p24h = Math.min(1, Math.max(0, activeDials.cycle24h.progress));
  const p7d = Math.min(1, Math.max(0, activeDials.cycle7d.progress));
  const p90d = Math.min(1, Math.max(0, activeDials.cycle90d.progress));

  const animP24h = useSharedValue(0);
  const animP7d = useSharedValue(0);
  const animP90d = useSharedValue(0);

  useEffect(() => {
    const config = { duration: 1100, easing: Easing.out(Easing.cubic) };
    animP24h.value = withTiming(p24h, config);
    animP7d.value = withTiming(p7d, config);
    animP90d.value = withTiming(p90d, config);
  }, [p24h, p7d, p90d]);

  const animatedProps24h = useAnimatedProps(() => ({
    strokeDashoffset: C_OUTER * (1 - animP24h.value),
    opacity: animP24h.value > 0.002 ? 1 : 0,
  }));

  const animatedProps7d = useAnimatedProps(() => ({
    strokeDashoffset: C_MID * (1 - animP7d.value),
    opacity: animP7d.value > 0.002 ? 1 : 0,
  }));

  const animatedProps90d = useAnimatedProps(() => ({
    strokeDashoffset: C_INNER * (1 - animP90d.value),
    opacity: animP90d.value > 0.002 ? 1 : 0,
  }));

  const {
    formattedDays,
    formattedHours,
    formattedMinutes,
    formattedSeconds,
  } = breakDownDuration(activeDuration);

  // Dynamic Ring Palettes (Apple Fitness style, bound directly to active accent palette)
  const isDark = theme === 'dark';
  const ringColors = {
    daily: {
      start: colors.accent,
      end: colors.accent,
      track: isDark ? `${colors.accent}26` : `${colors.accent}20`,
      accent: colors.accent,
    },
    weekly: {
      start: isDark ? '#00E5FF' : '#0EA5E9', // Cold Cyan
      end: isDark ? '#007AFF' : '#0284C7',   // Apple Electric Blue
      track: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(14, 165, 233, 0.15)',
      accent: isDark ? '#00E5FF' : '#0EA5E9',
    },
    ninetyDay: {
      start: isDark ? '#FFD700' : '#F59E0B', // Amber Gold
      end: isDark ? '#FF9500' : '#D97706',   // Apple Warm Orange
      track: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      accent: isDark ? '#FFD700' : '#F59E0B',
    },
  };

  const handleDialTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleDialTap}
        style={styles.dialWrapper}
        accessibilityLabel="Activity Progress Rings"
      >
        <View style={styles.svgContainer}>
          <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
            <Defs>
              {/* 1. Daily Emerald Gradient */}
              <SvgGradient id="gradDaily" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={ringColors.daily.start} />
                <Stop offset="100%" stopColor={ringColors.daily.end} />
              </SvgGradient>

              {/* 2. Weekly Cyan Gradient */}
              <SvgGradient id="gradWeekly" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={ringColors.weekly.start} />
                <Stop offset="100%" stopColor={ringColors.weekly.end} />
              </SvgGradient>

              {/* 3. 90-Day Milestone Gold Gradient */}
              <SvgGradient id="grad90d" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={ringColors.ninetyDay.start} />
                <Stop offset="100%" stopColor={ringColors.ninetyDay.end} />
              </SvgGradient>
            </Defs>

            {/* 1. Daily Ring (Outer) - 24 Hours */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_OUTER}
              stroke={ringColors.daily.track}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={R_OUTER}
              stroke="url(#gradDaily)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${C_OUTER} ${C_OUTER}`}
              animatedProps={animatedProps24h}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />

            {/* 2. Weekly Ring (Middle) - 7 Days */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_MID}
              stroke={ringColors.weekly.track}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={R_MID}
              stroke="url(#gradWeekly)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${C_MID} ${C_MID}`}
              animatedProps={animatedProps7d}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />

            {/* 3. 90-Day Ring (Inner) - Full Reset */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={R_INNER}
              stroke={ringColors.ninetyDay.track}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={R_INNER}
              stroke="url(#grad90d)"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${C_INNER} ${C_INNER}`}
              animatedProps={animatedProps90d}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </Svg>
        </View>

        {/* Center Readout: Bold Tabular Numbers (Zero Jitter) */}
        <View style={styles.centerReadout} pointerEvents="none">
          <Text style={[styles.heroKicker, { color: colors.textSecondary }]}>
            DAYS CLEAN
          </Text>
          <Text style={[styles.heroDays, { color: colors.textPrimary }]}>
            {formattedDays}
          </Text>
          <View style={[styles.timeCapsule, { backgroundColor: colors.glassSubtle, borderColor: colors.border }]}>
            <Text style={[styles.tabularTime, { color: colors.textPrimary }]}>
              {formattedHours}:{formattedMinutes}:{formattedSeconds}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 3-Ring Summary Badge: Daily, Weekly, 90-Day */}
      <View style={[styles.legendRow, { backgroundColor: colors.glassSubtle, borderColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ringColors.daily.accent }]} />
          <View>
            <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>DAILY</Text>
            <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{Math.round(p24h * 100)}%</Text>
          </View>
        </View>

        <View style={[styles.legendDivider, { backgroundColor: colors.border }]} />

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ringColors.weekly.accent }]} />
          <View>
            <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>WEEKLY</Text>
            <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{Math.round(p7d * 100)}%</Text>
          </View>
        </View>

        <View style={[styles.legendDivider, { backgroundColor: colors.border }]} />

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ringColors.ninetyDay.accent }]} />
          <View>
            <Text style={[styles.legendTitle, { color: colors.textSecondary }]}>90-DAY</Text>
            <Text style={[styles.legendValue, { color: colors.textPrimary }]}>{Math.round(p90d * 100)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  dialWrapper: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  centerReadout: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroDays: {
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 52,
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  timeCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 0.5,
    marginTop: 4,
  },
  tabularTime: {
    fontSize: 11.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 0.5,
    width: 280,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendTitle: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  legendDivider: {
    width: 0.5,
    height: 16,
  },
});