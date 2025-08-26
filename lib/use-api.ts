import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { sdk } from "./sdk";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { API_TYPE } from "@/shared";

// Define PaginatedResponse type for mobile app
interface PaginatedResponse<T> {
  data: T[];
  count: number;
  offset: number;
  limit: number;
}

// Mobile-optimized error handler
const useApiErrorHandler = () => {
  const snackbar = useSnackbar();
  const handledErrors = useRef(new Set<string>());

  const handleError = useCallback((error: unknown): void => {
    // Prevent duplicate error handling
    const errorKey = JSON.stringify(error);
    if (handledErrors.current.has(errorKey)) {
      return;
    }
    
    handledErrors.current.add(errorKey);
    
    // Clean up error tracking after 5 seconds
    setTimeout(() => {
      handledErrors.current.delete(errorKey);
    }, 5000);

    console.error("📱 Mobile API Error:", error);

    try {
      const errorObj = error && typeof error === 'object' ? error as Record<string, unknown> : {};
      const status = typeof errorObj.status === 'number' ? errorObj.status : 0;
      const message = typeof errorObj.message === 'string' ? errorObj.message : '';
      
      // Handle timeout errors
      if (message.includes('timeout')) {
        // Special handling for categories endpoint
        if ((error as any)?.endpoint?.includes('/store/categories')) {
          snackbar.error("Categories are loading slowly. Please wait or try refreshing.");
        } else {
          snackbar.error("Request timed out. Please check your connection and try again.");
        }
        return;
      }

      // Handle authentication errors
      if (status === 401 || message.includes("Unauthorized")) {
        snackbar.error("Session expired. Please sign in again.");
        
        // Clear auth and redirect to login
        SecureStore.deleteItemAsync("auth_token")
          .then(() => router.replace("/"))
          .catch(() => router.replace("/"));
        return;
      }

      // Handle other HTTP errors
      switch (status) {
        case 403:
          snackbar.error("Access denied.");
          break;
        case 404:
          snackbar.error("Resource not found.");
          break;
        case 500:
        case 502:
        case 503:
          snackbar.error("Server error. Please try again later.");
          break;
        case 0: // Network error
          snackbar.error("No internet connection. Please check your network.");
          break;
        default:
          snackbar.error(message || "Something went wrong. Please try again.");
      }
    } catch (handlerError) {
      console.error("Error handler failed:", handlerError);
      snackbar.error("An unexpected error occurred.");
    }
  }, [snackbar]);

  return { handleError };
};

// Helper function to get authorization headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    console.log('🔑 Token retrieval for headers:', { 
      hasToken: !!token, 
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'null'
    });
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    if (token) {
      headers.authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header added:', headers.authorization.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No auth token found in SecureStore');
    }
    
    return headers;
  } catch (error) {
    console.error("❌ Error getting auth token:", error);
    return { "Content-Type": "application/json" };
  }
};

