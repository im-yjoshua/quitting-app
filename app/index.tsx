import React from 'react';
import { Redirect } from 'expo-router';
import { useAppData } from '../context/AppDataContext';

export default function RootIndex() {
  const { state, isLoading } = useAppData();

  if (isLoading) {
    return null;
  }

  if (state.profile.isOnboarded) {
    return <Redirect href="/(drawer)" />;
  }

  return <Redirect href="/(onboarding)/splash" />;
}
