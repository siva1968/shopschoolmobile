# API Hooks Usage Guide

This document provides examples of how to use the API hooks in your components.

## Available Hooks

### Query Hooks (GET)
- `useGetData<T>` - Fetch single resource
- `usePaginatedData<T>` - Fetch paginated lists

### Mutation Hooks (POST, PATCH, PUT, DELETE)
- `usePostData<TResponse, TRequest>` - Create resources
- `usePatchData<TResponse>` - Partial updates
- `usePutData<TResponse>` - Full updates
- `useDeleteData` - Delete resources

### Utility Hooks
- `useInvalidateQueries` - Manual cache invalidation

## Usage Examples

### Fetching Data

```tsx
import { useGetData, usePaginatedData } from "@/lib/use-api";

// Fetch single product
const useProduct = (id: string) => {
  return useGetData<Product>({
    queryKey: ["product", id],
    endpoint: "/store/products",
    id,
    enabled: !!id,
  });
};

// Fetch products with pagination
const useProducts = (params?: { category?: string; search?: string }) => {
  return usePaginatedData<Product>({
    queryKey: ["products", params],
    endpoint: "/store/products",
    params,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Creating Data

```tsx
import { usePostData } from "@/lib/use-api";

const useCreateProduct = () => {
  return usePostData<Product, CreateProductRequest>({
    key: "products",
    endpoint: "/admin/products",
    successMsg: "Product created successfully!",
  });
};

// Usage in component
const createProduct = useCreateProduct();

const handleCreate = async (productData: CreateProductRequest) => {
  try {
    await createProduct.mutateAsync(productData);
    // Success toast shown automatically
    // Cache invalidated automatically
  } catch (error) {
    // Error toast shown automatically
    console.error("Failed to create product:", error);
  }
};
```

### Updating Data

```tsx
import { usePatchData } from "@/lib/use-api";

const useUpdateProduct = () => {
  return usePatchData<Product>({
    key: ["products"],
    endpoint: "/admin/products",
    successMsg: "Product updated successfully!",
  });
};

// Usage in component
const updateProduct = useUpdateProduct();

const handleUpdate = async (id: string, data: Partial<Product>) => {
  try {
    await updateProduct.mutateAsync({ id, data });
    // Success toast and cache invalidation happen automatically
  } catch (error) {
    // Error toast shown automatically
    console.error("Failed to update product:", error);
  }
};
```

### Deleting Data

```tsx
import { useDeleteData } from "@/lib/use-api";

const useDeleteProduct = () => {
  return useDeleteData({
    key: ["products"],
    endpoint: "/admin/products",
    successMsg: "Product deleted successfully!",
  });
};

// Usage in component
const deleteProduct = useDeleteProduct();

const handleDelete = async (id: string) => {
  try {
    await deleteProduct.mutateAsync(id);
    // Success toast and cache invalidation happen automatically
  } catch (error) {
    // Error toast shown automatically
    console.error("Failed to delete product:", error);
  }
};
```

### Manual Cache Management

```tsx
import { useInvalidateQueries } from "@/lib/use-api";

const useProductActions = () => {
  const { invalidateQueries, removeQueries } = useInvalidateQueries();
  
  const refreshProducts = () => {
    invalidateQueries(["products"]);
  };
  
  const clearProductCache = () => {
    removeQueries(["products"]);
  };
  
  return { refreshProducts, clearProductCache };
};
```

## Configuration Options

### Common Options for All Hooks

```tsx
{
  showSuccessToast: boolean;     // Show success snackbar (default: true)
  showErrorToast: boolean;       // Show error snackbar (default: true)
  invalidateQueries: boolean;    // Auto-invalidate cache (default: true)
}
```

### Query-specific Options

```tsx
{
  enabled: boolean;              // Enable/disable query
  staleTime: number;             // Cache duration in ms
  showErrorToast: boolean;       // Show error snackbar (default: true)
}
```

### Mutation-specific Options

```tsx
{
  key: string | string[];        // Cache keys to invalidate
  successMsg: string;            // Custom success message
  headers: Record<string, string>; // Custom headers
}
```

## Error Handling

The hooks automatically handle common error scenarios:

- **401 Unauthorized**: Shows "Session expired" message and redirects to sign-in
- **403 Forbidden**: Shows "Permission denied" message
- **404 Not Found**: Shows "Resource not found" message
- **500+ Server Errors**: Shows "Server error" message
- **Network Errors**: Shows "Network error" message
- **400 Validation Errors**: Shows specific validation message

## Global Snackbar

The Snackbar is globally available through the `SnackbarProvider`. You can also use it directly:

```tsx
import { useSnackbar } from "@/contexts";

const MyComponent = () => {
  const snackbar = useSnackbar();
  
  const handleAction = () => {
    snackbar.success("Action completed!");
    snackbar.error("Something went wrong!");
    snackbar.warning("Please be careful!");
    snackbar.info("Here's some info!");
  };
  
  return <button onClick={handleAction}>Click me</button>;
};
```

## Best Practices

1. **Use descriptive query keys**: Include relevant parameters in query keys
2. **Enable queries conditionally**: Use `enabled` option to prevent unnecessary requests
3. **Set appropriate stale times**: Balance between fresh data and performance
4. **Handle loading states**: Always handle loading, error, and success states
5. **Use TypeScript**: Provide proper types for better development experience
6. **Custom error messages**: Provide context-specific error messages
7. **Batch operations**: Use multiple keys for cache invalidation when needed
