import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Dialog,
    Divider,
    Portal,
    RadioButton,
    Surface,
    Text
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../components/common/Loader";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { formatPrice } from "../../lib/auth-utils";
import RazorpayWebView, { RazorpaySuccessResponse } from "../../components/common/RazorpayWebView";
import { apiDelete, apiPatch, apiPost } from "../../lib/sdk";
import { useGetData } from "../../lib/use-api";
import { endpoints } from "../../shared/endpoints";
import { Address, CartLineItem, PaymentMethod } from "../../shared/types";

function CartItemRow({ item }: { item: CartLineItem }) {
  const isKit = item.item_type === "kit";
  const isFreeKit = isKit && item.class_kit_type === "free";
  const itemCount = item.cart_line_item_ids?.length ?? 0;

  return (
    <View style={styles.itemRow}>
      <View
        style={[
          styles.itemIcon,
          { backgroundColor: isKit ? (isFreeKit ? "#e8f5e9" : "#e6f4fc") : "#fce4ec" },
        ]}
      >
        <MaterialCommunityIcons
          name={isKit ? "book-open-variant" : "tshirt-crew-outline"}
          size={22}
          color={isKit ? (isFreeKit ? COLORS.success : COLORS.primary) : COLORS.secondary}
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.product_title || "Item"}
        </Text>
        {isKit ? (
          <View style={styles.kitMeta}>
            <View style={[styles.kitBadge, { backgroundColor: isFreeKit ? "#e8f5e9" : "#e6f4fc" }]}>
              <Text style={[styles.kitBadgeText, { color: isFreeKit ? COLORS.success : COLORS.primary }]}>
                {isFreeKit ? "FREE KIT" : "BUNDLE KIT"}
              </Text>
            </View>
            {itemCount > 0 && (
              <Text style={styles.itemQty}>{itemCount} item{itemCount !== 1 ? "s" : ""}</Text>
            )}
          </View>
        ) : (
          <>
            {item.variant_title && item.variant_title !== "Default variant" && item.variant_title !== "Default Variant" && (
              <Text style={styles.itemVariant}>Size: {item.variant_title}</Text>
            )}
            <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
          </>
        )}
      </View>
      <Text style={styles.itemPrice}>
        {formatPrice(item.subtotal ?? item.unit_price * item.quantity)}
      </Text>
    </View>
  );
}

