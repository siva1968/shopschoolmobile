import { useSnackbar } from '@/contexts/SnackbarContext';
import { colors, spacing, typography } from '@/theme/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface InventoryLocationLevel {
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
}

interface InventoryItem {
  id: string;
  location_levels: InventoryLocationLevel[];
}

interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
}

interface CartData {
  id: string;
  items: CartItem[];
}

interface AddToCartButtonProps {
  variant_id: string;
  quantity?: number;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function AddToCartButton({
  variant_id,
  quantity = 1,
  disabled = false,
  size = 'medium',
  style,
  onSuccess,
  onError,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [stockAvailable, setStockAvailable] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);
  const snackbar = useSnackbar();

  // Mock functions - replace with actual API calls
  const checkInventory = async (variantId: string): Promise<InventoryItem | null> => {
    // Mock implementation - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: variantId,
          location_levels: [{
            id: '1',
            location_id: 'loc1',
            metadata: null,
            inventory_item_id: variantId,
            raw_stocked_quantity: { value: '10', precision: 0 },
            raw_reserved_quantity: { value: '0', precision: 0 },
            raw_incoming_quantity: { value: '0', precision: 0 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
            available_quantity: 10,
            stocked_quantity: 10,
            reserved_quantity: 0,
            incoming_quantity: 0,
          }]
        });
      }, 500);
    });
  };

  const addToCart = async (variantId: string, qty: number): Promise<CartData | null> => {
    // Mock implementation - replace with actual API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate for demo
          resolve({
            id: 'cart1',
            items: [{
              id: 'item1',
              variant_id: variantId,
              quantity: qty,
            }]
          });
        } else {
          reject(new Error('Failed to add item to cart'));
        }
      }, 800);
    });
  };

  const validateStockAvailability = (inventory: InventoryItem, requestedQty: number): boolean => {
    if (!inventory || !inventory.location_levels) return false;
    
    const totalAvailable = inventory.location_levels.reduce(
      (sum, level) => sum + level.available_quantity, 
      0
    );
    
    return totalAvailable >= requestedQty;
  };

  useEffect(() => {
    const checkStock = async () => {
      if (!variant_id) return;
      
      setCheckingStock(true);
      try {
        const inventory = await checkInventory(variant_id);
        if (inventory) {
          const isAvailable = validateStockAvailability(inventory, quantity);
          setStockAvailable(isAvailable);
        } else {
          setStockAvailable(false);
        }
      } catch (error) {
        console.error('Error checking stock:', error);
        setStockAvailable(false);
      } finally {
        setCheckingStock(false);
      }
    };

    checkStock();
  }, [variant_id, quantity]);

  const handleAddToCart = async () => {
    if (!variant_id || !stockAvailable) return;

    setLoading(true);
    try {
      const result = await addToCart(variant_id, quantity);
      
      if (result) {
        snackbar.success('Item added to cart successfully!');
        onSuccess?.();
        
        // Optional: Navigate to cart
        // router.push('/cart');
      } else {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      snackbar.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getButtonMode = (): 'contained' | 'outlined' | 'text' => {
    if (!stockAvailable) return 'outlined';
    return 'contained';
  };

  const getButtonText = (): string => {
    if (checkingStock) return 'Checking...';
    if (!stockAvailable) return 'Out of Stock';
    if (loading) return 'Adding...';
    return 'Add to Cart';
  };

  const isButtonDisabled = (): boolean => {
    return disabled || checkingStock || loading || !stockAvailable;
  };

  return (
    <View style={[styles.container, style]}>
      <Button
        mode={getButtonMode()}
        onPress={handleAddToCart}
        disabled={isButtonDisabled()}
        loading={loading}
        icon={!loading && !checkingStock ? 'cart-plus' : undefined}
        style={[
          styles.button,
          !stockAvailable && styles.outOfStockButton,
        ]}
        labelStyle={[
          styles.buttonLabel,
          !stockAvailable && styles.outOfStockLabel,
        ]}
      >
        {getButtonText()}
      </Button>
      
      {!stockAvailable && !checkingStock && (
        <Text style={styles.stockMessage} variant="bodySmall">
          This item is currently out of stock
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  button: {
    borderRadius: 8,
  },
  buttonLabel: {
    ...typography.button,
    fontWeight: '600',
  },
  outOfStockButton: {
    backgroundColor: colors.text.disabled,
    borderColor: colors.text.disabled,
  },
  outOfStockLabel: {
    color: colors.text.secondary,
  },
  stockMessage: {
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
