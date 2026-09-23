import React from 'react';
import { Text, VStack, HStack, Spacer, ProgressView } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding, frame } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface SovereignStreakWidgetProps {
  daysClean: number;
  formattedTime: string;
  habitTitle: string;
  accentColor: string;
  progress24h: number;
  progress7d: number;
  progress90d: number;
  stealthMode: boolean;
}

const SovereignStreakWidget = (
  props: SovereignStreakWidgetProps,
  environment: WidgetEnvironment
) => {
  'widget';

  const defaultProps: SovereignStreakWidgetProps = {
    daysClean: 1,
    formattedTime: '00:00:00',
    habitTitle: 'Habit Elimination',
    accentColor: '#0A84FF',
    progress24h: 0.25,
    progress7d: 0.1,
    progress90d: 0.05,
    stealthMode: false,
  };

  const days = props.daysClean ?? defaultProps.daysClean;
  const timeStr = props.formattedTime ?? defaultProps.formattedTime;
  const habit = props.habitTitle ?? defaultProps.habitTitle;
  const accent = props.accentColor ?? defaultProps.accentColor;
  const p24 = Math.min(1, Math.max(0, props.progress24h ?? defaultProps.progress24h));
  const p7 = Math.min(1, Math.max(0, props.progress7d ?? defaultProps.progress7d));
  const p90 = Math.min(1, Math.max(0, props.progress90d ?? defaultProps.progress90d));
  const isStealth = props.stealthMode ?? defaultProps.stealthMode;

  const headerTitle = isStealth ? 'FOCUS' : 'SOVEREIGN';
  const subtitle = isStealth ? 'DAILY TARGET' : habit.toUpperCase();

  // Duo-tone Aesthetic: Graphite Void with Stark White (#FFFFFF) & Dynamic Spectral Accent
  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack modifiers={[padding({ all: 16 })]}>
        {/* Left Hero: Days Clean Metric */}
        <VStack modifiers={[frame({ alignment: 'leading' })]}>
          <Text
            modifiers={[
              font({ size: 9.5, weight: 'bold' }),
              foregroundStyle(accent),
            ]}
          >
            {headerTitle}
          </Text>

          <Text
            modifiers={[
              font({ size: 44, weight: 'black' }),
              foregroundStyle('#FFFFFF'),
            ]}
          >
            {days}
          </Text>

          <Text
            modifiers={[
              font({ size: 10, weight: 'bold' }),
              foregroundStyle('rgba(255, 255, 255, 0.6)'),
            ]}
          >
            DAYS CLEAN
          </Text>

          <Spacer />

          <Text
            modifiers={[
              font({ size: 9, weight: 'semibold' }),
              foregroundStyle('rgba(255, 255, 255, 0.4)'),
            ]}
          >
            {subtitle}
          </Text>
        </VStack>

        <Spacer />

        {/* Right Telemetry: Concentric Multi-Dial Metrics */}
        <VStack modifiers={[frame({ width: 140, alignment: 'trailing' })]}>
          {/* 24-Hour Cycle */}
          <VStack modifiers={[frame({ alignment: 'trailing' })]}>
            <HStack>
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle('rgba(255, 255, 255, 0.7)')]}>
                24H CYCLE
              </Text>
              <Spacer />
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle(accent)]}>
                {Math.round(p24 * 100)}%
              </Text>
            </HStack>
            <ProgressView value={p24} modifiers={[foregroundStyle(accent)]} />
          </VStack>

          <Spacer />

          {/* 7-Day Surge */}
          <VStack modifiers={[frame({ alignment: 'trailing' })]}>
            <HStack>
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle('rgba(255, 255, 255, 0.7)')]}>
                7D SURGE
              </Text>
              <Spacer />
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle('#00E5FF')]}>
                {Math.round(p7 * 100)}%
              </Text>
            </HStack>
            <ProgressView value={p7} modifiers={[foregroundStyle('#00E5FF')]} />
          </VStack>

          <Spacer />

          {/* 90-Day Reset */}
          <VStack modifiers={[frame({ alignment: 'trailing' })]}>
            <HStack>
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle('rgba(255, 255, 255, 0.7)')]}>
                90D RECOVERY
              </Text>
              <Spacer />
              <Text modifiers={[font({ size: 9, weight: 'bold' }), foregroundStyle('#FFD700')]}>
                {Math.round(p90 * 100)}%
              </Text>
            </HStack>
            <ProgressView value={p90} modifiers={[foregroundStyle('#FFD700')]} />
          </VStack>
        </VStack>
      </HStack>
    );
  }

  // systemSmall (Compact Concentric Card)
  return (
    <VStack modifiers={[padding({ all: 14 }), frame({ alignment: 'leading' })]}>
      <HStack>
        <Text
          modifiers={[
            font({ size: 8.5, weight: 'bold' }),
            foregroundStyle(accent),
          ]}
        >
          {headerTitle}
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 8, weight: 'bold' }),
            foregroundStyle('rgba(255, 255, 255, 0.5)'),
          ]}
        >
          {timeStr}
        </Text>
      </HStack>

      <Spacer />

      <Text
        modifiers={[
          font({ size: 40, weight: 'black' }),
          foregroundStyle('#FFFFFF'),
        ]}
      >
        {days}
      </Text>

      <Text
        modifiers={[
          font({ size: 9.5, weight: 'bold' }),
          foregroundStyle('rgba(255, 255, 255, 0.6)'),
        ]}
      >
        DAYS CLEAN
      </Text>

      <Spacer />

      <ProgressView value={p24} modifiers={[foregroundStyle(accent)]} />

      <Text
        modifiers={[
          font({ size: 8, weight: 'semibold' }),
          foregroundStyle('rgba(255, 255, 255, 0.4)'),
        ]}
      >
        {subtitle}
      </Text>
    </VStack>
  );
};

export default createWidget('SovereignStreakWidget', SovereignStreakWidget);
