import React from 'react';
import { View, Text, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../context/ThemeContext';

interface UtilityCardProps extends ViewProps {
  title: string;
  headerAction?: React.ReactNode;
}

export function UtilityCard({ title, children, headerAction, style, ...rest }: UtilityCardProps) {
  const { colors, theme } = useAppTheme();

  return (
    <View 
      style={[
        styles.container, 
        { 
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : colors.border,
        }, 
        style
      ]} 
      {...rest}
    >
      <BlurView 
        intensity={35} 
        tint={theme === 'dark' ? 'dark' : 'light'} 
        style={styles.blurContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
          {headerAction}
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as any } : {}),
  },
  blurContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  content: {
    width: '100%',
  },
});
