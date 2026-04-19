import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from 'react';

// Create a client with default options
let queryClient: QueryClient;

const mutationCache = new MutationCache({
  onSuccess: async () => {
    // After ANY successful mutation, revalidate currently-active queries
    // so any open page reflects backend state immediately.
    await queryClient.invalidateQueries({ type: "active" });
  },
});

queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes default
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
