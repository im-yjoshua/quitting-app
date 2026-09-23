import React from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { AnalyticsData } from '@/services/analyticsService';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';

interface TrendlineChartProps {
  data: AnalyticsData | null;
}

export function TrendlineChart({ data }: TrendlineChartProps) {
  const { colors, theme } = useAppTheme();
  const isDark = theme === 'dark';
  const [width, setWidth] = React.useState(0);
  const height = 180;

  if (!data || data.trendlineData.length === 0) return null;

  const chartData = data.trendlineData;
  const max = Math.max(...chartData, 100);
  const min = Math.min(...chartData, 0);

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = chartData.map((val, i) => {
    const x = padding + (i / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / Math.max(max - min, 1)) * chartHeight;
    return { x, y };
  });

  // Create a smooth path using bezier curves
  let pathStr = '';
  if (points.length > 0) {
    pathStr = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      pathStr += ` C ${xMid},${points[i].y} ${xMid},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`;
    }
  }

  // Create fill path
  const fillPathStr = points.length > 0
    ? `${pathStr} L ${points[points.length - 1].x},${padding + chartHeight} L ${points[0].x},${padding + chartHeight} Z`
    : '';

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  return (
    <LiquidGlassCard intensity={isDark ? 20 : 50} style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>DISCIPLINE TREND</Text>
      </View>
      <View style={[styles.chartContainer, { height }]} onLayout={handleLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
                <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Min / Max lines */}
            <Line 
              x1={padding} y1={padding} 
              x2={width - padding} y2={padding} 
              stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" 
            />
            <Line 
              x1={padding} y1={padding + chartHeight} 
              x2={width - padding} y2={padding + chartHeight} 
              stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" 
            />

            {/* Gradient Fill */}
            {fillPathStr !== '' && (
              <Path d={fillPathStr} fill="url(#grad)" />
            )}
            
            {/* Smooth Line */}
            {pathStr !== '' && (
              <Path d={pathStr} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </Svg>
        )}
      </View>
    </LiquidGlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    paddingVertical: 20,
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  chartContainer: {
    width: '100%',
  },
});
