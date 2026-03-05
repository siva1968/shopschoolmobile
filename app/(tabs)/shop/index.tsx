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
    Appbar,
    Badge,
    Chip,
    Searchbar,
    Surface,
    Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../../components/common/Loader";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../../constants/theme";
import { useAuth } from "../../../contexts/AuthContext";
import { useCart } from "../../../contexts/CartContext";
import { usePortal } from "../../../contexts/PortalContext";
import { useShop } from "../../../contexts/ShopContext";
import { formatPrice } from "../../../lib/auth-utils";
import { useGetData } from "../../../lib/use-api";
import { endpoints } from "../../../shared/endpoints";
import { Category, Kit, Uniform } from "../../../shared/types";

type TabValue = "all" | "kits" | "uniforms";

interface CategoryWithProducts extends Category {
  kits?: Kit[];
  uniforms?: Uniform[];
}

interface CategoriesResponse {
  product_categories: CategoryWithProducts[];
}

function ShopHeader() {
  const { user, logout } = useAuth();
  const { cartItemCount } = useCart();
  const { portal } = usePortal();

  return (
    <Appbar.Header style={styles.appBar} elevated>
      {portal?.logo ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${portal.logo}` }}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      ) : (
        <Appbar.Content
          title={portal?.school_name || "ShopSchool"}
          titleStyle={styles.headerTitle}
        />
      )}
      {portal?.logo && (
        <Appbar.Content
          title={portal?.school_name || "ShopSchool"}
          titleStyle={styles.headerTitle}
        />
      )}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <MaterialCommunityIcons
            name="cart-outline"
            size={26}
            color={COLORS.textPrimary}
          />
          {cartItemCount > 0 && (
            <Badge size={16} style={styles.cartBadge}>
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </Badge>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/account")}
          style={styles.avatarBtn}
        >
          <MaterialCommunityIcons
            name="account-circle"
            size={30}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>
    </Appbar.Header>
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
  item: Kit | Uniform;
  type: "kit" | "uniform";
  categoryId: string;
}

function ProductCard({ item, type, categoryId }: ProductCardProps) {
  const kit = item as Kit;
  const isKit = type === "kit";

  const handlePress = () => {
    router.push(`/(tabs)/shop/${categoryId}/${isKit ? "kit" : "uniform"}`);
  };

  const price = isKit ? kit.total : undefined;
  const isFree = isKit && kit.type === "free";

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Surface style={styles.card} elevation={1}>
        {/* Card image / icon */}
        <View
          style={[
            styles.cardImageArea,
            { backgroundColor: isKit ? "#e6f4fc" : "#fce4ec" },
          ]}
        >
          <MaterialCommunityIcons
            name={isKit ? "book-open-variant" : "tshirt-crew-outline"}
            size={42}
            color={isKit ? COLORS.primary : COLORS.secondary}
          />
          {isKit && (
            <View style={styles.kitTypeBadge}>
              <Text
                style={[
                  styles.kitTypeText,
                  { color: isFree ? COLORS.success : COLORS.primary },
                ]}
              >
                {isFree ? "FREE" : "BUNDLE"}
              </Text>
            </View>
          )}
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {isKit && (
            <Text style={styles.cardSubtitle}>
              {kit.products?.length || 0} items
            </Text>
          )}
          {price !== undefined && price > 0 && (
            <Text style={styles.cardPrice}>{formatPrice(price)}</Text>
          )}
          {isFree && price === 0 && (
            <Text style={[styles.cardPrice, { color: COLORS.success }]}>
              Free
            </Text>
          )}
        </View>

        <View style={styles.cardAction}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={COLORS.textSecondary}
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

export default function ShopScreen() {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useShop();

  const { data, isLoading, refetch, isRefetching } =
    useGetData<CategoriesResponse>(
      ["categories"],
      endpoints.categories,
      { staleTime: 60_000 }
    );

  const categories = data?.product_categories || [];

  // Flatten all kits and uniforms for display
  const { allKits, allUniforms } = useMemo(() => {
    const kits: { item: Kit; categoryId: string }[] = [];
    const uniforms: { item: Uniform; categoryId: string }[] = [];
    categories.forEach((cat) => {
      cat.kits?.forEach((k) => kits.push({ item: k, categoryId: cat.id }));
      cat.uniforms?.forEach((u) =>
        uniforms.push({ item: u, categoryId: cat.id })
      );
    });
    return { allKits: kits, allUniforms: uniforms };
  }, [categories]);

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
    | { type: "kit"; item: Kit; categoryId: string }
    | { type: "uniform"; item: Uniform; categoryId: string }
    | { type: "sectionHeader"; title: string };

  const listData: FlatItem[] = useMemo(() => {
    const result: FlatItem[] = [];
    if (filtered.kits.length > 0) {
      if (activeTab === "all")
        result.push({ type: "sectionHeader", title: "Book & Stationery Kits" });
      filtered.kits.forEach(({ item, categoryId }) =>
        result.push({ type: "kit", item, categoryId })
      );
    }
    if (filtered.uniforms.length > 0) {
      if (activeTab === "all")
        result.push({ type: "sectionHeader", title: "School Uniforms" });
      filtered.uniforms.forEach(({ item, categoryId }) =>
        result.push({ type: "uniform", item, categoryId })
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
          return `${item.type}-${item.categoryId}-${i}`;
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
                categoryId={item.categoryId}
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
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginLeft: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  cartBtn: { position: "relative", padding: 6 },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.secondary,
  },
  avatarBtn: { padding: 4 },
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  cardImageArea: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
    flex: 1,
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
  cardAction: {
    paddingRight: SPACING.sm,
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
