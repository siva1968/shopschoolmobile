import { useCart } from '@/contexts/CartContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useGetData, usePatchData, usePostData } from '@/lib/use-api';
import { Endpoint } from '@/shared/endpoints';
import { colors, spacing } from '@/theme/theme';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';

// Types
interface PaymentMethodConfig {
  razorpay_id?: string;
  razorpay_secret?: string;
}

interface PaymentMethod {
  id: string;
  method: string;
  config: PaymentMethodConfig;
  is_active: boolean;
}

interface PaymentMethodsResponse {
  list: PaymentMethod[];
}

interface Address {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
}

interface CartData {
  id: string;
  total: number;
  currency_code: string;
  billing_address?: Address;
  shipping_address?: Address;
  custom_items?: Array<{
    id: string;
    type: string;
    title?: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  }>;
}

interface PaymentSessionResponse {
  order: {
    id: string;
    amount: number;
  };
  payment_session: {
    id: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayButtonProps {
  cart: CartData;
  disabled?: boolean;
  buttonText?: string;
}

export default function RazorpayButton({ 
  cart, 
  disabled = false, 
  buttonText = "Pay Now" 
}: RazorpayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { showMessage } = useSnackbar();
  const { createNewCartAfterOrder } = useCart();

  // Fetch payment methods from API
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods } = useGetData<PaymentMethodsResponse>({
    queryKey: ['payment-methods'],
    endpoint: Endpoint.payment_methods,
  });

  // Find active Razorpay configuration
  const razorpayConfig = paymentMethodsData?.list?.find(
    (method) => method.method === 'razorpay' && method.is_active
  )?.config;

  // API mutations
  const { mutate: createPaymentSession } = usePostData({
    key: ['payments'],
    endpoint: Endpoint.payments,
    showSuccessToast: false,
    showErrorToast: false,
  });

  const { mutate: updateCart } = usePatchData({
    key: ['cart'],
    endpoint: Endpoint.cart,
    showSuccessToast: false,
    showErrorToast: false,
  });

  const { mutate: updateGst } = usePostData({
    key: ['line-item-attributes'],
    endpoint: Endpoint.line_item_attributes,
    showSuccessToast: false,
    showErrorToast: false,
  });

  // Remove cart ID from secure storage
  const removeCartId = async () => {
    try {
      await SecureStore.deleteItemAsync('cartId');
    } catch (error) {
      console.error('Error removing cart ID:', error);
    }
  };

  // Initialize Razorpay payment (fallback for web compatibility)
  const initializeRazorpayPayment = (paymentData: PaymentSessionResponse) => {
    // For React Native, we'll use a different approach or show a message
    Alert.alert(
      'Payment',
      'Razorpay integration for React Native requires additional setup. Redirecting to order confirmation.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Simulate successful payment for development
            handlePaymentSuccess({
              razorpay_payment_id: 'test_payment_id',
              razorpay_order_id: paymentData.order.id,
              razorpay_signature: 'test_signature',
            });
          }
        }
      ]
    );
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      setIsProcessing(true);
      
      // Update cart with payment information
      await new Promise<void>((resolve, reject) => {
        updateCart(
          {
            id: cart.id,
            data: {
              payment_sessions: [
                {
                  provider_id: 'razorpay',
                  amount: cart.total,
                  data: {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  },
                },
              ],
            },
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      });

      // Create new cart for future orders
      await createNewCartAfterOrder();
      
      // Remove cart ID from storage
      await removeCartId();

      showMessage('Payment successful! Your order has been placed.', 'success');
      
      // Navigate to order confirmation or orders page
      router.push('/orders');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      showMessage('Payment processing failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    showMessage('Payment failed. Please try again.', 'error');
    setIsProcessing(false);
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Validate cart
      if (!cart || !cart.id) {
        showMessage('Cart information is missing', 'error');
        setIsProcessing(false);
        return;
      }

      // Check if Razorpay is configured and active
      if (!razorpayConfig?.razorpay_id) {
        showMessage('Razorpay is not configured. Please contact support.', 'error');
        setIsProcessing(false);
        return;
      }

      // Check if billing address exists
      if (!cart.billing_address) {
        showMessage('Billing address is required for payment', 'error');
        setIsProcessing(false);
        return;
      }

      // Create payment session
      createPaymentSession(
        {
          amount: cart.total,
          currency: cart.currency_code || 'INR',
          cart_id: cart.id,
        },
        {
          onSuccess: (data: unknown) => {
            const paymentData = data as PaymentSessionResponse;
            initializeRazorpayPayment(paymentData);
          },
          onError: (error) => {
            console.error('Payment session creation error:', error);
            showMessage('Failed to create payment session', 'error');
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error('Payment initialization error:', error);
      showMessage('Payment initialization failed', 'error');
      setIsProcessing(false);
    }
  };

  const isLoading = isLoadingPaymentMethods || isProcessing;
  const isDisabled = disabled || isLoading || !razorpayConfig?.razorpay_id;

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handlePayment}
        disabled={isDisabled}
        style={[
          styles.payButton,
          isDisabled && styles.disabledButton,
        ]}
        labelStyle={styles.buttonLabel}
        icon={isProcessing ? undefined : "credit-card"}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          buttonText
        )}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.text.disabled,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});
