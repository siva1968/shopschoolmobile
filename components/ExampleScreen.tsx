import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { colors, shadows, spacing, typography } from '@/theme/theme';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

export default function ExampleScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const snackbar = useSnackbar();

  const handleLogin = async () => {
    try {
      await auth.login({
        student_enrollment_code: 'test123',
        password: 'test123',
        portal_id: 'test-portal'
      });
      snackbar.success('Login successful!');
    } catch (error) {
      snackbar.error('Login failed!');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.md,
    },
    card: {
      marginBottom: spacing.md,
      ...shadows.medium,
    },
    cardContent: {
      padding: spacing.md,
    },
    title: {
      ...typography.h4,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.subtitle1,
      color: colors.text.secondary,
      marginBottom: spacing.md,
    },
    button: {
      marginTop: spacing.sm,
    },
    section: {
      marginBottom: spacing.lg,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>ShopSchool Native App</Text>
        <Text style={styles.subtitle}>
          This is an example of how to use the converted theme and contexts.
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
            Theme Colors
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: spacing.sm }}>
            Primary: {colors.primary}
          </Text>
          <Text variant="bodyMedium">
            Secondary: {colors.secondary}
          </Text>
          <Text variant="bodyMedium">
            Background: {colors.background}
          </Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text variant="titleLarge">Authentication</Text>
          <Text variant="bodyMedium" style={{ marginTop: spacing.sm }}>
            Status: {auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}
          </Text>
          {auth.user && (
            <Text variant="bodyMedium">
              User: {auth.user.email || 'Unknown'}
            </Text>
          )}
          
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.button}
            loading={auth.isLoading}
          >
            Test Login
          </Button>

          <Button 
            mode="outlined" 
            onPress={auth.logout}
            style={styles.button}
          >
            Logout
          </Button>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Text variant="titleLarge">Snackbar Examples</Text>
          
          <Button 
            mode="contained" 
            onPress={() => snackbar.success('Success message!')}
            style={styles.button}
            buttonColor={colors.success}
          >
            Show Success
          </Button>

          <Button 
            mode="contained" 
            onPress={() => snackbar.error('Error message!')}
            style={styles.button}
            buttonColor={colors.error}
          >
            Show Error
          </Button>

          <Button 
            mode="contained" 
            onPress={() => snackbar.warning('Warning message!')}
            style={styles.button}
            buttonColor={colors.warning}
          >
            Show Warning
          </Button>

          <Button 
            mode="contained" 
            onPress={() => snackbar.info('Info message!')}
            style={styles.button}
            buttonColor={colors.info}
          >
            Show Info
          </Button>
        </View>
      </Card>
    </ScrollView>
  );
}
