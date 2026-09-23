import React from 'react';
import { Redirect } from 'expo-router';

export default function OnboardingIndexRedirect() {
  return <Redirect href="/(onboarding)/splash" />;
}
