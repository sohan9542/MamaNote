/**
 * MamaNote color palette.
 * Soft, calming, premium pastel tones used across light & dark themes.
 * Mirrors the Tailwind config so JS code (e.g. status bars, charts, gradients)
 * can reference the same tokens.
 */
export const palette = {
  pink: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
  },
  mint: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
  },
  lavender: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
  },
  beige: {
    50: '#FDFCF8',
    100: '#FAF6EE',
    200: '#F5EBD7',
    300: '#EBD9B4',
    400: '#D9BC8A',
    500: '#C19A5B',
  },
  ink: {
    50: '#F8F7FB',
    100: '#EEEBF4',
    200: '#D8D2E3',
    300: '#A89FBE',
    400: '#6E6485',
    500: '#4A4360',
    600: '#322C44',
    700: '#221E30',
    800: '#1A1625',
    900: '#100D18',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightTheme: ThemeColors = {
  background: palette.white,
  surface: palette.white,
  surfaceElevated: palette.beige[50],
  border: palette.ink[100],
  text: palette.ink[800],
  textMuted: palette.ink[400],
  primary: palette.pink[400],
  primarySoft: palette.pink[100],
  accent: palette.lavender[400],
  accentSoft: palette.lavender[100],
  success: palette.mint[400],
  warning: palette.beige[400],
  danger: palette.pink[500],
  tabBar: palette.white,
  tabBarActive: palette.pink[400],
  tabBarInactive: palette.ink[300],
};

export const darkTheme: ThemeColors = {
  background: palette.ink[800],
  surface: palette.ink[700],
  surfaceElevated: palette.ink[600],
  border: palette.ink[600],
  text: palette.ink[50],
  textMuted: palette.ink[300],
  primary: palette.pink[300],
  primarySoft: palette.ink[600],
  accent: palette.lavender[300],
  accentSoft: palette.ink[600],
  success: palette.mint[300],
  warning: palette.beige[300],
  danger: palette.pink[400],
  tabBar: palette.ink[800],
  tabBarActive: palette.pink[300],
  tabBarInactive: palette.ink[400],
};

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? darkTheme : lightTheme;
