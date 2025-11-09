# Data Fetching Guide

This document explains how to fetch data from the backend correctly in the TecShop project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Axios Client Configuration](#axios-client-configuration)
4. [React Query Hooks Pattern](#react-query-hooks-pattern)
5. [Creating Custom Hooks](#creating-custom-hooks)
6. [Query Keys Convention](#query-keys-convention)
7. [Mutations and Cache Updates](#mutations-and-cache-updates)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Examples](#examples)

---

## Architecture Overview

TecShop uses a **separation of concerns** approach for data fetching:

```
┌─────────────┐
│  Component  │ ← Uses custom hooks (useProducts, useCategories, etc.)
└─────────────┘
       │
       ↓
┌─────────────┐
│ Custom Hook │ ← React Query hooks (useQuery, useMutation)
└─────────────┘
       │
       ↓
┌─────────────┐
│  API Layer  │ ← Axios functions (getProducts, createProduct, etc.)
└─────────────┘
       │
       ↓
┌─────────────┐
│   Backend   │ ← NestJS API Gateway (http://localhost:8080/api)
└─────────────┘
```

### Why This Pattern?

1. **Single Source of Truth** - All data fetching logic in one place
2. **Automatic Caching** - No manual cache management
3. **Optimistic Updates** - UI updates before server confirms
4. **Error Handling** - Centralized error handling with toast notifications
5. **Loading States** - Automatic loading state management
6. **Reusability** - Hooks can be used across multiple components

---

## Technology Stack

### Data Fetching

- **React Query (TanStack Query)** v5 - Server state management
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Request deduplication
  - Retry logic

- **Axios** - HTTP client
  - Cookie-based authentication
  - Automatic token refresh
  - Request/Response interceptors
  - Error handling

### Client State Management

- **Zustand** - For UI state (NOT for server data)
  - Form state
  - Modal state
  - Global UI preferences

### Important Rules

- **DO NOT use `useEffect` for data fetching** - Always use React Query
- **DO NOT use `useState` for server data** - Use React Query
- **DO NOT use Zustand for server data** - Use React Query
- **DO use `useEffect` ONLY for side effects** (DOM manipulation, event listeners)

---

## Axios Client Configuration

Location: `apps/{app-name}/src/lib/api/client.ts`

### Configuration

```typescript
import axios from 'axios';

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api' // Relative URL in production
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Key Features

1. **Cookie-Based Authentication**
   - `withCredentials: true` sends httpOnly cookies automatically
   - No need to manually manage Authorization headers
   - Tokens stored securely in httpOnly cookies

2. **Automatic Token Refresh**
   - Intercepts 401/403 errors
   - Attempts token refresh
   - Retries original request
   - Prevents infinite loops

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401/403 errors
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Refresh token
        await apiClient.post('/auth/refresh');
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login on refresh failure
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## React Query Hooks Pattern

### File Structure

```
src/
├── hooks/
│   ├── useProducts.ts      # Product hooks
│   ├── useCategories.ts    # Category hooks
│   ├── useBrands.ts        # Brand hooks
│   ├── use-ratings.ts      # Rating hooks
│   └── index.ts            # Export all hooks
├── lib/
│   └── api/
│       ├── client.ts       # Axios configuration
│       ├── products.ts     # Product API functions
│       ├── categories.ts   # Category API functions
│       └── brands.ts       # Brand API functions
```

### Anatomy of a Custom Hook

Every custom hook file should have:

1. **Type Definitions** - TypeScript interfaces
2. **Query Keys** - Centralized cache key factory
3. **Query Hooks** - For fetching data (useQuery)
4. **Mutation Hooks** - For modifying data (useMutation)

---

## Creating Custom Hooks

### Step 1: Define Types

```typescript
// apps/seller-ui/src/lib/api/products.ts

export interface ProductResponse {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  category?: Category;
  // ... other fields
}

export interface CreateProductData {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  images: File[];
  // ... other fields
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  stock?: number;
  // ... other fields
}
```

### Step 2: Create API Functions

```typescript
// apps/seller-ui/src/lib/api/products.ts

import apiClient from './client';

/**
 * Fetch all products with optional filters
 */
export async function getProducts(filters?: {
  search?: string;
  category?: string;
  isActive?: boolean;
}): Promise<ProductResponse[]> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isActive !== undefined) {
    params.append('isActive', filters.isActive.toString());
  }

  const response = await apiClient.get(`/products?${params.toString()}`);
  return response.data;
}

/**
 * Fetch a single product by ID
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  data: UpdateProductData
): Promise<ProductResponse> {
  const response = await apiClient.put(`/products/${id}`, data);
  return response.data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}
```

### Step 3: Define Query Keys

```typescript
// apps/seller-ui/src/hooks/useProducts.ts

/**
 * Query Keys for TanStack Query
 * Centralized keys prevent typos and make invalidation easier
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: { search?: string; category?: string; isActive?: boolean }) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Examples of generated keys:
// productKeys.all              → ['products']
// productKeys.lists()          → ['products', 'list']
// productKeys.list({ search: 'laptop' }) → ['products', 'list', { search: 'laptop' }]
// productKeys.detail('123')    → ['products', 'detail', '123']
```

### Step 4: Create Query Hooks

```typescript
// apps/seller-ui/src/hooks/useProducts.ts

import { useQuery } from '@tanstack/react-query';
import { getProducts, getProduct } from '../lib/api/products';

/**
 * Hook: Fetch all products
 *
 * Features:
 * - Automatic caching (data persists between component mounts)
 * - Background refetching on window focus
 * - Automatic retry on failure (3 times with exponential backoff)
 * - Loading and error states
 * - Support for search and filter parameters
 *
 * @param filters - Optional filters (search, category, isActive)
 */
export function useProducts(filters?: {
  search?: string;
  category?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
  });
}

/**
 * Hook: Fetch a single product by ID
 *
 * @param id - Product ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id, // Only fetch if ID exists
  });
}
```

### Step 5: Create Mutation Hooks

```typescript
// apps/seller-ui/src/hooks/useProducts.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProduct, deleteProduct } from '../lib/api/products';

/**
 * Hook: Update a product
 *
 * Features:
 * - Optimistic updates (updates UI before server confirms)
 * - Automatic cache invalidation
 * - Success/error toast notifications
 * - Loading state
 *
 * @param id - Product ID
 */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: UpdateProductData) =>
      updateProduct(id, productData),

    // Optimistic update (runs immediately)
    onMutate: async (productData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData(productKeys.detail(id));
      const previousProducts = queryClient.getQueryData(productKeys.lists());

      // Optimistically update cache
      if (previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), {
          ...previousProduct,
          ...productData,
        });
      }

      // Return context with snapshots for rollback
      return { previousProduct, previousProducts };
    },

    // Success handler
    onSuccess: (updatedProduct) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
        refetchType: 'active', // Refetch immediately
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(id),
      });

      toast.success('Product updated successfully!', {
        description: updatedProduct.name,
      });
    },

    // Error handler (rollback optimistic update)
    onError: (error: Error, _productData, context) => {
      // Rollback to previous state
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(id), context.previousProduct);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts);
      }

      toast.error('Failed to update product', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook: Delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,

    onMutate: async (productId: string) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot
      const previousProducts = queryClient.getQueryData(productKeys.lists());

      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: productKeys.lists() },
        (oldData: ProductResponse[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter((product) => product.id !== productId);
        }
      );

      return { previousProducts };
    },

    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });

      toast.success('Product deleted successfully!');
    },

    onError: (error: Error, _productId, context) => {
      // Rollback
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts);
      }

      toast.error('Failed to delete product', {
        description: error.message,
      });
    },
  });
}
```

---

## Query Keys Convention

Query keys are used by React Query to identify and cache queries. Follow this hierarchical pattern:

### Pattern

```typescript
export const entityKeys = {
  all: ['entityName'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters?: FilterType) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

### Examples

```typescript
// Products
export const productKeys = {
  all: ['products'] as const,
  lists: () => ['products', 'list'] as const,
  list: (filters) => ['products', 'list', filters] as const,
  details: () => ['products', 'detail'] as const,
  detail: (id) => ['products', 'detail', id] as const,
  trash: () => ['products', 'trash'] as const,
};

// Categories
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => ['categories', 'list'] as const,
  tree: () => ['categories', 'tree'] as const,
  details: () => ['categories', 'detail'] as const,
  detail: (id) => ['categories', 'detail', id] as const,
};

// User Ratings
export const ratingKeys = {
  all: ['ratings'] as const,
  userRating: (productId) => ['ratings', 'user', productId] as const,
};
```

### Benefits

1. **Type Safety** - TypeScript autocomplete for query keys
2. **Consistency** - Same pattern across all hooks
3. **Easy Invalidation** - Invalidate all related queries easily
4. **Prevents Typos** - Centralized key management

### Invalidation Examples

```typescript
// Invalidate all product queries
queryClient.invalidateQueries({ queryKey: productKeys.all });

// Invalidate all product lists
queryClient.invalidateQueries({ queryKey: productKeys.lists() });

// Invalidate specific product detail
queryClient.invalidateQueries({ queryKey: productKeys.detail('123') });

// Invalidate list with specific filters
queryClient.invalidateQueries({
  queryKey: productKeys.list({ search: 'laptop' })
});
```

---

## Mutations and Cache Updates

### Three Strategies for Cache Updates

#### 1. Invalidation (Simplest)

**When to use:** When you want React Query to refetch the data automatically.

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
}
```

**Pros:**
- Simple
- Always fresh data
- No manual cache manipulation

**Cons:**
- Causes network request
- Brief loading state

#### 2. Optimistic Updates (Best UX)

**When to use:** For instant UI feedback before server confirms.

```typescript
onMutate: async (newProduct) => {
  await queryClient.cancelQueries({ queryKey: productKeys.lists() });

  const previousProducts = queryClient.getQueryData(productKeys.lists());

  queryClient.setQueryData(productKeys.lists(), (old) => [...old, newProduct]);

  return { previousProducts };
},

