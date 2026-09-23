import { TextStyle, ViewStyle } from 'react-native';

export const Palette = {
  // Monochromatic Deep Void & Graphite Canvas
  canvas: '#000000',
  canvasRaised: '#000000',
  canvasSurface: '#000000',

  // Frosted Glass Surface Fills (rgba)
  glassSurface: 'rgba(255, 255, 255, 0.03)',
  glassSurfaceHover: 'rgba(255, 255, 255, 0.06)',
  glassSurfaceActive: 'rgba(255, 255, 255, 0.09)',
  glassSurfaceSubtle: 'rgba(255, 255, 255, 0.02)',

  // Specular Highlights & Hairline Borders
  specularBorder: 'rgba(255, 255, 255, 0.08)',
  specularBorderSubtle: 'rgba(255, 255, 255, 0.04)',
  specularBorderBright: 'rgba(255, 255, 255, 0.16)',
  
  // Single Accent Policy: Pure Cold Emerald
  accent: '#2EF2B8',
  accentGlow: 'rgba(46, 242, 184, 0.3)',
  
  // Replace legacy signal colors with single accent or monochrome
  signalAlert: '#2EF2B8',
  signalWarning: '#2EF2B8',
  signalSuccess: '#2EF2B8',
  signalCold: '#2EF2B8',
  signalAmberAccent: '#2EF2B8',
  signalAlertGlow: 'rgba(46, 242, 184, 0.3)',
  signalWarningGlow: 'rgba(46, 242, 184, 0.3)',
  signalSuccessGlow: 'rgba(46, 242, 184, 0.3)',
  signalColdGlow: 'rgba(46, 242, 184, 0.3)',
  
  // Tactical Gradients (for specular bevel edges & glows)
  specularGradient: ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.01)'] as const,
  accentGradient: ['rgba(46, 242, 184, 0.22)', 'rgba(46, 242, 184, 0.02)'] as const,
  crimsonGradient: ['rgba(46, 242, 184, 0.22)', 'rgba(46, 242, 184, 0.02)'] as const,
  amberGradient: ['rgba(46, 242, 184, 0.22)', 'rgba(46, 242, 184, 0.02)'] as const,
  cyanGradient: ['rgba(46, 242, 184, 0.22)', 'rgba(46, 242, 184, 0.02)'] as const,

  // Stark Contrast Monochromatic Typography Hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#6E7179',
  textTertiary: '#6E7179',
  textMuted: '#6E7179',

  // Reputation Tiers (Monochromatic)
  tierInitiate: '#6E7179',
  tierSentinel: '#FFFFFF',
  tierSovereign: '#2EF2B8',

  // Monochromatic Specular & Ambient Tokens
  specularHairline: 'rgba(255, 255, 255, 0.08)',
  monochromeGlow: 'rgba(255, 255, 255, 0.04)',
  monochromeGlowSubtle: 'rgba(255, 255, 255, 0.02)',
};

export const GlassBlur = {
  tint: 'dark' as const,
  blurMethod: 'dimezisBlurViewSdk31Plus' as const,
  intensity: {
    subtle: 25,
    standard: 40,
    heavy: 85,
  },
};

export const Typography = {
  // Extreme Contrast Tabular Metrics
  chronometerValue: {
    fontSize: 54,
    fontWeight: '300' as const,
    color: Palette.textPrimary,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums' as const],
    includeFontPadding: false,
  } satisfies TextStyle,

  chronometerUnit: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: Palette.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,

  // Small Kickers (0.8em - 0.9em)
  kicker: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    color: Palette.textSecondary,
  } satisfies TextStyle,

  kickerAlert: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    color: Palette.accent,
  } satisfies TextStyle,

  // Telemetry Metrics
  telemetryValue: {
    fontSize: 22,
    fontWeight: '400' as const,
    color: Palette.textPrimary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  } satisfies TextStyle,

  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textSecondary,
    fontWeight: '400' as const,
  } satisfies TextStyle,
};

export const Layout = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 14,
    card: 22,
    pill: 999,
  },
};

export const Shadows = {
  accentGlow: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,
  
  amberGlow: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,

  crimsonGlow: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,

  cyanGlow: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,

  emeraldGlow: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } satisfies ViewStyle,

  subtleSpecular: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  } satisfies ViewStyle,
};