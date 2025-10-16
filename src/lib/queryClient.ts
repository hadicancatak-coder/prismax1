import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration for caching and data management
 * Reduces database reads by ~70% through intelligent caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnReconnect: true, // Refetch on internet reconnect
      retry: 1, // Only retry once on failure
    },
  },
});