onError: (error, newProduct, context) => {
  // Rollback on error
  queryClient.setQueryData(productKeys.lists(), context.previousProducts);
},

onSuccess: () => {
  // Still invalidate to get server-confirmed data
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
}
```

**Pros:**
- Instant UI feedback
- Best user experience
- Feels very fast

**Cons:**
- More complex code
- Must handle rollback

#### 3. Direct Cache Update

**When to use:** When you have the exact data from server response.

```typescript
onSuccess: (updatedProduct) => {
  // Update detail cache
  queryClient.setQueryData(
    productKeys.detail(updatedProduct.id),
    updatedProduct
  );

  // Update list cache
  queryClient.setQueriesData(
    { queryKey: productKeys.lists() },
    (oldData: ProductResponse[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(p =>
        p.id === updatedProduct.id ? updatedProduct : p
      );
    }
  );
}
```

**Pros:**
- No extra network requests
- Precise cache control

**Cons:**
- Manual cache synchronization
- Must update all related caches

### Recommended Approach

Use a **hybrid strategy** combining optimistic updates with invalidation:

```typescript
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateProduct(id, data),

    // 1. Optimistic update for instant feedback
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });
      const previous = queryClient.getQueryData(productKeys.detail(id));

      queryClient.setQueryData(productKeys.detail(id), {
        ...previous,
        ...data,
      });

      return { previous };
    },

    // 2. Invalidate for fresh data
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.lists(),
        refetchType: 'active', // Immediate refetch
      });

      // Also update cache with server response
      queryClient.setQueryData(productKeys.detail(id), updated);

      toast.success('Product updated!');
    },

    // 3. Rollback on error
    onError: (error, data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(productKeys.detail(id), context.previous);
      }
      toast.error('Update failed');
    },
  });
}
```

---

## Best Practices

### 1. Always Use Custom Hooks

**DO:**
```typescript
// In component
const { data: products, isLoading, error } = useProducts();
```

**DON'T:**
```typescript
// In component - DON'T do this
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => fetch('/api/products').then(r => r.json()),
});
```

### 2. Handle Loading and Error States

```typescript
function ProductList() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 3. Use Filters with Query Keys

