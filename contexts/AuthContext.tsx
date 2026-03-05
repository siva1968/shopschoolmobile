import { router } from "expo-router";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { decodeToken, isTokenValid } from "../lib/auth-utils";
import { api, apiGet, authApi } from "../lib/sdk";
import { asyncStore, storage } from "../lib/storage";
import { endpoints } from "../shared/endpoints";
import { User } from "../shared/types";
import { useToast } from "./ToastContext";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: {
    student_enrollment_code: string;
    password: string;
    portal_id: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchCustomerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchCustomerData = useCallback(async () => {
    const data = await apiGet<User>(endpoints.customer);
    setUser(data);
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await storage.getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const decoded = decodeToken(token);
      if (!decoded || !isTokenValid(decoded)) {
        await storage.deleteToken();
        setUser(null);
        return;
      }
      // Set token on axios instance
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      await fetchCustomerData();
    } catch {
      await storage.deleteToken();
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCustomerData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (params: {
      student_enrollment_code: string;
      password: string;
      portal_id: string;
    }) => {
      setIsLoading(true);
      try {
        // 1. Check student is active
        const studentRes = await apiGet<{ is_active: boolean }>(
          endpoints.student(params.student_enrollment_code)
        );
        if (!studentRes.is_active) {
          toast.error("Your enrollment code is inactive. Please contact school.");
          return;
        }

        // 2. Login
        const authRes = await authApi.login(params);
        const token = authRes.token;
        if (!token) throw new Error("No token received");

        // 3. Persist token
        await storage.setToken(token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // 4. Fetch customer (throws on failure — caught below)
        await fetchCustomerData();

        // 5. Navigation handled by index.tsx useEffect once isAuthenticated && !authLoading
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosErr?.response?.status;
        const msg =
          axiosErr?.response?.data?.message ??
          (status === 401 ? "Invalid credentials" : "Login failed");
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCustomerData, toast]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    await storage.deleteToken();
    await asyncStore.deleteCartId();
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    router.replace("/");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
        fetchCustomerData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
