import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {

    Chip,
    Searchbar,
    Surface,
    Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../../components/common/Loader";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { usePortal } from "../../../contexts/PortalContext";
import { useShop } from "../../../contexts/ShopContext";
import { formatPrice } from "../../../lib/auth-utils";
import { useGetData } from "../../../lib/use-api";
import { endpoints } from "../../../shared/endpoints";
import { Kit, Product } from "../../../shared/types";

type TabValue = "all" | "kits" | "uniforms";

interface ListResponse {
  list: Product[];
  count?: number;
}

interface KitListResponse {
  list: Kit[];
  count?: number;
}

function ShopHeader() {
  const { portal } = usePortal();
  const logoSrc = portal?.logo
    ? portal.logo.startsWith("data:") || portal.logo.startsWith("http")
      ? portal.logo
      : `data:image/jpeg;base64,${portal.logo}`
    : null;

  return (
    <View style={styles.appBar}>
      {logoSrc && (
        <Image
          source={{ uri: logoSrc }}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      )}
      <Text style={styles.headerTitle}>Shopschool</Text>
    </View>
  );
}

function StudentBanner() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Surface style={styles.studentBanner} elevation={0}>
      <View style={styles.studentRow}>
        <MaterialCommunityIcons
          name="account-school"
          size={18}
          color={COLORS.primary}
        />
        <Text style={styles.studentText} numberOfLines={1}>
          {user.student_name || `${user.first_name} ${user.last_name}`.trim()} —{" "}
          {user.class?.name || ""}{" "}
          {user.section?.name ? `| ${user.section.name}` : ""}
        </Text>
      </View>
    </Surface>
  );
}

interface ProductCardProps {
  item: Product | Kit;
  type: "kit" | "uniform";
  productId: string;
}

// Resolve image src: handles base64, data URIs, and plain URLs
function resolveImageSrc(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  // Assume base64
  return `data:image/jpeg;base64,${raw}`;
}

