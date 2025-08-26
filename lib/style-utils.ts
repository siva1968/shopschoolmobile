import { borderRadius, colors, shadows, spacing, typography } from '@/theme/theme';
import { StyleSheet } from 'react-native';

/**
 * Utility functions to help convert web styles to React Native styles
 */

export const createStyles = StyleSheet.create;

// Common style mixins
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  paddedContainer: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
  marginBottom: {
    marginBottom: spacing.md,
  },
  marginTop: {
    marginTop: spacing.md,
  },
});

// Typography styles for Text components
export const textStyles = StyleSheet.create({
  h1: {
    ...typography.h1,
    color: colors.text.primary,
  },
  h2: {
    ...typography.h2,
    color: colors.text.primary,
  },
  h3: {
    ...typography.h3,
    color: colors.text.primary,
  },
  h4: {
    ...typography.h4,
    color: colors.text.primary,
  },
  h5: {
    ...typography.h5,
    color: colors.text.primary,
  },
  h6: {
    ...typography.h6,
    color: colors.text.primary,
  },
  body1: {
    ...typography.body1,
    color: colors.text.primary,
  },
  body2: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  subtitle1: {
    ...typography.subtitle1,
    color: colors.text.primary,
  },
  subtitle2: {
    ...typography.subtitle2,
    color: colors.text.secondary,
  },
  caption: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

// Button style variants
export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outlined: {
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  text: {
    backgroundColor: 'transparent',
  },
});

// Input/Form styles
export const formStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.text.disabled,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  label: {
    ...typography.subtitle2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

// Helper functions
export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getStatusColor = (status: 'success' | 'error' | 'warning' | 'info'): string => {
  switch (status) {
    case 'success': return colors.success;
    case 'error': return colors.error;
    case 'warning': return colors.warning;
    case 'info': return colors.info;
    default: return colors.primary;
  }
};

// Responsive utilities for React Native
export const isTablet = (width: number): boolean => width >= 768;
export const isMobile = (width: number): boolean => width < 768;

// Spacing utilities
export const getResponsiveSpacing = (width: number) => ({
  horizontal: isTablet(width) ? spacing.xl : spacing.md,
  vertical: isTablet(width) ? spacing.lg : spacing.md,
});

export default {
  createStyles,
  commonStyles,
  textStyles,
  buttonStyles,
  formStyles,
  hexToRgba,
  getStatusColor,
  isTablet,
  isMobile,
  getResponsiveSpacing,
};
