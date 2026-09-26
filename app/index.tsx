import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAppData } from '../context/AppDataContext';

export default function RootIndex() {
  const { state, isLoading } = useAppData();
  const { modal } = useLocalSearchParams<{ modal?: string }>();

  if (isLoading) {
    return null;
  }

  if (state.profile.isOnboarded) {
    if (typeof modal === 'string' && modal.length > 0) {
      return <Redirect href={{ pathname: '/(drawer)', params: { modal } }} />;
    }
    return <Redirect href="/(drawer)" />;
  }

  return <Redirect href="/(onboarding)/splash" />;
}