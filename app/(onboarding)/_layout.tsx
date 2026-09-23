import React from 'react';
import { Stack } from 'expo-router';
import { Palette } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      initialRouteName="splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.canvas },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="splash" options={{ animation: 'fade' }} />
      <Stack.Screen name="step1" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}