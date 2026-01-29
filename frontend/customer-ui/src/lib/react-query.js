import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in development
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

/**
 * Query Keys for consistent cache management
 */
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'currentUser'],

  // Orders
  orders: ['orders'],
  order: (id) => ['orders', id],

  // Inventory
  products: ['products'],
  product: (id) => ['products', id],
  productStock: (id) => ['products', id, 'stock'],

  // Health
  health: (service) => ['health', service],
};
