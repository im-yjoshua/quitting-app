import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { TimeRange } from '@/services/analyticsService';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

interface TimeRangeFilterProps {
  activeRange: TimeRange;
  onSelect: (range: TimeRange) => void;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: 'All', value: 'ALL' },
];

export function TimeRangeFilter({ activeRange, onSelect }: TimeRangeFilterProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';

  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
  const [tabXs, setTabXs] = useState<{ [key: string]: number }>({});

  const handleLayout = (val: TimeRange, e: LayoutChangeEvent) => {
    const { width, x } = e.nativeEvent.layout;
    setTabWidths(prev => ({ ...prev, [val]: width }));
    setTabXs(prev => ({ ...prev, [val]: x }));
  };

  const handlePress = (val: TimeRange) => {
    if (val !== activeRange) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(val);
    }
  };

  const activeWidth = tabWidths[activeRange] || 0;
  const activeX = tabXs[activeRange] || 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(activeWidth, { damping: 20, stiffness: 200 }),
    transform: [{ translateX: withSpring(activeX, { damping: 20, stiffness: 200 }) }],
  }));

  return (
    <LiquidGlassCard intensity={isDark ? 20 : 60} style={styles.container}>
      <View style={styles.tabBar}>
        <Animated.View style={[styles.indicator, { backgroundColor: colors.textPrimary }, indicatorStyle]} />
        
        {RANGES.map(range => {
          const isActive = activeRange === range.value;
          return (
            <TouchableOpacity
              key={range.value}
              onLayout={(e) => handleLayout(range.value, e)}
              onPress={() => handlePress(range.value)}
              style={styles.tab}
            >
              <Text style={[
                styles.tabText, 
                { color: isActive ? colors.canvas : colors.textSecondary, fontWeight: isActive ? '700' : '600' }
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 6,
    borderRadius: 24,
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    borderRadius: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
