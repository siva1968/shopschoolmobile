import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing } from '@/theme/theme';

export default function AccountScreen() {
  const { logout, user } = useAuth();
  console.log(user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Header */}
        <Header
          title="Account"
          showBack={false}
        />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={styles.welcomeCard} elevation={2}>
            <Text variant="headlineLarge" style={styles.welcomeTitle}>
              My Account
            </Text>
            <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
              Manage your profile and settings
            </Text>
          </Surface>

          <Surface style={styles.infoCard} elevation={1}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Account Options:
            </Text>
            <View style={styles.featureList}>
              <Text variant="bodyMedium" style={styles.featureItem}>
                👤 Profile Information
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                📍 Delivery Addresses
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                💳 Payment Methods
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                🔒 Privacy Settings
              </Text>
            </View>
          </Surface>

          {/* Logout Button */}
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonText}
            contentStyle={styles.logoutButtonContent}
          >
            Log Out
          </Button>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureItem: {
    color: colors.text.primary,
    lineHeight: 24,
  },
  logoutButton: {
    borderColor: colors.error,
    borderWidth: 2,
    marginTop: spacing.lg,
  },
  logoutButtonText: {
    color: colors.error,
    fontWeight: 'bold',
  },
  logoutButtonContent: {
    paddingVertical: spacing.sm,
  },
});
