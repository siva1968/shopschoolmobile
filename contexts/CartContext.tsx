import { useGetData, usePatchData, usePostData } from '@/lib/use-api';
import { Endpoint } from '@/shared/endpoints';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface Cart {
  id: string;
  completed_at: string | null;
  region_id: string;
}

interface Region {
  id: string;
  countries: Array<{ iso_2: string }>;
}

interface CartItem {
  id: string;
  variant_id?: string;
  quantity: number;
  product_id?: string;
  product_title: string;
  product_thumbnail?: string;
  variant_title?: string;
  title?: string;
  subtitle?: string;
  unit_price: number;
  subtotal: number;
  item_type?: string;
  class_kit_type?: string;
  cart_line_item_ids?: string[];
}

interface CartData {
  id: string;
  items: CartItem[];
  custom_items: CartItem[];
  total: number;
  subtotal?: number;
  tax_total?: number;
  shipping_total?: number;
  currency_code: string;
}

interface CartContextType {
  cartId: string;
  isInitializingCart: boolean;
  hasAddresses: boolean;
  addressMessage: string;
  cartData: CartData | null;
  setCartIdInStorage: (cartId: string) => void;
  clearCart: () => void;
  createNewCartAfterOrder: () => Promise<void>;
  handleInvalidCart: () => Promise<void>;
  checkAddressesBeforeCartAction: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartId, setCartId] = useState<string>("");
  const [isInitializingCart, setIsInitializingCart] = useState(false);

  // Fetch cart data
  const { data: cartData, refetch: refetchCart } = useGetData<CartData>({
    queryKey: ['cart', cartId],
    endpoint: cartId ? `${Endpoint.cart}/${cartId}` : '',
    enabled: !!cartId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });


  // Check if user has addresses
  const hasAddresses = Boolean(user?.addresses && Array.isArray(user.addresses) && user.addresses.length > 0);
  const addressMessage = hasAddresses ? "" : "No address found. Please add an address first.";

  // Get regions list
  const { data: regionsList } = useGetData({
    queryKey: ['regions'],
    endpoint: Endpoint.regions,
  });

  // API hook for cart creation
  const { mutate: createCart } = usePostData({
    key: ['create-cart'],
    endpoint: Endpoint.cart,
    showSuccessToast: false,
    showErrorToast: false,
    invalidateQueries: true
  });

  // API hook for cart update (region update)
  const { mutate: updateCart } = usePatchData({
    key: ['update-cart'],
    endpoint: Endpoint.cart,
    showSuccessToast: false,
    showErrorToast: false,
    invalidateQueries: true
  });

  // Helper function to set cart ID in SecureStore
  const setCartIdInStorage = useCallback(async (newCartId: string) => {
    try {
      await SecureStore.setItemAsync('cartId', newCartId);
      setCartId(newCartId);
    } catch (error) {
      console.error('Error saving cart ID to SecureStore:', error);
      setCartId(newCartId);
    }
  }, []);

  // Helper function to clear cart
  const clearCart = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('cartId');
    } catch (error) {
      console.error('Error clearing cart ID from SecureStore:', error);
    }
    setCartId("");
  }, []);

  // Helper function to find incomplete cart from user.carts
  const findIncompleteCart = useCallback((): Cart | null => {
    if (!user?.carts || !Array.isArray(user.carts)) return null;
    return user.carts.find((cart: Cart) => cart.completed_at === null) || null;
  }, [user]);

  // Helper function to check addresses before cart actions
  const checkAddressesBeforeCartAction = useCallback((): boolean => {
    return hasAddresses;
  }, [hasAddresses]);

  // Helper function to create a new cart (reusable method)
  const createNewCart = useCallback(async (): Promise<string | null> => {
    // Check if user has addresses before creating cart
    if (!hasAddresses) {
      return null;
    }

    if (!regionsList) return null;

    // Find Indian region
    const region = (regionsList as { regions: Region[] })?.regions?.find((region: Region) =>
      region.countries.some((country) => country?.iso_2 === "in")
    );

    if (!region) {
      console.error('Region not found for country code: in');
      return null;
    }

    return new Promise((resolve) => {
      createCart(
        { region_id: region.id },
        {
          onSuccess: (response: unknown) => {
            const cartResponse = response as { id: string };
            setCartIdInStorage(cartResponse.id);
            resolve(cartResponse.id);
          },
          onError: (error) => {
            console.error('Error creating cart:', error);
            resolve(null);
          }
        }
      );
    });
  }, [regionsList, createCart, setCartIdInStorage, hasAddresses]);

  // Method to create new cart after successful order placement
  const createNewCartAfterOrder = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;
    
    // Clear the old completed cart from cookies
    clearCart();
    
    // Create a new cart
    await createNewCart();
  }, [isAuthenticated, user, clearCart, createNewCart]);

  // Method to handle invalid/expired cart scenarios
  const handleInvalidCart = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return;
    
    // Clear the invalid cart from cookies
    clearCart();
    
    // Try to find an incomplete cart from user.carts first
    const incompleteCart = findIncompleteCart();
    
    if (incompleteCart) {
      setCartIdInStorage(incompleteCart.id);
    } else {
      // No incomplete cart found, create a new one
      await createNewCart();
    }
  }, [isAuthenticated, user, clearCart, findIncompleteCart, setCartIdInStorage, createNewCart]);

  // Method for session restoration - verify cart exists and is valid
  const validateAndRestoreCart = useCallback(async (storedCartId: string): Promise<boolean> => {
    if (!storedCartId || !isAuthenticated) return false;

    try {
      // We could add a cart validation API call here if needed
      // For now, we'll trust the cookie but this is where you'd verify
      // the cart still exists and is incomplete
      
      setCartId(storedCartId);
      return true;
    } catch (error) {
      console.error('Error validating stored cart:', error);
      // If validation fails, handle as invalid cart
      await handleInvalidCart();
      return false;
    }
  }, [isAuthenticated, handleInvalidCart]);

  // Initialize cart after login
  const initializeCart = useCallback(async () => {
    if (!isAuthenticated || !user || !regionsList || isInitializingCart) return;

    // Check if user has addresses before initializing cart
    if (!hasAddresses) {
      setIsInitializingCart(false);
      return;
    }

    setIsInitializingCart(true);

    try {
      // Find Indian region
      const region = (regionsList as { regions: Region[] })?.regions?.find((region: Region) =>
        region.countries.some((country) => country?.iso_2 === "in")
      );

      if (!region) {
        console.error('Region not found for country code: in');
        setIsInitializingCart(false);
        return;
      }

      // Check for existing cart ID in SecureStore
      const storedCartId = await SecureStore.getItemAsync('cartId');
      
      if (storedCartId) {
        // Verify if this cart still exists and is incomplete
        // For now, we'll trust the stored value and set it
        setCartId(storedCartId);
        setIsInitializingCart(false);
        return;
      }

      // Check for incomplete cart in user.carts
      const incompleteCart = findIncompleteCart();

      if (incompleteCart) {
        // Found incomplete cart, set it in state and SecureStore
        setCartIdInStorage(incompleteCart.id);

        // Check if region needs to be updated
        if (incompleteCart.region_id !== region.id) {
          updateCart(
            { id: incompleteCart.id, data: { region_id: region.id } },
            {
              onSuccess: () => {
                setIsInitializingCart(false);
              },
              onError: (error) => {
                console.error('Error updating cart region:', error);
                setIsInitializingCart(false);
              }
            }
          );
        } else {
          setIsInitializingCart(false);
        }
      } else {
        // No incomplete cart found, create a new one
        createCart(
          { region_id: region.id },
          {
            onSuccess: (response: unknown) => {
              const cartResponse = response as { id: string };
              setCartIdInStorage(cartResponse.id);
              console.log('New cart created successfully:', cartResponse.id);
              setIsInitializingCart(false);
            },
            onError: (error) => {
              console.error('Error creating cart:', error);
              setIsInitializingCart(false);
            }
          }
        );
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
      setIsInitializingCart(false);
    }
  }, [isAuthenticated, user, regionsList, isInitializingCart, updateCart, createCart, setCartIdInStorage, findIncompleteCart, hasAddresses]);

  // Load cart ID from SecureStore on mount and validate
  useEffect(() => {
    const loadCartId = async () => {
      try {
        const storedCartId = await SecureStore.getItemAsync('cartId');
        if (storedCartId && isAuthenticated) {
          // Validate and restore cart from session
          validateAndRestoreCart(storedCartId);
        } else if (storedCartId) {
          // Set cart ID but don't validate until user is authenticated
          setCartId(storedCartId);
        }
      } catch (error) {
        console.error('Error loading cart ID from SecureStore:', error);
      }
    };
    
    loadCartId();
  }, [isAuthenticated, validateAndRestoreCart]);

  // Initialize cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user && regionsList) {
      initializeCart();
    }
  }, [isAuthenticated, user, regionsList, initializeCart]);

  // Clear cart on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      clearCart();
    }
  }, [isAuthenticated, user, clearCart]);

  const value: CartContextType = {
    cartId,
    isInitializingCart,
    hasAddresses,
    addressMessage,
    cartData: cartData || null,
    setCartIdInStorage,
    clearCart,
    createNewCartAfterOrder,
    handleInvalidCart,
    checkAddressesBeforeCartAction,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