function ProductCard({ item, type, productId }: ProductCardProps) {
  const isKit = type === "kit";

  const handlePress = () => {
    router.push(`/(tabs)/shop/${productId}/${isKit ? "kit" : "uniform"}`);
  };

  let displayPrice = 0;
  let subtitle = "";
  let imageSrc: string | null = null;

  if (isKit) {
    const kit = item as Kit;
    displayPrice = kit.price ?? 0;
    const count = kit.products?.length ?? 0;
    subtitle = `${count} item${count !== 1 ? "s" : ""}`;
    imageSrc = resolveImageSrc(kit.image_url);
  } else {
    const product = item as Product;
    const prices = product.variants
      ?.flatMap((v) => v.prices.map((p) => p.amount))
      .filter((a) => a > 0) ?? [];
    displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const count = product.variants?.length ?? 0;
    subtitle = `${count} size${count !== 1 ? "s" : ""} available`;
    imageSrc =
      resolveImageSrc(product.image_url) ||
      resolveImageSrc(product.thumbnail) ||
      resolveImageSrc(product.images?.[0]?.url) ||
      null;
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Surface style={styles.card} elevation={1}>
        {/* Card image / icon — full-width on top */}
        <View
          style={[
            styles.cardImageArea,
            !imageSrc && { backgroundColor: isKit ? "#e6f4fc" : "#fce4ec" },
          ]}
        >
          {imageSrc ? (
            <Image
              source={{ uri: imageSrc }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons
              name={isKit ? "book-open-variant" : "tshirt-crew-outline"}
              size={48}
              color={isKit ? COLORS.primary : COLORS.secondary}
            />
          )}
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {subtitle.length > 0 && (
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          )}
          {displayPrice > 0 ? (
            <Text style={styles.cardPrice}>
              {isKit ? formatPrice(displayPrice) : `From ${formatPrice(displayPrice)}`}
            </Text>
          ) : (
            <Text style={[styles.cardPrice, { color: COLORS.success }]}>
              Free
            </Text>
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

export default function ShopScreen() {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useShop();

  const {
    data: uniformsData,
    isLoading: uniformsLoading,
    refetch: refetchUniforms,
    isRefetching: isRefetchingUniforms,
  } = useGetData<ListResponse>(["uniforms"], endpoints.uniforms, { staleTime: 60_000 });

  const {
    data: kitsData,
    isLoading: kitsLoading,
    refetch: refetchKits,
    isRefetching: isRefetchingKits,
  } = useGetData<KitListResponse>(["kits"], endpoints.kits, { staleTime: 60_000 });

  const isLoading = uniformsLoading || kitsLoading;
  const isRefetching = isRefetchingUniforms || isRefetchingKits;
  const refetch = () => { refetchUniforms(); refetchKits(); };

  // Flatten all kits and uniforms for display
  const { allKits, allUniforms } = useMemo(() => {
    const kits = (kitsData?.list || []).map((k) => ({ item: k as Kit, productId: k.id }));
    const uniforms = (uniformsData?.list || []).map((p) => ({ item: p as Product, productId: p.id }));
    return { allKits: kits, allUniforms: uniforms };
  }, [uniformsData, kitsData]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const kitItems = allKits.filter(({ item }) =>
      item.title.toLowerCase().includes(q)
    );
    const uniformItems = allUniforms.filter(({ item }) =>
      item.title.toLowerCase().includes(q)
    );
    if (activeTab === "kits") return { kits: kitItems, uniforms: [] };
    if (activeTab === "uniforms") return { kits: [], uniforms: uniformItems };
    return { kits: kitItems, uniforms: uniformItems };
  }, [allKits, allUniforms, searchQuery, activeTab]);

  type FlatItem =
    | { type: "kit"; item: Kit; productId: string }
    | { type: "uniform"; item: Product; productId: string }
    | { type: "sectionHeader"; title: string };

  const listData: FlatItem[] = useMemo(() => {
    const result: FlatItem[] = [];
    if (filtered.kits.length > 0) {
      if (activeTab === "all")
        result.push({ type: "sectionHeader", title: "Book & Stationery Kits" });
      filtered.kits.forEach(({ item, productId }) =>
        result.push({ type: "kit", item, productId })
      );
    }
    if (filtered.uniforms.length > 0) {
      if (activeTab === "all")
        result.push({ type: "sectionHeader", title: "School Uniforms" });
      filtered.uniforms.forEach(({ item, productId }) =>
        result.push({ type: "uniform", item, productId })
      );
    }
    return result;
  }, [filtered, activeTab]);

  const tabs: { label: string; value: TabValue }[] = [
    { label: "All", value: "all" },
    { label: "Kits", value: "kits" },
    { label: "Uniforms", value: "uniforms" },
  ];

  if (isLoading) {
    return (
      <>
        <ShopHeader />
        <Loader full message="Loading products..." />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ShopHeader />
      <StudentBanner />

      {/* Search + Filters */}
      <View style={styles.searchArea}>
        <Searchbar
          placeholder="Search kits or uniforms..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        <View style={styles.chipRow}>
          {tabs.map((tab) => (
            <Chip
              key={tab.value}
              selected={activeTab === tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[
                styles.filterChip,
                activeTab === tab.value && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                activeTab === tab.value && styles.filterChipTextSelected,
              ]}
            >
              {tab.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Product list */}
      <FlatList
        data={listData}
        keyExtractor={(item, i) => {
          if (item.type === "sectionHeader") return `header-${item.title}`;
          return `${item.type}-${item.productId}-${i}`;
        }}
        renderItem={({ item }) => {
          if (item.type === "sectionHeader") {
            return (
              <Text style={styles.sectionHeader}>{item.title}</Text>
            );
          }
          return (
            <View style={styles.cardWrapper}>
              <ProductCard
                item={item.item}
                type={item.type}
                productId={item.productId}
              />
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={60}
              color={COLORS.border}
            />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appBar: {
    height: 36,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  headerLogo: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
  },
  studentBanner: {
    backgroundColor: "#e6f4fc",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  studentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "500",
    flex: 1,
  },
  searchArea: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchbar: {
    backgroundColor: COLORS.background,
    elevation: 0,
    borderRadius: RADIUS.md,
    height: 44,
  },
  searchInput: {
    fontSize: FONT_SIZE.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipSelected: {
    backgroundColor: COLORS.chip,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  filterChipTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardWrapper: {
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: "column",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  cardImageArea: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  kitTypeBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  kitTypeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
    color: COLORS.primary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});