```typescript
function ProductList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Each filter combination creates a separate cache entry
  const { data: products } = useProducts({ search, category });

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {/* categories */}
      </select>
      {/* render products */}
    </>
  );
}
```

### 4. Configure Stale Time Appropriately

```typescript
// Frequently changing data
useQuery({
  queryKey: productKeys.lists(),
  queryFn: getProducts,
  staleTime: 1 * 60 * 1000, // 1 minute
});

// Rarely changing data
useQuery({
  queryKey: categoryKeys.tree(),
  queryFn: getCategories,
  staleTime: 10 * 60 * 1000, // 10 minutes
});

// Real-time data
useQuery({
  queryKey: ['cart'],
  queryFn: getCart,
  staleTime: 0, // Always fetch on mount
});
```

### 5. Use Conditional Fetching

```typescript
function ProductDetail({ id }: { id: string }) {
  const { data: product } = useProduct(id, {
    enabled: !!id, // Only fetch if ID exists
  });

  // ...
}
```

### 6. Provide User Feedback

```typescript
import { toast } from 'sonner';

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product deleted successfully!'); // ✅ User feedback
    },
    onError: (error: Error) => {
      toast.error('Failed to delete product', {
        description: error.message, // ✅ Show error details
      });
    },
  });
}
```

### 7. Type Everything

```typescript
// ✅ GOOD - Fully typed
export function useProducts(): UseQueryResult<ProductResponse[], Error> {
  return useQuery<ProductResponse[], Error>({
    queryKey: productKeys.lists(),
    queryFn: getProducts,
  });
}

// ❌ BAD - No types
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
```

---

## Common Patterns

### Pattern 1: List + Detail Hooks

```typescript
// List view
function ProductsPage() {
  const { data: products } = useProducts();
  return products?.map(p => <ProductCard key={p.id} product={p} />);
}

// Detail view
function ProductDetailPage({ id }: { id: string }) {
  const { data: product } = useProduct(id);
  return <ProductDetails product={product} />;
}
```

