import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../../constants/theme";
import { useCart } from "../../../../contexts/CartContext";
import { useToast } from "../../../../contexts/ToastContext";
import { formatPrice } from "../../../../lib/auth-utils";
import { apiPost } from "../../../../lib/sdk";
import { useGetData } from "../../../../lib/use-api";
import { endpoints } from "../../../../shared/endpoints";
import { Product, ProductVariant, Uniform } from "../../../../shared/types";

interface UniformResponse {
  category: {
    id: string;
    name: string;
    uniforms?: Uniform[];
  };
}

function getAvailableQuantity(variant: ProductVariant): number {
  return variant.inventory?.[0]?.location_levels?.[0]?.available_quantity ?? 0;
}

function getPrice(variant: ProductVariant): number {
  return variant.prices?.[0]?.amount ?? 0;
}

// Natural sort for sizes: Small < Medium < Large < XL < 28 < 30 etc.
function naturalSortSizes(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true });
}

function getOptionValue(variant: ProductVariant): string {
  return variant.options?.[0]?.value || variant.title;
}

interface VariantSelectorProps {
  product: Product;
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

function VariantSelector({
  product,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const sorted = [...product.variants].sort((a, b) =>
    naturalSortSizes(getOptionValue(a), getOptionValue(b))
  );

  return (
    <View>
      <Text style={styles.sizeLabel}>Select Size</Text>
      <View style={styles.sizeRow}>
        {sorted.map((variant) => {
          const available = getAvailableQuantity(variant);
          const isSelected = selectedVariantId === variant.id;
          const isOos = available <= 0;

          return (
            <Chip
              key={variant.id}
              selected={isSelected}
              disabled={isOos}
              onPress={() => !isOos && onSelect(variant.id)}
              style={[
                styles.sizeChip,
                isSelected && styles.sizeChipSelected,
                isOos && styles.sizeChipOos,
              ]}
              textStyle={[
                styles.sizeChipText,
                isSelected && styles.sizeChipTextSelected,
              ]}
            >
              {getOptionValue(variant)}
              {isOos ? " (OOS)" : ""}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

export default function UniformDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cartId, fetchCart, setShowCartDrawer, hasAddresses } = useCart();
  const toast = useToast();

  const { data, isLoading } = useGetData<UniformResponse>(
    ["category", id, "uniform"],
    `${endpoints.category(id!)}?filter=uniform`
  );

  const uniforms = data?.category?.uniforms || [];

  // Map productId → selected variantId
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  const handleSelect = useCallback((productId: string, variantId: string) => {
    setSelections((prev) => ({ ...prev, [productId]: variantId }));
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!cartId) {
      toast.error("Cart not ready. Please wait.");
      return;
    }
    if (!hasAddresses) {
      Alert.alert(
        "Address Required",
        "Please add a delivery address before adding to cart.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Account",
            onPress: () => router.push("/(tabs)/account"),
          },
        ]
      );
      return;
    }

    const selectedItems = Object.entries(selections)
      .filter(([, variantId]) => !!variantId)
      .map(([, variantId]) => ({ variant_id: variantId, quantity: 1 }));

    if (selectedItems.length === 0) {
      toast.warning("Please select at least one size.");
      return;
    }

    setAdding(true);
    try {
      // Add each uniform item to cart
      for (const item of selectedItems) {
        await apiPost(endpoints.lineItems(cartId), {
          items: [item],
          item_type: "uniform",
        });
      }
      await fetchCart();
      setShowCartDrawer(true);
      toast.success("Added to cart!");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosErr?.response?.data?.message || "Failed to add to cart"
      );
    } finally {
      setAdding(false);
    }
  }, [cartId, selections, fetchCart, setShowCartDrawer, toast, hasAddresses]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (uniforms.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="tshirt-crew-outline"
          size={60}
          color={COLORS.border}
        />
        <Text style={styles.emptyText}>No uniforms found</Text>
      </View>
    );
  }

  const uniform = uniforms[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Uniform header */}
        <Surface style={styles.header} elevation={0}>
          <View
            style={[styles.iconArea, { backgroundColor: "#fce4ec" }]}
          >
            <MaterialCommunityIcons
              name="tshirt-crew-outline"
              size={60}
              color={COLORS.secondary}
            />
          </View>
          <Text style={styles.title}>{uniform.title}</Text>
        </Surface>

        {/* Products */}
        {(uniform.products || []).map((product) => {
          const selectedVariantId = selections[product.id] || null;
          const selectedVariant = product.variants.find(
            (v) => v.id === selectedVariantId
          );
          const price = selectedVariant
            ? getPrice(selectedVariant)
            : Math.min(...product.variants.map(getPrice).filter((p) => p > 0));

          // Show product image if available (base64)
          const imageUrl =
            product.images?.[0]?.url || product.thumbnail;
          const isBase64 = imageUrl?.startsWith("data:image");

          return (
            <Surface key={product.id} style={styles.productCard} elevation={1}>
              {imageUrl && (
                <Image
                  source={{
                    uri: isBase64
                      ? imageUrl
                      : `data:image/jpeg;base64,${imageUrl}`,
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.productBody}>
                <Text style={styles.productTitle}>{product.title}</Text>
                <Text style={styles.productPrice}>
                  {price > 0 ? formatPrice(price) : "Select size for price"}
                </Text>
                <VariantSelector
                  product={product}
                  selectedVariantId={selectedVariantId}
                  onSelect={(vId) => handleSelect(product.id, vId)}
                />
              </View>
            </Surface>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.totalLabel}>Selected</Text>
            <Text style={styles.selectedCount}>
              {Object.values(selections).filter(Boolean).length} item(s)
            </Text>
          </View>
          <Button
            mode="contained"
            buttonColor={COLORS.secondary}
            style={styles.addBtn}
            contentStyle={styles.addBtnContent}
            labelStyle={styles.addBtnLabel}
            onPress={handleAddToCart}
            loading={adding}
            disabled={adding}
          >
            Add to Cart
          </Button>
        </View>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  scrollContent: { padding: SPACING.md },
  header: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  iconArea: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  productCard: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  productImage: {
    width: "100%",
    height: 180,
  },
  productBody: {
    padding: SPACING.md,
  },
  productTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  productPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  sizeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  sizeChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  sizeChipSelected: {
    backgroundColor: "#fce4ec",
    borderColor: COLORS.secondary,
  },
  sizeChipOos: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.disabled,
    opacity: 0.5,
  },
  sizeChipText: {
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  sizeChipTextSelected: {
    color: COLORS.secondary,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  totalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  selectedCount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  addBtn: {
    borderRadius: RADIUS.md,
    flex: 1,
    marginLeft: SPACING.md,
  },
  addBtnContent: { paddingVertical: 6 },
  addBtnLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
});
