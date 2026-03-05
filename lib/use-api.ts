import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiDelete, apiGet, apiPatch, apiPost } from "./sdk";

// ─── GET hook ─────────────────────────────────────────────────────────────────
export function useGetData<T>(
  key: (string | number | undefined)[],
  url: string,
  options?: {
    enabled?: boolean;
    params?: Record<string, unknown>;
    staleTime?: number;
  }
) {
  return useQuery<T, AxiosError>({
    queryKey: key,
    queryFn: () => apiGet<T>(url, { params: options?.params }),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 0,
  });
}

// ─── POST hook ────────────────────────────────────────────────────────────────
export function usePostData<TResponse = unknown, TBody = unknown>(
  url: string,
  options?: {
    invalidateKeys?: (string | number | undefined)[][];
    onSuccess?: (data: TResponse) => void;
    onError?: (error: AxiosError) => void;
  }
) {
  const queryClient = useQueryClient();
  return useMutation<TResponse, AxiosError, TBody>({
    mutationFn: (body) => apiPost<TResponse>(url, body),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// ─── PATCH hook ───────────────────────────────────────────────────────────────
export function usePatchData<TResponse = unknown, TBody = unknown>(
  url: string,
  options?: {
    invalidateKeys?: (string | number | undefined)[][];
    onSuccess?: (data: TResponse) => void;
    onError?: (error: AxiosError) => void;
  }
) {
  const queryClient = useQueryClient();
  return useMutation<TResponse, AxiosError, TBody>({
    mutationFn: (body) => apiPatch<TResponse>(url, body),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// ─── DELETE hook ──────────────────────────────────────────────────────────────
export function useDeleteData<TResponse = unknown>(
  url: string,
  options?: {
    invalidateKeys?: (string | number | undefined)[][];
    onSuccess?: (data: TResponse) => void;
    onError?: (error: AxiosError) => void;
  }
) {
  const queryClient = useQueryClient();
  return useMutation<TResponse, AxiosError, void>({
    mutationFn: () => apiDelete<TResponse>(url),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
