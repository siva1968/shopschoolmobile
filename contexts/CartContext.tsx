import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { api, apiGet, apiPost } from "../lib/sdk";
import { asyncStore } from "../lib/storage";
import { endpoints } from "../shared/endpoints";
import { CartData } from "../shared/types";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface CartContextValue {
  cartId: string | null;
  cartData: CartData | null;
  cartLoading: boolean;
  cartItemCount: number;
  showCartDrawer: boolean;
  setShowCartDrawer: (v: boolean) => void;
  fetchCart: () => Promise<void>;
  createCart: () => Promise<string | null>;
  clearCart: () => Promise<void>;
  handleInvalidCart: () => Promise<void>;
  hasAddresses: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();

  const cartItemCount =
    (cartData?.custom_items?.length ?? 0) + (cartData?.items?.length ?? 0);

  const hasAddresses = !!(
    user?.addresses && user.addresses.length > 0
  );

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    setCartLoading(true);
    try {
      const data = await apiGet<{ cart: CartData }>(endpoints.cart(cartId));
      const cart = data.cart;
      // If cart was completed, reset
      if (cart.completed_at) {
        await asyncStore.deleteCartId();
        setCartId(null);
        setCartData(null);
        return;
      }
      setCartData(cart);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        await asyncStore.deleteCartId();
        setCartId(null);
        setCartData(null);
      }
    } finally {
      setCartLoading(false);
    }
  }, [cartId]);

  const createCart = useCallback(async (): Promise<string | null> => {
    try {
      // Find Indian region
      const regionsRes = await apiGet<{ regions: { id: string; countries: { iso_2: string }[] }[] }>(
        endpoints.regions
      );
      const indianRegion = regionsRes.regions?.find((r) =>
        r.countries?.some((c) => c.iso_2 === "in")
      );
      if (!indianRegion) {
        toast.error("Could not find region. Please try again.");
        return null;
      }
      const cartRes = await apiPost<{ cart: CartData }>(endpoints.carts, {
        region_id: indianRegion.id,
      });
      const newCartId = cartRes.cart.id;
      await asyncStore.setCartId(newCartId);
      setCartId(newCartId);
      setCartData(cartRes.cart);
      return newCartId;
    } catch {
      toast.error("Failed to create cart.");
      return null;
    }
  }, [toast]);

  const clearCart = useCallback(async () => {
    if (!cartId) return;
    try {
      await api.post(endpoints.cartClear(cartId));
      await fetchCart();
    } catch {
      toast.error("Failed to clear cart.");
    }
  }, [cartId, fetchCart, toast]);

  const handleInvalidCart = useCallback(async () => {
    await asyncStore.deleteCartId();
    setCartId(null);
    setCartData(null);
    await createCart();
  }, [createCart]);

  // Initialize cart on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setCartId(null);
      setCartData(null);
      return;
    }
    (async () => {
      const saved = await asyncStore.getCartId();
      if (saved) {
        setCartId(saved);
      } else {
        await createCart();
      }
    })();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch cart data whenever cartId changes
  useEffect(() => {
    if (cartId) fetchCart();
  }, [cartId, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartId,
        cartData,
        cartLoading,
        cartItemCount,
        showCartDrawer,
        setShowCartDrawer,
        fetchCart,
        createCart,
        clearCart,
        handleInvalidCart,
        hasAddresses,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
