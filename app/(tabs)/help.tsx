import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from '@/components';
import { colors, spacing } from '@/theme/theme';

export default function HelpScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Header */}
        <Header
          title="Help"
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
              Help & Support
            </Text>
            <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
              Get assistance and find answers
            </Text>
          </Surface>

          <Surface style={styles.infoCard} elevation={1}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Support Options:
            </Text>
            <View style={styles.featureList}>
              <Text variant="bodyMedium" style={styles.featureItem}>
                ❓ Frequently Asked Questions
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                💬 Live Chat Support
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                📧 Email Support
              </Text>
              <Text variant="bodyMedium" style={styles.featureItem}>
                📞 Phone Support
              </Text>
            </View>
          </Surface>
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
});
