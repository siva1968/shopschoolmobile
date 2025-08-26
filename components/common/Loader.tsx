import { colors, shadows, spacing, typography } from '@/theme/theme';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal, Surface, Text } from 'react-native-paper';

interface LoaderProps {
  variant?: 'page' | 'overlay' | 'inline' | 'button';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  visible?: boolean;
  color?: string;
}

export default function Loader({
  variant = 'inline',
  size = 'medium',
  message,
  visible = true,
  color = colors.primary,
}: LoaderProps) {
  const getSize = (): 'small' | 'large' => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      case 'medium':
      default:
        return 'small'; // React Native Paper doesn't have medium, using small as default
    }
  };

  const renderLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator 
        size={getSize()} 
        color={color}
        style={styles.spinner}
      />
      {message && (
        <Text style={styles.message} variant="bodyMedium">
          {message}
        </Text>
      )}
    </View>
  );

  if (variant === 'overlay') {
    return (
      <Portal>
        <Modal
          visible={visible}
          transparent
          statusBarTranslucent
        >
          <View style={styles.overlay}>
            <Surface style={styles.overlayContent} elevation={4}>
              {renderLoader()}
            </Surface>
          </View>
        </Modal>
      </Portal>
    );
  }

  if (variant === 'page') {
    return (
      <View style={styles.pageContainer}>
        {renderLoader()}
      </View>
    );
  }

  if (variant === 'button') {
    return (
      <ActivityIndicator 
        size="small" 
        color={color}
        style={styles.buttonLoader}
      />
    );
  }

  // inline variant
  if (!visible) return null;
  
  return renderLoader();
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  spinner: {
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: colors.text.secondary,
    ...typography.body2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    minWidth: 160,
    alignItems: 'center',
    ...shadows.large,
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  buttonLoader: {
    marginHorizontal: spacing.sm,
  },
});
