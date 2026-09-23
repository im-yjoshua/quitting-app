import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'dark' | 'light';
export type AccentPaletteId = 'cobalt' | 'crimson' | 'gold' | 'emerald';

export interface AccentOption {
  id: AccentPaletteId;
  name: string;
  darkHex: string;
  lightHex: string;
  description: string;
}

const THEME_STORAGE_KEY = '@sovereign/theme';
const ACCENT_STORAGE_KEY = '@sovereign/accent_color';
const STEALTH_STORAGE_KEY = '@sovereign/stealth_mode';

export const ACCENT_PALETTES: Record<AccentPaletteId, AccentOption> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Vector',
    darkHex: '#00E676',
    lightHex: '#00C853',
    description: 'Vitality & unbroken resolve',
  },
  gold: {
    id: 'gold',
    name: 'Sovereign Gold',
    darkHex: '#D4AF37',
    lightHex: '#B28900',
    description: 'Prestige & dopamine mastery',
  },
  cobalt: {
    id: 'cobalt',
    name: 'Royal Cobalt',
    darkHex: '#2979FF',
    lightHex: '#2962FF',
    description: 'High-focus sovereign blue',
  },
  crimson: {
    id: 'crimson',
    name: 'Imperial Crimson',
    darkHex: '#E53935',
    lightHex: '#D32F2F',
    description: 'Raw vigilance & surge discipline',
  },
};

export interface ThemeColors {
  canvas: string;
  glass: string;
  glassSubtle: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSubtle: string;
  border: string;
}

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
  colors: ThemeColors;
  accent: AccentPaletteId;
  setAccent: (accent: AccentPaletteId) => Promise<void>;
  stealthMode: boolean;
  toggleStealthMode: () => Promise<void>;
  appTitle: string;
  appSubtitle: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getDarkColors = (accentOption: AccentOption): ThemeColors => ({
  canvas: '#000000',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassSubtle: 'rgba(255, 255, 255, 0.02)',
  textPrimary: '#FFFFFF',
  textSecondary: '#6E7179',
  accent: accentOption.darkHex,
  accentSubtle: `${accentOption.darkHex}26`,
  border: 'rgba(255, 255, 255, 0.08)',
});

const getLightColors = (accentOption: AccentOption): ThemeColors => ({
  canvas: '#F7F7F5',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassSubtle: 'rgba(255, 255, 255, 0.4)',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  accent: accentOption.lightHex,
  accentSubtle: `${accentOption.lightHex}20`,
  border: 'rgba(150, 150, 150, 0.2)',
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [accentId, setAccentId] = useState<AccentPaletteId>('emerald');
  const [stealthMode, setStealthMode] = useState<boolean>(false);

  useEffect(() => {
    const loadStoredSettings = async () => {
      try {
        const [storedTheme, storedAccent, storedStealth] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_STORAGE_KEY),
          AsyncStorage.getItem(STEALTH_STORAGE_KEY),
        ]);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme as AppTheme);
        }
        if (storedAccent && storedAccent in ACCENT_PALETTES) {
          setAccentId(storedAccent as AccentPaletteId);
        }
        if (storedStealth !== null) {
          setStealthMode(storedStealth === 'true');
        }
      } catch (e) {
        console.error('Failed to load theme settings:', e);
      }
    };
    loadStoredSettings();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  const setAccent = async (nextAccent: AccentPaletteId) => {
    setAccentId(nextAccent);
    try {
      await AsyncStorage.setItem(ACCENT_STORAGE_KEY, nextAccent);
    } catch (e) {
      console.error('Failed to save accent:', e);
    }
  };

  const toggleStealthMode = async () => {
    const nextStealth = !stealthMode;
    setStealthMode(nextStealth);
    try {
      await AsyncStorage.setItem(STEALTH_STORAGE_KEY, nextStealth ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save stealth mode:', e);
    }
  };

  const activeAccentOption = ACCENT_PALETTES[accentId] || ACCENT_PALETTES.emerald;
  const colors = useMemo(() => {
    return theme === 'dark' ? getDarkColors(activeAccentOption) : getLightColors(activeAccentOption);
  }, [theme, activeAccentOption]);

  const appTitle = stealthMode ? 'Focus Utility' : 'Sovereign';
  const appSubtitle = stealthMode ? 'DAILY UTILITY' : 'AIR-GAPPED SYSTEM';

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      colors,
      accent: accentId,
      setAccent,
      stealthMode,
      toggleStealthMode,
      appTitle,
      appSubtitle,
    }),
    [theme, colors, accentId, stealthMode, appTitle, appSubtitle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
