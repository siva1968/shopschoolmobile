import { useSnackbar } from '@/contexts/SnackbarContext';
import { useGetData } from '@/lib/use-api';
import { Endpoint } from '@/shared/endpoints';
import { colors, spacing, typography } from '@/theme/theme';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  RadioButton,
  Surface,
  Text
} from 'react-native-paper';
import RazorpayButton from './RazorpayButton';

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

interface PaymentMethodsProps {
  cart: CartData;
  disabled?: boolean;
}

export default function PaymentMethods({ cart, disabled = false }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const { showMessage } = useSnackbar();

  // Fetch payment methods from API
  const { data: paymentMethodsData, isLoading: isLoadingPaymentMethods, error } = useGetData<PaymentMethodsResponse>({
    queryKey: ['payment-methods'],
    endpoint: Endpoint.payment_methods,
  });

  // Filter active payment methods
  const activePaymentMethods = useMemo(() => {
    return paymentMethodsData?.list?.filter(method => method.is_active) || [];
  }, [paymentMethodsData?.list]);

  // Set default selected method when payment methods are loaded
  useEffect(() => {
    if (activePaymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(activePaymentMethods[0].method);
    }
  }, [activePaymentMethods, selectedMethod]);

  // Get display name for payment method
  const getMethodDisplayName = (method: string): string => {
    switch (method.toLowerCase()) {
      case 'razorpay':
        return 'Razorpay';
      case 'stripe':
        return 'Stripe';
      case 'paypal':
        return 'PayPal';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  // Render payment button based on selected method
  const renderPaymentButton = () => {
    if (!selectedMethod) return null;

    switch (selectedMethod.toLowerCase()) {
      case 'razorpay':
        return (
          <RazorpayButton 
            cart={cart} 
            disabled={disabled}
            buttonText="Place Order"
          />
        );
      // Add more payment methods here as needed
      default:
        return (
          <View style={styles.notImplemented}>
            <Text variant="bodyMedium" style={styles.notImplementedText}>
              Payment method "{getMethodDisplayName(selectedMethod)}" is not yet implemented.
            </Text>
          </View>
        );
    }
  };

  if (isLoadingPaymentMethods) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading payment methods...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <Surface style={[styles.errorContainer, styles.alertSurface]} elevation={1}>
        <Text variant="bodyMedium" style={styles.errorText}>
          Failed to load payment methods. Please try again.
        </Text>
      </Surface>
    );
  }

  if (activePaymentMethods.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Payment Method
        </Text>
        <Surface style={[styles.warningContainer, styles.alertSurface]} elevation={1}>
          <Text variant="bodyMedium" style={styles.warningText}>
            No payment methods are currently available. Please contact support.
          </Text>
        </Surface>
        <Text variant="bodySmall" style={styles.privacyText}>
          Your personal data will be used to process your order, support your experience throughout this app, and for other purposes described in our privacy policy.
        </Text>
        <Button
          mode="contained"
          disabled={true}
          style={styles.disabledButton}
          labelStyle={styles.buttonLabel}
        >
          Place Order
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Payment Method
      </Text>
      
      <View style={styles.methodsContainer}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Select a payment method
        </Text>
        
        <RadioButton.Group 
          onValueChange={setSelectedMethod} 
          value={selectedMethod}
        >
          {activePaymentMethods.map((method) => (
            <View key={method.id} style={styles.methodItem}>
              <RadioButton.Item
                label={getMethodDisplayName(method.method)}
                value={method.method}
                disabled={disabled}
                labelStyle={[
                  styles.methodLabel,
                  disabled && styles.disabledLabel,
                ]}
                style={styles.radioItem}
              />
            </View>
          ))}
        </RadioButton.Group>
      </View>

      <Text variant="bodySmall" style={styles.privacyText}>
        Your personal data will be used to process your order, support your experience throughout this app, and for other purposes described in our privacy policy.
      </Text>

      {renderPaymentButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  alertSurface: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
  },
  warningContainer: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    color: colors.warning,
  },
  methodsContainer: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
    ...typography.body2,
  },
  methodItem: {
    marginBottom: spacing.xs,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  methodLabel: {
    color: colors.text.primary,
    ...typography.body1,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  privacyText: {
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
    fontSize: 12,
  },
  notImplemented: {
    marginTop: spacing.md,
  },
  notImplementedText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: colors.text.disabled,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
