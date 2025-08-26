import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Surface, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Header } from '@/components';
import SelectField from '@/components/form/SelectField';
import { extractAvailableQuantity, getStockStatusMessage, useGetData } from '@/lib';
import { Endpoint } from '@/shared';
import { colors, spacing } from '@/theme/theme';

// Types for API responses
interface ProductVariant {
  id: string;
  title: string;
  prices: Array<{
    id: string;
    amount: number;
    currency_code: string;
  }>;
  inventory?: Array<{
    id: string;
    location_levels: Array<{
      id: string;
      location_id: string;
      metadata: null;
      inventory_item_id: string;
      raw_stocked_quantity: {
        value: string;
        precision: number;
      };
      raw_reserved_quantity: {
        value: string;
        precision: number;
      };
      raw_incoming_quantity: {
        value: string;
        precision: number;
      };
      created_at: string;
      updated_at: string;
      deleted_at: null;
      available_quantity: number;
      stocked_quantity: number;
      reserved_quantity: number;
      incoming_quantity: number;
    }>;
  }>;
}

interface KitProduct {
  id: string;
  title: string;
  variants: ProductVariant[];
  qty: number;
}

interface Kit {
  id: string;
  title: string;
  price: number;
  products: KitProduct[];
}

interface UniformProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string;
  variants: ProductVariant[];
  options: Array<{
    id: string;
    title: string;
    values: Array<{
      id: string;
      value: string;
    }>;
  }>;
}

interface KitsResponse {
  list: Kit[];
}

interface UniformsResponse {
  list: UniformProduct[];
}

// Helper function to get product price
const getProductPrice = (variants: ProductVariant[]): number => {
  if (variants.length === 0) return 0;
  return variants[0].prices[0]?.amount || 0;
};

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'kits', label: 'Books and Stationery Kits' },
  { value: 'uniforms', label: 'Uniforms' },
];

export default function ShopScreen() {
  const { control } = useForm({
    defaultValues: {
      category: 'all',
    },
  });

  // Watch the category field to get the selected value
  const activeTab = useWatch({ control, name: 'category' });

  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});
  // Handle option change for a specific product
  const handleOptionChange = (productId: string, optionId: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [optionId]: value
      }
    }));
  };

  const { data: kitsData, isLoading: kitsLoading, error: kitsError } = useGetData<KitsResponse>({
    endpoint: Endpoint.categories,
    params: { filter: 'kits' },
    queryKey: ['categories', 'kits'],
    enabled: activeTab === 'kits' || activeTab === 'all'
  });
