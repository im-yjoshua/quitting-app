import React from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { LineChart as ChartIcon } from 'lucide-react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TimeRangeFilter } from '@/components/analytics/TimeRangeFilter';
import { MetricCardsGrid } from '@/components/analytics/MetricCardsGrid';
import { TrendlineChart } from '@/components/analytics/TrendlineChart';
import { RiskMapCard } from '@/components/analytics/RiskMapCard';

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const { range, setRange, data, isLoading } = useAnalytics();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <TimeRangeFilter activeRange={range} onSelect={setRange} />
        
        {isLoading || !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : data.totalDaysLogged <= 1 && data.cleanDays <= 1 && data.timeOfDayRisk.morning === 0 && data.timeOfDayRisk.afternoon === 0 && data.timeOfDayRisk.evening === 0 && data.timeOfDayRisk.lateNight === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
            <ChartIcon size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>Gathering telemetry. Establish your baseline to generate insights.</Text>
          </View>
        ) : (
          <>
            <MetricCardsGrid data={data} />
            <TrendlineChart data={data} />
            <RiskMapCard data={data} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