### Pattern 2: Dependent Queries

```typescript
function ProductForm() {
  // First, get categories
  const { data: categories } = useCategories();

  // Then, get brands (only if we have categories)
  const { data: brands } = useBrands({
    enabled: !!categories, // Wait for categories
  });

  // ...
}
```

### Pattern 3: Prefetching

```typescript
function ProductList() {
  const queryClient = useQueryClient();
  const { data: products } = useProducts();

  const prefetchProduct = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => getProduct(id),
    });
  };

  return (
    <div>
      {products?.map(product => (
        <div
          key={product.id}
          onMouseEnter={() => prefetchProduct(product.id)} // Prefetch on hover
        >
          <Link href={`/products/${product.id}`}>
            {product.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Pagination

```typescript
function ProductList() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: productKeys.list({ page }),
    queryFn: () => getProducts({ page }),
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true, // Keep old data while fetching new page
  });

  return (
    <>
      {data?.products.map(p => <ProductCard key={p.id} product={p} />)}
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

### Pattern 5: Infinite Scroll

```typescript
function ProductList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: productKeys.lists(),
    queryFn: ({ pageParam = 1 }) => getProducts({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });

  return (
    <>
      {data?.pages.map(page =>
        page.products.map(p => <ProductCard key={p.id} product={p} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </>
  );
}
```

---

## Examples

### Example 1: Complete Product CRUD

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductResponse,
  type CreateProductData,
  type UpdateProductData,
} from '../lib/api/products';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// GET all products
export function useProducts(filters?) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 2 * 60 * 1000,
  });
}

// GET single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

// CREATE product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created!');
    },
    onError: (error: Error) => {
      toast.error('Failed to create product', {
        description: error.message,
      });
    },
  });
}

// UPDATE product
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductData) => updateProduct(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.setQueryData(productKeys.detail(id), updated);
      toast.success('Product updated!');
    },
    onError: (error: Error) => {
      toast.error('Failed to update product', {
        description: error.message,
      });
    },
  });
}

// DELETE product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product deleted!');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete product', {
        description: error.message,
      });
    },
  });
}
```

### Example 2: Using Hooks in Components

```typescript
// components/ProductList.tsx
import { useProducts, useDeleteProduct } from '../hooks/useProducts';

export function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const deleteProduct = useDeleteProduct();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <button
            onClick={() => deleteProduct.mutate(product.id)}
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}

// components/ProductDetail.tsx
import { useProduct, useUpdateProduct } from '../hooks/useProducts';

export function ProductDetail({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  if (isLoading) return <div>Loading...</div>;

  const handleUpdate = (updates: Partial<Product>) => {
    updateProduct.mutate(updates);
  };

  return (
    <div>
      <h1>{product?.name}</h1>
      <p>{product?.description}</p>
      <button onClick={() => handleUpdate({ price: product.price + 10 })}>
        Increase Price
      </button>
    </div>
  );
}
```

### Example 3: Form with Mutation

```typescript
// components/CreateProductForm.tsx
import { useForm } from '@tanstack/react-form';
import { useCreateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

export function CreateProductForm() {
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: '',
    },
    onSubmit: async ({ value }) => {
      await createProduct.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <input
        value={form.state.values.name}
        onChange={(e) => form.setFieldValue('name', e.target.value)}
        placeholder="Product name"
      />

      <select
        value={form.state.values.categoryId}
        onChange={(e) => form.setFieldValue('categoryId', e.target.value)}
      >
        <option value="">Select category</option>
        {categories?.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <button type="submit" disabled={createProduct.isPending}>
        {createProduct.isPending ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

---

## Summary

### Key Principles

1. **Use React Query for ALL server data** - Never use `useState` or `useEffect`
2. **Create custom hooks** - One hook file per entity
3. **Use query key factories** - Centralized and hierarchical
4. **Implement optimistic updates** - For better UX
5. **Always handle errors** - Show toast notifications
6. **Type everything** - Full TypeScript support
7. **Configure stale time** - Based on data change frequency

### The Pattern

```typescript
// 1. Define types
export interface EntityResponse { /* ... */ }
export interface CreateEntityData { /* ... */ }

// 2. Create API functions
export async function getEntities(): Promise<EntityResponse[]> { /* ... */ }
export async function createEntity(data: CreateEntityData): Promise<EntityResponse> { /* ... */ }

// 3. Define query keys
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  // ...
};

// 4. Create hooks
export function useEntities() {
  return useQuery({
    queryKey: entityKeys.lists(),
    queryFn: getEntities,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}
```

### Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

**Last Updated:** November 2025
