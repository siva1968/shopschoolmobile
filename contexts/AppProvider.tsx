import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { PortalProvider } from "./PortalContext";
import { ShopProvider } from "./ShopContext";
import { ToastProvider } from "./ToastContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <PortalProvider>
            <ShopProvider>
              <CartProvider>{children}</CartProvider>
            </ShopProvider>
          </PortalProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
