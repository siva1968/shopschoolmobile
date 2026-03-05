import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from "axios";
import { storage } from "./storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL ?? "https://api.shopschool.in";

const PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

// ─── Create axios instance ─────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-publishable-api-key": PUBLISHABLE_KEY,
  },
});

// ─── Request interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Convenience wrappers ─────────────────────────────────────────────────────
export const apiGet = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
) => api.get<T>(url, config).then((r) => r.data);

export const apiPost = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => api.post<T>(url, data, config).then((r) => r.data);

export const apiPatch = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => api.patch<T>(url, data, config).then((r) => r.data);

export const apiDelete = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
) => api.delete<T>(url, config).then((r) => r.data);

// ─── Auth calls ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: {
    student_enrollment_code: string;
    password: string;
    portal_id: string;
  }) =>
    api
      .post<{ token: string }>("/auth/customer/app-auth", body)
      .then((r) => r.data),

  logout: () => api.delete("/auth/session").catch(() => null),
};
