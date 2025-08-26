import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { PortalProvider } from './PortalContext';
import { ShopProvider } from './ShopContext';
import { SnackbarProvider } from './SnackbarContext';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AuthProvider>
          <PortalProvider>
            <ShopProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </ShopProvider>
          </PortalProvider>
        </AuthProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
};
