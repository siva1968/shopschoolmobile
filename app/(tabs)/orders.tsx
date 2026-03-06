import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import {
    ActivityIndicator,
    Appbar,
    Button,
    Chip,
    Divider,
    Surface,
    Text,
} from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { useToast } from "../../contexts/ToastContext";
import { formatPrice } from "../../lib/auth-utils";
import { apiPatch } from "../../lib/sdk";
import { useGetData } from "../../lib/use-api";
import { endpoints } from "../../shared/endpoints";
import { Order } from "../../shared/types";

interface OrdersResponse {
  list: Order[];
  count: number;
  skip: number;
  take: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  reserved: COLORS.warning,
  processing: COLORS.info,
  shipped: COLORS.primary,
  delivered: COLORS.success,
  cancelled: COLORS.error,
  canceled: COLORS.error,
  completed: COLORS.success,
};

function formatStatus(status?: string): string {
  if (!status) return "Unknown";
  if (status.toLowerCase() === "pending") return "Reserved";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <Chip
      style={{ backgroundColor: `${color}22`, alignSelf: "flex-start" }}
      textStyle={{ color, fontSize: FONT_SIZE.xs, fontWeight: "700" }}
    >
      {label.toUpperCase()}
    </Chip>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const total = order.metadata?.total || order.cart?.order?.total || 0;
  const isCancelled = order.is_cancelled ?? false;
  const hasReturns = order.has_returns ?? false;
  const canDownloadInvoice = order.status === "completed";

  const createdAt = order.created_at
    ? format(new Date(order.created_at), "dd MMM yyyy")
    : "";

  const allItems = order.custom_items?.length
    ? order.custom_items
    : (order.items || []);

  const refundInfo = order.refund_info as { total?: number; date?: string | null; items_count?: number } | null | undefined;

  const handleDownloadInvoice = useCallback(async () => {
    if (!order.order_attributes?.invoice_id) {
      toast.info("Invoice not yet available.");
      return;
    }
    setDownloading(true);
    try {
      const res = await apiPatch<{ pdf?: string }>(
        endpoints.order(order.id),
        {}
      );
      const base64Pdf = res.pdf;
      if (!base64Pdf) {
        toast.info("Invoice not available yet.");
        return;
      }
      const fileName = `invoice_${order.display_id || order.id}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.error("Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: `Save Invoice #${order.display_id}`,
      });
    } catch {
      toast.error("Failed to download invoice.");
    } finally {
      setDownloading(false);
    }
  }, [order, toast]);

  return (
    <Surface style={styles.orderCard} elevation={1}>
      {/* Card header */}
      <TouchableOpacity
        style={styles.orderHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>
            Order #{order.display_id || order.id.substring(0, 8)}
          </Text>
          <Text style={styles.orderDate}>{createdAt}</Text>
        </View>
        <View style={styles.orderHeaderRight}>
          <View style={styles.totalCol}>
            <Text
              style={[
                styles.orderTotal,
                isCancelled && styles.orderTotalCancelled,
              ]}
            >
              {formatPrice(total)}
            </Text>
            {isCancelled && (
              <Text style={styles.cancelledTotal}>₹0.00</Text>
            )}
            {hasReturns && !isCancelled && refundInfo?.total != null && (
              <Text style={styles.refundText}>
                ₹{refundInfo.total.toLocaleString("en-IN")} refunded
              </Text>
            )}
          </View>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Status chips row */}
      <View style={styles.statusRow}>
        {/* Main order status */}
        <StatusChip
          label={formatStatus(order.status)}
          color={STATUS_COLORS[order.status?.toLowerCase() ?? ""] ?? COLORS.textSecondary}
        />
        {/* Cancelled badge */}
        {isCancelled && (
          <StatusChip label="Cancelled" color={COLORS.error} />
        )}
        {/* Partial return badge */}
        {hasReturns && !isCancelled && (
          <StatusChip label="Partial Return" color="#d97706" />
        )}
      </View>



      {/* Expanded items */}
      {expanded && (
        <>
          <Divider style={{ marginVertical: SPACING.sm }} />
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsHeaderText}>
              Order Items ({allItems.length})
            </Text>
            <Text style={styles.itemsTotalText}>
              Total: {formatPrice(total)}
            </Text>
          </View>

          {allItems.length === 0 ? (
            <Text style={styles.noItemsText}>No items found in this order</Text>
          ) : (
            allItems.map((item, idx) => {
              const itemId = (item as { id: string }).id;
              const returnedQty: number =
                (order.return_items_map as Record<string, number>)?.[itemId] ?? 0;
              const isReturned = returnedQty > 0;
              const isFullyReturned = returnedQty >= (item.quantity ?? 1);
              const itemName =
                (item as { product_title?: string }).product_title ||
                (item as { title?: string }).title ||
                (item as { subtitle?: string }).subtitle ||
                "Item";
              const variantTitle = (item as { variant_title?: string }).variant_title;
              const kitType = (item as { class_kit_type?: string }).class_kit_type;
              const unitPrice = (item as { unit_price?: number }).unit_price ?? 0;
              const qty = item.quantity ?? 1;

              return (
                <View
                  key={`${itemId}-${idx}`}
                  style={[
                    styles.orderItem,
                    isReturned && styles.orderItemReturned,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderItemTitleRow}>
                      <Text style={styles.orderItemTitle} numberOfLines={2}>
                        {itemName}
                        {variantTitle &&
                          variantTitle.toLowerCase() !== "default variant"
                          ? ` - ${variantTitle}`
                          : ""}
                        {kitType ? ` (${kitType})` : ""}
                      </Text>
                      {isReturned && (
                        <Chip
                          style={{
                            backgroundColor: isFullyReturned ? "#fee2e2" : "#fef3c7",
                            marginLeft: SPACING.xs,
                          }}
                          textStyle={{
                            color: isFullyReturned ? COLORS.error : "#d97706",
                            fontSize: 9,
                            fontWeight: "700",
                          }}
                        >
                          {isFullyReturned ? "FULLY RETURNED" : "PARTIALLY RETURNED"}
                        </Chip>
                      )}
                    </View>
                    <View style={styles.orderItemMeta}>
                      <Text
                        style={[
                          styles.orderItemQty,
                          isReturned && { color: COLORS.error, fontWeight: "700" },
                        ]}
                      >
                        Qty: {qty}
                        {isReturned ? ` (${returnedQty} returned)` : ""}
                      </Text>
                      <Text style={styles.orderItemPrice}>
                        {formatPrice(unitPrice)}
                      </Text>
                      <Text style={styles.orderItemTotal}>
                        Total: {formatPrice(unitPrice * qty)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Refund / cancellation note */}
          {isCancelled && (
            <View style={styles.returnsBanner}>
              <MaterialCommunityIcons name="close-circle" size={14} color={COLORS.error} />
              <Text style={[styles.returnsText, { color: COLORS.error }]}>
                Order Cancelled — Full Refund
              </Text>
            </View>
          )}
          {hasReturns && !isCancelled && refundInfo?.total != null && (
            <View style={styles.returnsBanner}>
              <MaterialCommunityIcons name="refresh" size={14} color="#d97706" />
              <Text style={styles.returnsText}>
                Refund: ₹{refundInfo.total.toLocaleString("en-IN")}
              </Text>
            </View>
          )}

          {/* Invoice download — only for completed / canceled orders */}
          {canDownloadInvoice && (
            <Button
              mode="outlined"
              icon={downloading ? undefined : "file-pdf-box"}
              textColor={COLORS.primary}
              style={styles.invoiceBtn}
              loading={downloading}
              disabled={downloading}
              onPress={handleDownloadInvoice}
              compact
            >
              {downloading ? "Downloading..." : "Download Invoice"}
            </Button>
          )}
        </>
      )}
    </Surface>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } =
    useGetData<OrdersResponse>(["orders"], endpoints.orders, {
      staleTime: 30_000,
    });

  const orders = data?.list || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <Appbar.Header style={styles.appBar} elevated statusBarHeight={insets.top}>
        <Appbar.Content title="My Orders" titleStyle={styles.headerTitle} />
        <Appbar.Action
          icon="refresh"
          onPress={refetch}
          disabled={isRefetching}
        />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="receipt-outline"
                size={80}
                color={COLORS.border}
              />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                Place your first order from the shop
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appBar: {
    height: 65,
    backgroundColor: COLORS.surface,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.primaryDark },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: SPACING.md, paddingBottom: 80 },
  orderCard: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    overflow: "hidden",
    padding: SPACING.md,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderHeaderLeft: { flex: 1 },
  orderId: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  orderDate: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  orderHeaderRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  totalCol: { alignItems: "flex-end" },
  orderTotal: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
  },
  orderTotalCancelled: {
    textDecorationLine: "line-through",
    color: COLORS.disabled,
    fontWeight: "400",
  },
  cancelledTotal: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    fontWeight: "700",
  },
  refundText: {
    fontSize: FONT_SIZE.xs,
    color: "#d97706",
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    flexWrap: "wrap",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  itemsHeaderText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  itemsTotalText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  noItemsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    paddingVertical: SPACING.sm,
  },
  orderItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderItemReturned: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    paddingLeft: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  orderItemTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: 4,
  },
  orderItemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },
  orderItemMeta: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  orderItemQty: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  orderItemPrice: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  orderItemTotal: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  returnsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#fff8e1",
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    marginTop: SPACING.xs,
  },
  returnsText: {
    fontSize: FONT_SIZE.xs,
    color: "#d97706",
    flex: 1,
  },
  invoiceBtn: {
    marginTop: SPACING.sm,
    borderColor: COLORS.primary,
    alignSelf: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: SPACING.sm,
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
});
