import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Surface, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from '@/components';
import { colors, spacing } from '@/theme/theme';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();

  // This is a placeholder - you would fetch actual product data based on the ID
  const isKit = Math.random() > 0.5; // Randomly determine if it's a kit for demo

  const handleBackPress = () => {
    router.back();
  };

  const renderKitDetails = () => (
    <>
      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Kit Contents
        </Text>
        <View style={styles.kitItemsList}>
          <View style={styles.kitItem}>
            <Text variant="bodyMedium" style={styles.kitItemName}>
              📚 Mathematics Textbook
            </Text>
            <Text variant="bodySmall" style={styles.kitItemQty}>
              Qty: 1
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.kitItem}>
            <Text variant="bodyMedium" style={styles.kitItemName}>
              📝 Exercise Notebook (Set of 5)
            </Text>
            <Text variant="bodySmall" style={styles.kitItemQty}>
              Qty: 5
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.kitItem}>
            <Text variant="bodyMedium" style={styles.kitItemName}>
              ✏️ Writing Pens (Blue, Black)
            </Text>
            <Text variant="bodySmall" style={styles.kitItemQty}>
              Qty: 2
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Kit Information
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          This comprehensive study kit includes all essential materials needed for the academic year.
          All items are carefully selected to meet school standards and requirements.
        </Text>
      </Surface>
    </>
  );

  const renderUniformDetails = () => (
    <>
      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Size Options
        </Text>
        <View style={styles.sizeOptions}>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <Button
              key={size}
              mode="outlined"
              compact
              style={styles.sizeButton}
              onPress={() => { }}
            >
              {size}
            </Button>
          ))}
        </View>
      </Surface>

      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Color Options
        </Text>
        <View style={styles.colorOptions}>
          <View style={[styles.colorSwatch, { backgroundColor: '#1976D2' }]} />
          <View style={[styles.colorSwatch, { backgroundColor: '#388E3C' }]} />
          <View style={[styles.colorSwatch, { backgroundColor: '#F57C00' }]} />
        </View>
      </Surface>

      <Surface style={styles.infoCard} elevation={1}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Product Details
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          High-quality school uniform made from breathable cotton blend fabric.
          Machine washable and designed for daily wear. Meets all school dress code requirements.
        </Text>
      </Surface>
    </>
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Header */}
        <Header title="Product Details" />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <Surface style={styles.imageCard} elevation={2}>
            <View style={styles.imageContainer}>
              <View style={styles.placeholderImage}>
                <Text variant="headlineLarge" style={styles.placeholderText}>
                  {isKit ? '📚' : '👔'}
                </Text>
              </View>
            </View>
          </Surface>

          {/* Product Info */}
          <Surface style={styles.productInfoCard} elevation={1}>
            <Text variant="headlineMedium" style={styles.productTitle}>
              {isKit ? 'Class 10 Study Kit' : 'School Uniform Shirt'}
            </Text>
            <Text variant="bodyLarge" style={styles.productSubtitle}>
              {isKit ? 'Complete academic materials package' : 'Navy blue cotton shirt'}
            </Text>

            <View style={styles.priceStockContainer}>
              <Text variant="headlineSmall" style={styles.price}>
                ₹{isKit ? '2,499' : '899'}
              </Text>
              <Chip
                mode="flat"
                style={styles.stockChip}
                textStyle={styles.stockText}
              >
                In Stock
              </Chip>
            </View>
          </Surface>

          {/* Conditional Details */}
          {isKit ? renderKitDetails() : renderUniformDetails()}

          {/* Add to Cart Section */}
          <Surface style={styles.actionCard} elevation={1}>
            <Button
              mode="contained"
              style={styles.addToCartButton}
              labelStyle={styles.buttonLabel}
              onPress={() => { }}
            >
              Add to Cart
            </Button>
            <Button
              mode="outlined"
              style={styles.buyNowButton}
              labelStyle={styles.buttonLabel}
              onPress={() => { }}
            >
              Buy Now
            </Button>
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
  // Product Image
  imageCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 300,
    backgroundColor: colors.text.disabled + '10',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 80,
    opacity: 0.5,
  },
  // Product Info
  productInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  productTitle: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  productSubtitle: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  priceStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  stockChip: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
  },
  stockText: {
    color: '#2E7D2E',
    fontSize: 12,
    fontWeight: '500',
  },
  // Info Cards
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.text.primary,
    lineHeight: 22,
  },
  // Kit Items
  kitItemsList: {
    gap: spacing.sm,
  },
  kitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  kitItemName: {
    flex: 1,
    color: colors.text.primary,
  },
  kitItemQty: {
    color: colors.text.secondary,
  },
  divider: {
    backgroundColor: colors.text.disabled + '30',
  },
  // Size Options
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sizeButton: {
    minWidth: 50,
    borderColor: colors.primary,
  },
  // Color Options
  colorOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.text.disabled,
  },
  // Actions
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
  },
  buyNowButton: {
    borderColor: colors.primary,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
