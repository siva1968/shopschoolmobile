import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";
import {
    documentDirectory,
    EncodingType,
    writeAsStringAsync,
} from "expo-file-system/legacy";
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
import { SafeAreaView } from "react-native-safe-area-context";
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
  processing: COLORS.info,
  shipped: COLORS.primary,
  delivered: COLORS.success,
  cancelled: COLORS.error,
  completed: COLORS.success,
};

function StatusChip({ status }: { status?: string }) {
  const color = STATUS_COLORS[status?.toLowerCase() || ""] || COLORS.textSecondary;
  return (
    <Chip
      style={{ backgroundColor: `${color}22`, alignSelf: "flex-start" }}
      textStyle={{ color, fontSize: FONT_SIZE.xs, fontWeight: "700" }}
    >
      {(status || "Unknown").toUpperCase()}
    </Chip>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const total =
    order.metadata?.total ||
    order.cart?.order?.total ||
    0;

  const createdAt = order.created_at
    ? format(new Date(order.created_at), "dd MMM yyyy")
    : "";

  // custom_items is the canonical display source:
  //   - kit orders: contains the single KitCustomItem aggregate
  //   - uniform/book orders: same line items as `items` (with returned_quantity added)
  // Using custom_items first avoids duplicating items when both arrays are populated.
  const allItems = order.custom_items?.length
    ? order.custom_items
    : (order.items || []);

  const handleDownloadInvoice = useCallback(async () => {
    if (!order.order_attributes?.invoice_id) {
      toast.info("Invoice not yet available.");
      return;
    }
    setDownloading(true);
    try {
      const res = await apiPatch<{ invoice?: string }>(
        endpoints.order(order.id),
        {}
      );
      const base64Pdf = res.invoice;
      if (!base64Pdf) {
        toast.info("Invoice not available yet.");
        return;
      }
      const fileName = `invoice_${order.display_id || order.id}.pdf`;
      const fileUri = `${documentDirectory}${fileName}`;
      await writeAsStringAsync(fileUri, base64Pdf, {
        encoding: EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice #${order.display_id}`,
        });
      } else {
        toast.info("Sharing not available on this device.");
      }
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
          <Text style={styles.orderTotal}>{formatPrice(total)}</Text>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* Status chips */}
      <View style={styles.statusRow}>
        {order.order_attributes?.books_status && (
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Books</Text>
            <StatusChip status={order.order_attributes.books_status} />
          </View>
        )}
        {order.order_attributes?.uniform_status && (
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Uniform</Text>
            <StatusChip status={order.order_attributes.uniform_status} />
          </View>
        )}
        {!order.order_attributes?.books_status &&
          !order.order_attributes?.uniform_status && (
            <StatusChip status={order.status} />
          )}
      </View>

      {/* Expanded items */}
      {expanded && (
        <>
          <Divider style={{ marginVertical: SPACING.sm }} />
          {allItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemIcon}>
                <MaterialCommunityIcons
                  name={
                    item.item_type === "uniform"
                      ? "tshirt-crew-outline"
                      : "book-open-variant"
                  }
                  size={18}
                  color={
                    item.item_type === "uniform"
                      ? COLORS.secondary
                      : COLORS.primary
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderItemTitle} numberOfLines={1}>
                  {item.product_title || "Item"}
                </Text>
                {item.variant_title &&
                  item.variant_title !== "Default Variant" && (
                    <Text style={styles.orderItemVariant}>
                      {item.variant_title}
                    </Text>
                  )}
                <Text style={styles.orderItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatPrice(
                  item.subtotal || item.unit_price * item.quantity
                )}
              </Text>
            </View>
          ))}

          {/* Returns info */}
          {order.has_returns && (
            <View style={styles.returnsBanner}>
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                color={COLORS.warning}
              />
              <Text style={styles.returnsText}>
                Return requested
                {order.refund_info ? `: ${order.refund_info}` : ""}
              </Text>
            </View>
          )}

          {/* Download invoice */}
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
        </>
      )}
    </Surface>
  );
}

export default function OrdersScreen() {
  const { data, isLoading, refetch, isRefetching } =
    useGetData<OrdersResponse>(["orders"], endpoints.orders, {
      staleTime: 30_000,
    });

  const orders = data?.list || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Appbar.Header style={styles.appBar} elevated>
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
  appBar: { backgroundColor: COLORS.surface },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: "700" },
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
    alignItems: "center",
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
    alignItems: "center",
    gap: SPACING.xs,
  },
  orderTotal: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statusRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: "wrap",
  },
  statusItem: { alignItems: "flex-start" },
  statusLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  orderItemIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  orderItemVariant: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  orderItemQty: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  orderItemPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    color: COLORS.warning,
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
