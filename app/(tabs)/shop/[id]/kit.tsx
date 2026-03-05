import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ActivityIndicator,
    Banner,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../../constants/theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { useCart } from "../../../../contexts/CartContext";
import { useToast } from "../../../../contexts/ToastContext";
import { formatPrice } from "../../../../lib/auth-utils";
import { apiPost } from "../../../../lib/sdk";
import { useGetData } from "../../../../lib/use-api";
import { endpoints } from "../../../../shared/endpoints";
import { Kit, Product, ProductVariant } from "../../../../shared/types";

interface KitResponse {
  category: {
    id: string;
    name: string;
    kits?: Kit[];
  };
}

const CATEGORIES_ORDER = ["Text Books", "Note Books", "Stationery"];

function getCategoryName(product: Product): string {
  return product.categories?.[0]?.name || "Other";
}

function getAvailableQuantity(variant: ProductVariant): number {
  const levels = variant.inventory?.[0]?.location_levels?.[0];
  return levels?.available_quantity ?? 0;
}

function getPrice(variant: ProductVariant): number {
  return variant.prices?.[0]?.amount ?? 0;
}

interface QtyPicker {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function QuantityPicker({ value, max, onChange, disabled }: QtyPicker) {
  return (
    <View style={styles.qtyRow}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        style={[styles.qtyBtn, (disabled || value <= 0) && { opacity: 0.4 }]}
      >
        <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.qtyValue}>{value}</Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        style={[styles.qtyBtn, (disabled || value >= max) && { opacity: 0.4 }]}
      >
        <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function KitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cartId, fetchCart, setShowCartDrawer, hasAddresses } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const { data, isLoading } = useGetData<KitResponse>(
    ["category", id, "kit"],
    `${endpoints.category(id!)}?filter=kit`
  );

  const kits = data?.category?.kits || [];
  // Use first kit (or show selection)
  const kit = kits[0] as Kit | undefined;

  // Map: variantId → quantity selected
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);

  // Initialize quantities when kit loads
  React.useEffect(() => {
    if (!kit) return;
    const init: Record<string, number> = {};
    kit.products?.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (kit.disable_textbook_customization) {
          init[variant.id] = 1;
        } else {
          init[variant.id] = 1; // default quantity
        }
      });
    });
    setQuantities(init);
  }, [kit]);

  // Group products by category
  const grouped = useMemo(() => {
    if (!kit) return {};
    const groups: Record<string, Product[]> = {};
    kit.products?.forEach((product) => {
      const cat = getCategoryName(product);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [kit]);

  const orderedCategories = useMemo(() => {
    const cats = Object.keys(grouped);
    return [
      ...CATEGORIES_ORDER.filter((c) => cats.includes(c)),
      ...cats.filter((c) => !CATEGORIES_ORDER.includes(c)),
    ];
  }, [grouped]);

  // Compute subtotal
  const subtotal = useMemo(() => {
    let total = 0;
    kit?.products?.forEach((product) => {
      product.variants?.forEach((variant) => {
        total += getPrice(variant) * (quantities[variant.id] || 0);
      });
    });
    return total;
  }, [kit, quantities]);

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
    if (!kit) return;

    // Build line items from selected quantities
    const lineItems = kit.products
      .flatMap((product) =>
        product.variants
          .filter((v) => (quantities[v.id] || 0) > 0)
          .map((v) => ({
            variant_id: v.id,
            quantity: quantities[v.id] || 0,
          }))
      )
      .filter((item) => item.quantity > 0);

    if (lineItems.length === 0) {
      toast.warning("Please select at least one item.");
      return;
    }

    setAdding(true);
    try {
      await apiPost(endpoints.lineItems(cartId), {
        kit_id: kit.id,
        kit_type: kit.type,
        items: lineItems,
      });
      await fetchCart();
      setShowCartDrawer(true);
      toast.success("Added to cart!");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  }, [
    cartId,
    kit,
    quantities,
    fetchCart,
    setShowCartDrawer,
    toast,
    hasAddresses,
  ]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!kit) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={60}
          color={COLORS.border}
        />
        <Text style={styles.emptyText}>Kit not found</Text>
      </View>
    );
  }

  const isFree = kit.type === "free";

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Kit header */}
        <Surface style={styles.kitHeader} elevation={0}>
          <View style={styles.kitHeaderInner}>
            <View
              style={[
                styles.kitIcon,
                {
                  backgroundColor: isFree
                    ? "#e8f5e9"
                    : "#e6f4fc",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-variant"
                size={36}
                color={isFree ? COLORS.success : COLORS.primary}
              />
            </View>
            <View style={styles.kitInfo}>
              <Text style={styles.kitTitle}>{kit.title}</Text>
              <Chip
                style={{
                  backgroundColor: isFree ? "#e8f5e9" : "#e6f4fc",
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
                textStyle={{
                  color: isFree ? COLORS.success : COLORS.primary,
                  fontSize: FONT_SIZE.xs,
                  fontWeight: "700",
                }}
              >
                {isFree ? "FREE KIT" : "BUNDLE KIT"}
              </Chip>
            </View>
          </View>
        </Surface>

        {/* Student note */}
        {kit.student_note && (
          <Banner
            visible
            icon="information-outline"
            style={styles.banner}
          >
            <Text style={{ fontSize: FONT_SIZE.sm }}>{kit.student_note.replace(/<[^>]*>/g, " ").trim()}</Text>
          </Banner>
        )}

        {/* Products by category */}
        {orderedCategories.map((cat) => (
          <View key={cat} style={styles.categorySection}>
            <Text style={styles.categoryHeader}>{cat}</Text>
            {(grouped[cat] || []).map((product) => (
              <Surface key={product.id} style={styles.productRow} elevation={1}>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  {product.variants.map((variant) => {
                    const qty = quantities[variant.id] || 0;
                    const maxQty = getAvailableQuantity(variant);
                    const price = getPrice(variant);
                    const isTextBook = cat === "Text Books";
                    const disableCustomize =
                      isTextBook && kit.disable_textbook_customization;

                    return (
                      <View key={variant.id} style={styles.variantRow}>
                        <View style={styles.variantLeft}>
                          {variant.title && variant.title !== "Default Variant" && (
                            <Text style={styles.variantTitle}>
                              {variant.title}
                            </Text>
                          )}
                          <Text style={styles.variantPrice}>
                            {price > 0 ? formatPrice(price) : "Free"}
                          </Text>
                          {maxQty === 0 && (
                            <Text style={styles.outOfStock}>Out of stock</Text>
                          )}
                        </View>
                        <QuantityPicker
                          value={qty}
                          max={maxQty}
                          disabled={disableCustomize || maxQty === 0}
                          onChange={(v) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [variant.id]: v,
                            }))
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              </Surface>
            ))}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <Surface style={styles.bottomBar} elevation={4}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {isFree && subtotal === 0 ? "Free" : formatPrice(subtotal)}
            </Text>
          </View>
          <Button
            mode="contained"
            buttonColor={COLORS.primary}
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
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  kitHeader: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  kitHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  kitIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  kitInfo: { flex: 1 },
  kitTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  banner: {
    marginBottom: SPACING.md,
    backgroundColor: "#fff8e1",
    borderRadius: RADIUS.md,
  },
  categorySection: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  productRow: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  productInfo: {
    padding: SPACING.md,
  },
  productTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  variantLeft: { flex: 1 },
  variantTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  variantPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  outOfStock: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 20,
    textAlign: "center",
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
  totalAmount: {
    fontSize: FONT_SIZE.xl,
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