// Mobile-optimized GET hook
export const useGetData = <T>(options: {
  endpoint: string;
  id?: string;
  params?: Record<string, unknown>;
  queryKey: (string | number | boolean)[];
  enabled?: boolean;
  showErrorToast?: boolean;
  staleTime?: number;
  gcTime?: number;
  timeout?: number;
}) => {
  const { handleError } = useApiErrorHandler();

  const fullEndpoint = options.id ? `${options.endpoint}/${options.id}` : options.endpoint;

  console.log('📱 GET Request initialized:', {
    endpoint: fullEndpoint,
    enabled: options.enabled ?? true,
    queryKey: options.queryKey,
    timeout: options.timeout
  });

  const queryResult = useQuery<T>({
    queryKey: options.queryKey,
    queryFn: async (): Promise<T> => {
      console.log('🚀 Executing GET:', fullEndpoint);
      
      // Create timeout promise with configurable timeout
      const timeoutMs = options.timeout ?? 15000; // Default 15 seconds for mobile
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs / 1000} seconds`));
        }, timeoutMs);
      });

      // Create fetch promise
      const headers = await getAuthHeaders();
      console.log('📤 GET Request headers:', {
        endpoint: fullEndpoint,
        headers: {
          ...headers,
          authorization: headers.authorization ? headers.authorization.substring(0, 20) + '...' : 'missing'
        }
      });
      
      const fetchPromise = sdk.client.fetch(fullEndpoint, {
        method: API_TYPE.GET,
        headers,
        query: options.params,
      });

      try {
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('✅ GET Success:', { endpoint: fullEndpoint, hasData: !!response });
        return response as T;
      } catch (error) {
        console.error('❌ GET Failed:', { endpoint: fullEndpoint, error });
        // Add endpoint info to error for better handling
        if (error instanceof Error) {
          (error as any).endpoint = fullEndpoint;
        }
        throw error;
      }
    },
    enabled: options.enabled ?? true,
    throwOnError: false,
    retry: (failureCount, error) => {
      const message = error instanceof Error ? error.message : '';
      
      // Don't retry timeouts for categories endpoints - they're consistently slow
      if (message.includes('timeout') && fullEndpoint.includes('/store/categories')) {
        console.log('⏰ Categories endpoint timeout - not retrying (backend performance issue)');
        return false;
      }
      
      // Don't retry timeouts or client errors for other endpoints
      if (message.includes('timeout') || (error as any)?.status >= 400 && (error as any)?.status < 500) {
        return false;
      }
      
      return failureCount < 2; // Max 2 retries for mobile
    },
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Mobile optimization
    refetchOnReconnect: true, // Good for mobile networks
  });

  // Handle errors
  useEffect(() => {
    if (queryResult.error && options.showErrorToast !== false) {
      handleError(queryResult.error);
    }
  }, [queryResult.error, options.showErrorToast, handleError]);

  return queryResult;
};

// Mobile-optimized POST hook
export const usePostData = <TResponse = unknown, TRequest = unknown>(options: {
  endpoint: string;
  queryKey?: (string | number)[];
  successMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  invalidateQueries?: boolean;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { handleError } = useApiErrorHandler();

  return useMutation<TResponse, unknown, TRequest>({
    mutationFn: async (data: TRequest): Promise<TResponse> => {
      console.log('🚀 POST Request:', options.endpoint);
      
      const timeoutMs = 20000; // 20 seconds for POST
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 20 seconds')), timeoutMs);
      });

      const isFormData = data instanceof FormData;
      const headers = await getAuthHeaders();
      
      // Don't set Content-Type for FormData, let the browser set it with boundary
      if (isFormData) {
        delete headers["Content-Type"];
      }
      
      const fetchPromise = sdk.client.fetch(options.endpoint, {
        method: API_TYPE.POST,
        body: data as BodyInit,
        headers,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('✅ POST Success:', options.endpoint);
      return response as TResponse;
    },
    onSuccess: (data) => {
      if (options.invalidateQueries !== false && options.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      }

      if (options.showSuccessToast !== false) {
        snackbar.success(options.successMessage || "Success!");
      }

      options.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('❌ POST Failed:', options.endpoint, error);
      if (options.showErrorToast !== false) {
        handleError(error);
      }
      options.onError?.(error);
    },
    retry: 1, // Only 1 retry for POST operations
  });
};

// Mobile-optimized PATCH hook
export const usePatchData = <TResponse = unknown>(options: {
  endpoint: string;
  queryKey?: (string | number)[];
  successMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  invalidateQueries?: boolean;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { handleError } = useApiErrorHandler();

  return useMutation<TResponse, unknown, { id: string; data: unknown }>({
    mutationFn: async ({ id, data }): Promise<TResponse> => {
      console.log('🚀 PATCH Request:', `${options.endpoint}/${id}`);
      
      const timeoutMs = 20000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 20 seconds')), timeoutMs);
      });

      const isFormData = data instanceof FormData;
      const headers = await getAuthHeaders();
      
      // Don't set Content-Type for FormData, let the browser set it with boundary
      if (isFormData) {
        delete headers["Content-Type"];
      }
      
      const fetchPromise = sdk.client.fetch(`${options.endpoint}/${id}`, {
        method: API_TYPE.PATCH,
        body: data as BodyInit,
        headers,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('✅ PATCH Success:', `${options.endpoint}/${id}`);
      return response as TResponse;
    },
    onSuccess: (data) => {
      if (options.invalidateQueries !== false && options.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      }

      if (options.showSuccessToast !== false) {
        snackbar.success(options.successMessage || "Updated successfully!");
      }

      options.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('❌ PATCH Failed:', options.endpoint, error);
      if (options.showErrorToast !== false) {
        handleError(error);
      }
      options.onError?.(error);
    },
    retry: 1,
  });
};

// Mobile-optimized DELETE hook
export const useDeleteData = (options: {
  endpoint: string;
  queryKey?: (string | number)[];
  successMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  invalidateQueries?: boolean;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { handleError } = useApiErrorHandler();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🚀 DELETE Request:', `${options.endpoint}/${id}`);
      
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), timeoutMs);
      });

      const headers = await getAuthHeaders();
      delete headers["Content-Type"]; // DELETE requests don't need Content-Type
      
      const fetchPromise = sdk.client.fetch(`${options.endpoint}/${id}`, {
        method: API_TYPE.DELETE,
        headers,
      });

      await Promise.race([fetchPromise, timeoutPromise]);
      console.log('✅ DELETE Success:', `${options.endpoint}/${id}`);
    },
    onSuccess: () => {
      if (options.invalidateQueries !== false && options.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      }

      if (options.showSuccessToast !== false) {
        snackbar.success(options.successMessage || "Deleted successfully!");
      }

      options.onSuccess?.();
    },
    onError: (error) => {
      console.error('❌ DELETE Failed:', options.endpoint, error);
      if (options.showErrorToast !== false) {
        handleError(error);
      }
      options.onError?.(error);
    },
    retry: 1,
  });
};

// Utility hook for manual query management
export const useQueryManager = () => {
  const queryClient = useQueryClient();

  const invalidateQueries = (queryKey: (string | number)[]) => {
    queryClient.invalidateQueries({ queryKey });
  };

  const removeQueries = (queryKey: (string | number)[]) => {
    queryClient.removeQueries({ queryKey });
  };

  const resetQueries = (queryKey: (string | number)[]) => {
    queryClient.resetQueries({ queryKey });
  };

  return { invalidateQueries, removeQueries, resetQueries };
};

// Utility function for slow endpoints like categories
export const useGetCategoriesData = <T>(options: {
  params?: Record<string, unknown>;
  queryKey: (string | number | boolean)[];
  enabled?: boolean;
  showErrorToast?: boolean;
}) => {
  return useGetData<T>({
    ...options,
    endpoint: '/store/categories',
    timeout: 30000, // 30 seconds for categories
    staleTime: 10 * 60 * 1000, // 10 minutes cache for categories
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  });
};
