import { decode } from "@/lib/auth-utils";
import { sdk } from "@/lib/sdk";
import { Route } from "@/shared/types";
import { CommonActions } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSnackbar } from "./SnackbarContext";


interface User {
  actor_id?: string;
  actor_type?: string;
  exp?: number;
  iat?: number;
  // Customer data from API
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  student_enrollment_code?: string;
  student_name?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: {
    student_enrollment_code: string;
    password: string;
    portal_id: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  fetchCustomerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const snackbar = useSnackbar();

  const checkAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        const decodedUser = decode(token);
        if (decodedUser) {
          setUser(decodedUser);
          setIsAuthenticated(true);
          console.log('User authenticated:', decodedUser);
          // Fetch customer data after successful auth check
          const customer = await fetchCustomerData();
        } else {
          // Invalid token
          await clearAuth();
        }
      } else {
        await clearAuth();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, [checkAuth]);

  const clearAuth = async () => {
    setUser(null);
    setIsAuthenticated(false);

    // Clear all possible auth-related items
    try {
      await SecureStore.deleteItemAsync("auth_token");
    } catch (error) {
      console.log("Failed to delete auth_token:", error);
    }

    try {
      await SecureStore.deleteItemAsync("_cart_id");
    } catch (error) {
      console.log("Failed to delete _cart_id:", error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      console.log('Fetching customer data...');
      const customerResponse = await sdk.store.customer.retrieve();
      console.log('Fetched customer data:', customerResponse);
      if (customerResponse) {
        // Merge customer data with existing user data
        setUser(prev => ({ ...prev, ...customerResponse }));
        setIsAuthenticated(true);
      } else {
        console.log('No customer data in response');
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      // If customer fetch fails, it might mean token is invalid
      // Don't clear auth immediately, just log the error
    }
  };

  const login = async (credentials: {
    student_enrollment_code: string;
    password: string;
    portal_id: string;
  }) => {
    try {
      setIsLoading(true);

      const token = await sdk.auth.login("customer", "app-auth", {
        student_enrollment_code: credentials.student_enrollment_code,
        password: credentials.password,
        portal_id: credentials.portal_id,
      });

      // Handle token - it might be a string or an object
      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);

      // Store token securely
      await SecureStore.setItemAsync("auth_token", tokenString);

      // Decode and set user
      const decodedUser = decode(tokenString);
      if (decodedUser?.actor_id) {
        setUser(decodedUser);
        // Fetch customer data after successful login
        await fetchCustomerData();

        // Redirect to shop
        router.push(Route.shop as any);
        snackbar.success("Login successful!");
      } else {
        throw new Error("Invalid token received");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      snackbar.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const navigation = useNavigation();
      setIsLoading(true);
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("_cart_id");

      setUser(null);
      setIsAuthenticated(false);

      await sdk.auth.logout();
      router.replace("/");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "index" }], // root index
        })
      );
      snackbar.success("Logged out successfully!");
    } catch (error: unknown) {
      snackbar.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    fetchCustomerData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
