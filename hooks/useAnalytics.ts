import { useState, useEffect } from 'react';
import { fetchAnalytics, AnalyticsData, TimeRange } from '@/services/analyticsService';
import { useAppData } from '@/context/AppDataContext';

export function useAnalytics() {
  const [range, setRange] = useState<TimeRange>('30D');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useAppData();

  useEffect(() => {
    loadData(range);
  }, [range, state.relapseHistory, state.profile.auraScore]);

  const loadData = async (selectedRange: TimeRange) => {
    setIsLoading(true);
    const result = await fetchAnalytics(selectedRange, state);
    setData(result);
    setIsLoading(false);
  };

  return {
    range,
    setRange,
    data,
    isLoading,
    refresh: () => loadData(range),
  };
}