console.log('Active Tabssss:', activeTab, kitsData);
  const { data: uniformsData, isLoading: uniformsLoading, error: uniformsError } = useGetData<UniformsResponse>({
    endpoint: Endpoint.categories,
    params: { filter: 'uniforms' },
    queryKey: ['categories', 'uniforms'],
    enabled: activeTab === 'uniforms' || activeTab === 'all'
  });

  console.log('Debug State:', {
    activeTab,
    kitsEnabled: activeTab === 'kits' || activeTab === 'all',
    uniformsEnabled: activeTab === 'uniforms' || activeTab === 'all',
    kits: { data: !!kitsData, loading: kitsLoading, error: !!kitsError },
    uniforms: { data: !!uniformsData, loading: uniformsLoading, error: !!uniformsError }
  });


  // Find variant based on selected options
  const findVariantByOptions = (product: Kit | UniformProduct, productId: string) => {
    if (!('variants' in product) || !product.variants || product.variants.length === 0) return null;

    // If no options, return first variant
    if (!('options' in product) || !product.options || product.options.length === 0) {
      return product.variants[0];
    }

    const productOptions = selectedOptions[productId] || {};

    // Find variant that matches all selected options
    return product.variants.find((variant: ProductVariant & { options?: Array<{ option: { id: string }; value: string }> }) => {
      if (!variant.options) return false;

      return variant.options.every((variantOption) => {
        const selectedValue = productOptions[variantOption.option.id];
        return selectedValue === variantOption.value;
      });
    });
  };

  // Combine data based on active tab
  const displayData = useMemo(() => {
    const kits = kitsData?.list || [];
    const uniforms = uniformsData?.list || [];

    switch (activeTab) {
      case 'kits':
        return kits;
      case 'uniforms':
        return uniforms;
      case 'all':
      default:
        return [...kits, ...uniforms];
    }
  }, [activeTab, kitsData, uniformsData]);

  // Loading state - only consider queries that are actually enabled and loading
  const isLoading = useMemo(() => {
    // If timeout reached, don't show loading
    const kitsEnabled = activeTab === 'kits' || activeTab === 'all';
    const uniformsEnabled = activeTab === 'uniforms' || activeTab === 'all';

    const shouldShowLoading = (
      (kitsEnabled && kitsLoading && !kitsData && !kitsError) ||
      (uniformsEnabled && uniformsLoading && !uniformsData && !uniformsError)
    );

    return shouldShowLoading;
  }, [activeTab, kitsLoading, uniformsLoading, kitsData, uniformsData, kitsError, uniformsError]);

  console.log('Loading State:', {
    isLoading,
    activeTab,
    kitsLoading,
    uniformsLoading,
    kitsData: !!kitsData,
    uniformsData: !!uniformsData,
    kitsError: !!kitsError,
    uniformsError: !!uniformsError,
    displayDataLength: displayData.length
  });
  // Error state - only consider errors from enabled queries or timeout
  const hasError = useMemo(() => {
    const kitsEnabled = activeTab === 'kits' || activeTab === 'all';
    const uniformsEnabled = activeTab === 'uniforms' || activeTab === 'all';

    const kitsHasError = kitsEnabled && (kitsError || (!kitsLoading && (!kitsData || kitsData.list?.length === 0)));
    const uniformsHasError = uniformsEnabled && (uniformsError || (!uniformsLoading && (!uniformsData || uniformsData.list?.length === 0)));

    return kitsHasError || uniformsHasError;
  }, [activeTab, kitsLoading, uniformsLoading, kitsData, uniformsData, kitsError, uniformsError]);

  // Error message based on the type of error
  const getErrorMessage = () => {
    if (kitsError || uniformsError) {
      return 'Failed to load products. Please try again.';
    }
    if (displayData.length === 0) {
      return 'No products available at the moment. Please check back later.';
    }
    return 'Unable to load products. Please try again.';
  };

  const handleViewDetails = (product: Kit | UniformProduct) => {
    router.push(`/shop/${product.id}` as any);
  };

  const renderProductCard = ({ item: product }: { item: Kit | UniformProduct }) => {
    const isKit = 'products' in product;
    const price = isKit ? product.price : getProductPrice(product.variants);
    const thumbnail = !isKit ? product.thumbnail : null;
    const selectedVariant = !isKit ? findVariantByOptions(product, product.id) : null;

    // Get inventory data and stock status
    let inventoryData;
    if (isKit && product.products?.length > 0) {
      inventoryData = product.products[0]?.variants?.[0]?.inventory;
    } else if (selectedVariant) {
      inventoryData = selectedVariant.inventory;
    }

    const availableQuantity = inventoryData ? extractAvailableQuantity(inventoryData) : 0;
    const isInStock = availableQuantity > 0;
    const stockMessage = getStockStatusMessage(availableQuantity);

    return (
      <Card style={styles.productCard} mode="elevated">
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Surface style={styles.placeholderImage}>
              <Text variant="bodyMedium" style={styles.placeholderText}>
                {isKit ? '📚' : '👔'}
              </Text>
            </Surface>
          )}
        </View>

        {/* Product Content */}
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <Text variant="bodySmall" style={styles.productDescription} numberOfLines={2}>
            {isKit
              ? `Kit contains ${product.products.length} items`
              : product.description || 'Uniform item'
            }
          </Text>

          {/* Variant Options for Uniforms */}
          {!isKit && product.options && product.options.length > 0 && (
            <View style={styles.optionsContainer}>
              {product.options.map((option) => (
                <View key={option.id} style={styles.optionGroup}>
                  <Text variant="labelSmall" style={styles.optionLabel}>
                    {option.title}:
                  </Text>
                  <View style={styles.optionButtons}>
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[product.id]?.[option.id] === value.value;
                      return (
                        <Button
                          key={value.id}
                          mode={isSelected ? "contained" : "outlined"}
                          compact
                          onPress={() => handleOptionChange(product.id, option.id, value.value)}
                          style={[styles.optionButton, isSelected && styles.selectedOptionButton]}
                          labelStyle={styles.optionButtonLabel}
                        >
                          {value.value}
                        </Button>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Price and Stock */}
          <View style={styles.priceStockContainer}>
            <Text variant="titleMedium" style={styles.price}>
              ₹{price.toLocaleString('en-IN')}
            </Text>
            <Chip
              mode="flat"
              style={[styles.stockChip, { backgroundColor: isInStock ? '#E8F5E8' : '#FFEBEE' }]}
              textStyle={[styles.stockText, { color: isInStock ? '#2E7D2E' : '#C62828' }]}
            >
              {stockMessage}
            </Chip>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => handleViewDetails(product)}
              style={styles.viewDetailsButton}
              labelStyle={styles.buttonLabel}
            >
              View Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Header */}
        <Header title="Shop" />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Filter */}
          <SelectField
            name="category"
            control={control}
            label="Filter by Category"
            options={categoryOptions}
            placeholder="Select a category"
          />

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading products...
              </Text>
            </View>
          )}

          {/* Error State */}
          {hasError && (
            <Surface style={styles.errorContainer} mode="flat">
              <View style={styles.errorContent}>
                <Text variant="titleSmall" style={styles.errorTitle}>
                  ⚠️ Error
                </Text>
                <Text variant="bodyMedium" style={styles.errorText}>
                  {getErrorMessage()}
                </Text>
              </View>
            </Surface>
          )}

          {/* Product Grid */}
          {!isLoading && !hasError && displayData.length > 0 && (
            <FlatList
              data={displayData}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.gridContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text variant="headlineSmall" style={styles.emptyTitle}>
                    🛍️
                  </Text>
                  <Text variant="titleMedium" style={styles.emptyText}>
                    No products available
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptySubtext}>
                    Check back later for new products
                  </Text>
                </View>
              }
            />
          )}
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
  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  errorTitle: {
    color: '#C62828',
    fontWeight: 'bold',
    flex: 0,
  },
  errorText: {
    color: '#C62828',
    flex: 1,
    lineHeight: 20,
  },
  // Product Grid
  gridContainer: {
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  // Product Card
  productCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 150,
    backgroundColor: colors.text.disabled + '20',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.disabled + '10',
  },
  placeholderText: {
    fontSize: 32,
  },
  cardContent: {
    padding: spacing.md,
    flex: 1,
  },
  productTitle: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  productDescription: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  // Options
  optionsContainer: {
    marginBottom: spacing.sm,
  },
  optionGroup: {
    marginBottom: spacing.xs,
  },
  optionLabel: {
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
    textTransform: 'capitalize',
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionButton: {
    minWidth: 50,
    borderRadius: 6,
  },
  selectedOptionButton: {
    backgroundColor: colors.primary,
  },
  optionButtonLabel: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  // Price and Stock
  priceStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  price: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  stockChip: {
    borderRadius: 12,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Buttons
  buttonContainer: {
    gap: spacing.xs,
  },
  viewDetailsButton: {
    borderColor: colors.primary,
  },
  buttonLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.text.disabled,
    textAlign: 'center',
  },
});

