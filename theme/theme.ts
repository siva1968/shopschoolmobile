import type { MD3Theme } from 'react-native-paper';
import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Custom font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

// Create the theme
const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#36bbeb', // Blue from login page
    primaryContainer: '#e6f7fd',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#001f2a',
    secondary: '#dc004e',
    secondaryContainer: '#ffd9e2',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#3e0019',
    tertiary: '#2a9dc9', // Darker blue variant
    tertiaryContainer: '#d4f0ff',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#001829',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',
    background: '#f8fafc', // Background from login page
    onBackground: '#1a1c1e',
    surface: '#ffffff',
    onSurface: '#1a1c1e',
    surfaceVariant: '#dde3ea',
    onSurfaceVariant: '#41484d',
    outline: '#71787e',
    outlineVariant: '#c1c7ce',
    scrim: '#000000',
    inverseSurface: '#2f3033',
    inverseOnSurface: '#f1f0f4',
    inversePrimary: '#5ccbf0',
    elevation: {
      level0: 'transparent',
      level1: '#f6f9fc',
      level2: '#f1f5fa',
      level3: '#ecf1f7',
      level4: '#eaeff6',
      level5: '#e6ecf4',
    },
    surfaceDisabled: 'rgba(26, 28, 30, 0.12)',
    onSurfaceDisabled: 'rgba(26, 28, 30, 0.38)',
    backdrop: 'rgba(59, 65, 70, 0.4)',
  },
  fonts: configureFonts({ config: fontConfig }),
};

// Additional style constants for React Native styling
export const colors = {
  primary: '#36bbeb',
  primaryLight: '#5ccbf0',
  primaryDark: '#2a9dc9',
  secondary: '#dc004e',
  secondaryLight: '#ff5983',
  secondaryDark: '#9a0036',
  background: '#f8fafc',
  surface: '#ffffff',
  text: {
    primary: '#1a1c1e',
    secondary: '#41484d',
    disabled: 'rgba(26, 28, 30, 0.38)',
  },
  error: '#ba1a1a',
  warning: '#ff9800',
  success: '#4caf50',
  info: '#2196f3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
};

export const typography = {
  h1: {
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
  },
  h2: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  h3: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  h4: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h5: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    textTransform: 'none' as const,
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default theme;
