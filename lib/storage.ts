import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  AUTH_TOKEN: "auth_token",
  CART_ID: "cart_id",
  PORTAL_NAME: "portal_name",
  PORTAL_ID: "portal_id",
} as const;

// ─── Secure Store (sensitive) ─────────────────────────────────────────────────
export const storage = {
  getToken: () => SecureStore.getItemAsync(KEYS.AUTH_TOKEN),
  setToken: (token: string) =>
    SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token),
  deleteToken: () => SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
};

// ─── AsyncStorage (non-sensitive) ─────────────────────────────────────────────
export const asyncStore = {
  getCartId: () => AsyncStorage.getItem(KEYS.CART_ID),
  setCartId: (id: string) => AsyncStorage.setItem(KEYS.CART_ID, id),
  deleteCartId: () => AsyncStorage.removeItem(KEYS.CART_ID),

  getPortalName: () => AsyncStorage.getItem(KEYS.PORTAL_NAME),
  setPortalName: (name: string) =>
    AsyncStorage.setItem(KEYS.PORTAL_NAME, name),

  getPortalId: () => AsyncStorage.getItem(KEYS.PORTAL_ID),
  setPortalId: (id: string) => AsyncStorage.setItem(KEYS.PORTAL_ID, id),
  deletePortalId: () => AsyncStorage.removeItem(KEYS.PORTAL_ID),
};