function AddressSelector({
  visible,
  onDismiss,
  addresses,
  selectedId,
  onSelect,
  type,
}: {
  visible: boolean;
  onDismiss: () => void;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  type: "billing" | "shipping";
}) {
  const [localSelected, setLocalSelected] = useState(selectedId);

  const handleConfirm = () => {
    if (localSelected) onSelect(localSelected);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          Select {type === "billing" ? "Billing" : "Shipping"} Address
        </Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group
            value={localSelected || ""}
            onValueChange={setLocalSelected}
          >
            {addresses.map((addr) => (
              <RadioButton.Item
                key={addr.id}
                value={addr.id}
                label={`${addr.first_name} ${addr.last_name}\n${addr.address_1}, ${addr.city}, ${addr.province} ${addr.postal_code}`}
                style={styles.radioItem}
                labelStyle={styles.radioLabel}
              />
            ))}
          </RadioButton.Group>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={COLORS.textSecondary}>
            Cancel
          </Button>
          <Button
            onPress={handleConfirm}
            textColor={COLORS.primary}
            disabled={!localSelected}
          >
            Confirm
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default function CartScreen() {
  const { cartId, cartData, cartLoading, fetchCart, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [billingAddressId, setBillingAddressId] = useState<string | null>(null);
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(null);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [rzpWebViewOptions, setRzpWebViewOptions] = useState<Parameters<typeof RazorpayWebView>[0]["options"] | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const addresses = user?.addresses || [];

  const { data: paymentMethodsData } = useGetData<{ list: PaymentMethod[] }>(
    ["payment-methods"],
    endpoints.paymentMethods,
    { enabled: !!cartId }
  );
  const paymentMethods = (paymentMethodsData?.list || []).filter(
    (m) => m.is_active
  );

  // Auto-select first active payment method
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  const allItems = cartData?.custom_items || [];
  const isEmpty = allItems.length === 0;
  const total = cartData?.total || 0;
  const isFreeOrder = total === 0;

  // Pre-fill default addresses
  React.useEffect(() => {
    if (addresses.length > 0) {
      const defaultBilling = addresses.find((a) => a.is_default_billing) || addresses[0];
      const defaultShipping = addresses.find((a) => a.is_default_shipping) || addresses[0];
      if (!billingAddressId) setBillingAddressId(defaultBilling.id);
      if (!shippingAddressId) setShippingAddressId(defaultShipping.id);
    }
  }, [addresses]);

  const getAddress = (id: string | null) =>
    addresses.find((a) => a.id === id);

  const handleSetAddresses = useCallback(async () => {
    if (!cartId || !billingAddressId || !shippingAddressId) return;
    const billing = getAddress(billingAddressId);
    const shipping = getAddress(shippingAddressId);
    if (!billing || !shipping) return;
    try {
      await apiPatch(endpoints.cartAddress(cartId), {
        billing_address: {
          first_name: billing.first_name,
          last_name: billing.last_name,
          address_1: billing.address_1,
          address_2: billing.address_2,
          city: billing.city,
          province: billing.province,
          postal_code: billing.postal_code,
          country_code: billing.country_code || "in",
          phone: billing.phone,
          email: billing.email,
        },
        shipping_address: {
          first_name: shipping.first_name,
          last_name: shipping.last_name,
          address_1: shipping.address_1,
          address_2: shipping.address_2,
          city: shipping.city,
          province: shipping.province,
          postal_code: shipping.postal_code,
          country_code: shipping.country_code || "in",
          phone: shipping.phone,
          email: shipping.email,
        },
      });
    } catch {
      // ignore
    }
  }, [cartId, billingAddressId, shippingAddressId, addresses]);

  const handlePlaceOrder = useCallback(async () => {
    if (isEmpty) {
      toast.warning("Your cart is empty.");
      return;
    }
    if (!billingAddressId || !shippingAddressId) {
      toast.error("Please select billing and shipping addresses.");
      return;
    }
    if (!isFreeOrder && !selectedPaymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    await handleSetAddresses();

    if (isFreeOrder) {
      // Place order directly without payment
      setIsPlacingOrder(true);
      try {
        await apiPost(endpoints.payments, { cart_id: cartId });
        await apiPost(endpoints.lineItemAttributes, { cart_id: cartId });
        toast.success("Order placed successfully!");
        router.replace("/(tabs)/orders");
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(axiosErr?.response?.data?.message || "Failed to place order");
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      // Show payment dialog
      setShowPaymentDialog(true);
    }
  }, [
    isEmpty,
    billingAddressId,
    shippingAddressId,
    isFreeOrder,
    selectedPaymentMethod,
    cartId,
    handleSetAddresses,
    toast,
  ]);

  // Step 1: confirm dialog → create payment session → open WebView
  const handleRazorpayPayment = useCallback(async () => {
    setShowPaymentDialog(false);
    setIsPlacingOrder(true);
    try {
      const paymentRes = await apiPost<{
        payment_session: {
          id: string;
          currency_code?: string;
          data?: { razorpay_order?: { id: string; amount: number } };
        };
        razorpay_order: { id: string; amount: number; currency: string };
      }>(endpoints.payments, { amount: total, cart_id: cartId });

      const sessionId = paymentRes.payment_session?.id ?? null;
      const rzpOrderId =
        paymentRes.razorpay_order?.id ||
        paymentRes.payment_session?.data?.razorpay_order?.id;
      const rzpOrderAmount =
        paymentRes.razorpay_order?.amount ||
        paymentRes.payment_session?.data?.razorpay_order?.amount ||
        total * 100;
      const rzpCurrency =
        paymentRes.razorpay_order?.currency ||
        paymentRes.payment_session?.currency_code?.toUpperCase() ||
        "INR";

      if (!rzpOrderId || !sessionId) {
        toast.error("Payment session creation failed.");
        setIsPlacingOrder(false);
        return;
      }

      const method = paymentMethods.find((m) => m.id === selectedPaymentMethod);
      const billing = getAddress(billingAddressId);

      // Store session ID for cleanup on dismiss
      setPendingSessionId(sessionId);

      // Build options exactly like medusafront — pass to WebView HTML
      setRzpWebViewOptions({
        key: method?.config?.razorpay_id || "",
        amount: rzpOrderAmount,
        currency: rzpCurrency,
        order_id: rzpOrderId,
        name: "ShopSchool",
        description: "School Kit & Uniform Order",
        prefill: {
          name: `${billing?.first_name || ""} ${billing?.last_name || ""}`.trim(),
          email: billing?.email || user?.email || "",
          contact: billing?.phone || user?.phone || "",
        },
        theme: { color: "#1976d2" },
      });

      setShowRazorpayWebView(true);
      setIsPlacingOrder(false);
    } catch (err: unknown) {
      console.error("[RAZORPAY] Session creation error:", JSON.stringify(err));
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || "Failed to initiate payment.");
      setIsPlacingOrder(false);
    }
  }, [cartId, total, selectedPaymentMethod, paymentMethods, billingAddressId, addresses, user, toast]);

  // Step 2a: WebView success → confirm order on backend
  const handleRazorpaySuccess = useCallback(async (rzpResponse: RazorpaySuccessResponse) => {
    setShowRazorpayWebView(false);
    setIsPlacingOrder(true);
    try {
      await apiPatch(endpoints.cart(cartId!), {
        payment_session_id: pendingSessionId,
        response: {
          razorpay_payment_id: rzpResponse.razorpay_payment_id,
          razorpay_order_id: rzpResponse.razorpay_order_id,
          razorpay_signature: rzpResponse.razorpay_signature,
        },
      });
      await apiPost(endpoints.lineItemAttributes, { cart_id: cartId });
      toast.success("Order placed successfully!");
      router.replace("/(tabs)/orders");
    } catch (err: unknown) {
      console.error("[RAZORPAY] Order confirm error:", JSON.stringify(err));
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || "Payment received but order confirmation failed. Please contact support.");
    } finally {
      setIsPlacingOrder(false);
      setPendingSessionId(null);
    }
  }, [cartId, pendingSessionId, toast]);

  // Step 2b: WebView dismissed without paying
  const handleRazorpayDismiss = useCallback(async () => {
    setShowRazorpayWebView(false);
    toast.info("Payment cancelled.");
    try {
      if (pendingSessionId) await apiDelete(endpoints.payment(pendingSessionId));
    } catch {
      // ignore
    } finally {
      setPendingSessionId(null);
    }
  }, [pendingSessionId, toast]);

  // Step 2c: WebView payment failure
  const handleRazorpayError = useCallback((description: string) => {
    setShowRazorpayWebView(false);
    toast.error(description || "Payment failed. Please try again.");
    setPendingSessionId(null);
  }, [toast]);

  if (cartLoading && !cartData) {
    return <Loader full message="Loading cart..." />;
  }

  const billingAddr = getAddress(billingAddressId);
  const shippingAddr = getAddress(shippingAddressId);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Appbar.Header style={styles.appBar} elevated>
        <Appbar.Content title="My Cart" titleStyle={styles.headerTitle} />
        {!isEmpty && (
          <Appbar.Action
            icon="trash-can-outline"
            iconColor={COLORS.error}
            onPress={() =>
              Alert.alert("Clear Cart", "Remove all items?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearCart },
              ])
            }
          />
        )}
      </Appbar.Header>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="cart-off"
            size={80}
            color={COLORS.border}
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse the shop to add items
          </Text>
          <Button
            mode="contained"
            buttonColor={COLORS.primary}
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/shop")}
          >
            Go to Shop
          </Button>
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CartItemRow item={item} />}
          refreshControl={
            <RefreshControl refreshing={cartLoading} onRefresh={fetchCart} />
          }
          ListHeaderComponent={
            addresses.length === 0 ? (
              <Surface style={styles.noAddrBanner} elevation={0}>
                <MaterialCommunityIcons
                  name="map-marker-alert"
                  size={20}
                  color={COLORS.warning}
                />
                <Text style={styles.noAddrText}>
                  No address found.{" "}
                  <Text
                    style={styles.noAddrLink}
                    onPress={() => router.push("/(tabs)/account")}
                  >
                    Add address
                  </Text>
                </Text>
              </Surface>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {/* Address section */}
              {addresses.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                  <Text style={styles.sectionTitle}>Delivery Addresses</Text>
                  <View style={styles.addressRow}>
                    <View style={styles.addressBlock}>
                      <View style={styles.addressLabelRow}>
                        <Text style={styles.addressLabel}>Billing</Text>
                        <Button
                          compact
                          mode="text"
                          textColor={COLORS.primary}
                          onPress={() => setShowBillingDialog(true)}
                        >
                          Change
                        </Button>
                      </View>
                      {billingAddr && (
                        <Text style={styles.addressText} numberOfLines={3}>
                          {billingAddr.first_name} {billingAddr.last_name},{" "}
                          {billingAddr.address_1}, {billingAddr.city},{" "}
                          {billingAddr.province} {billingAddr.postal_code}
                        </Text>
                      )}
                    </View>
                    <Divider style={{ marginVertical: SPACING.sm }} />
                    <View style={styles.addressBlock}>
                      <View style={styles.addressLabelRow}>
                        <Text style={styles.addressLabel}>Shipping</Text>
                        <Button
                          compact
                          mode="text"
                          textColor={COLORS.primary}
                          onPress={() => setShowShippingDialog(true)}
                        >
                          Change
                        </Button>
                      </View>
                      {shippingAddr && (
                        <Text style={styles.addressText} numberOfLines={3}>
                          {shippingAddr.first_name} {shippingAddr.last_name},{" "}
                          {shippingAddr.address_1}, {shippingAddr.city},{" "}
                          {shippingAddr.province} {shippingAddr.postal_code}
                        </Text>
                      )}
                    </View>
                  </View>
                </Surface>
              )}

              {/* Payment method */}
              {!isFreeOrder && paymentMethods.length > 0 && (
                <Surface style={styles.section} elevation={1}>
                  <Text style={styles.sectionTitle}>Payment Method</Text>
                  <RadioButton.Group
                    value={selectedPaymentMethod || ""}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    {paymentMethods.map((method) => (
                      <RadioButton.Item
                        key={method.id}
                        value={method.id}
                        label={method.method === "razorpay" ? "Razorpay (UPI / Cards / Net Banking)" : method.method}
                        style={styles.radioItem}
                      />
                    ))}
                  </RadioButton.Group>
                </Surface>
              )}

              {/* Order summary */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrice(cartData?.subtotal || 0)}
                  </Text>
                </View>
                {(cartData?.tax_total || 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(cartData?.tax_total || 0)}
                    </Text>
                  </View>
                )}
                <Divider style={{ marginVertical: SPACING.sm }} />
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>
                    {isFreeOrder ? "Free" : formatPrice(total)}
                  </Text>
                </View>
              </Surface>

              <Button
                mode="contained"
                buttonColor={COLORS.primary}
                style={styles.placeOrderBtn}
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontSize: FONT_SIZE.md, fontWeight: "700" }}
                onPress={handlePlaceOrder}
                loading={isPlacingOrder}
                disabled={isPlacingOrder}
              >
                {isFreeOrder ? "Place Free Order" : "Proceed to Pay"}
              </Button>
              <View style={{ height: 24 }} />
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Address dialogs */}
      <AddressSelector
        visible={showBillingDialog}
        onDismiss={() => setShowBillingDialog(false)}
        addresses={addresses}
        selectedId={billingAddressId}
        onSelect={setBillingAddressId}
        type="billing"
      />
      <AddressSelector
        visible={showShippingDialog}
        onDismiss={() => setShowShippingDialog(false)}
        addresses={addresses}
        selectedId={shippingAddressId}
        onSelect={setShippingAddressId}
        type="shipping"
      />

      {/* Payment confirmation dialog */}
      <Portal>
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>Confirm Order</Dialog.Title>
          <Dialog.Content>
            <Text>
              Total: {formatPrice(total)}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 4, fontSize: FONT_SIZE.sm }}>
              {allItems.length} item(s) in your cart
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)} textColor={COLORS.textSecondary}>
              Cancel
            </Button>
            <Button onPress={handleRazorpayPayment} textColor={COLORS.primary}>
              Pay Now
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Razorpay WebView — loads checkout.razorpay.com just like medusafront */}
      {rzpWebViewOptions && (
        <RazorpayWebView
          visible={showRazorpayWebView}
          options={rzpWebViewOptions}
          onSuccess={handleRazorpaySuccess}
          onDismiss={handleRazorpayDismiss}
          onError={handleRazorpayError}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appBar: { backgroundColor: COLORS.surface },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700" },
  listContent: { padding: SPACING.md },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  shopBtn: {
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    minWidth: 160,
  },
  noAddrBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  noAddrText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  noAddrLink: { color: COLORS.primary, fontWeight: "600" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  itemVariant: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  itemQty: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  kitMeta: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: 2 },
  kitBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  kitBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  itemPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  footer: { marginTop: SPACING.sm },
  section: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  addressRow: {},
  addressBlock: {},
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  radioItem: { paddingVertical: 2 },
  radioLabel: { fontSize: FONT_SIZE.sm },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: "600" },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.primary,
  },
  placeOrderBtn: {
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
});
