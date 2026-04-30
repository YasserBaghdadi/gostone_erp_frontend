import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";

// Don't retry these — they won't succeed on retry.
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    // Network / timeout / no-response → worth retrying
    if (!error.response) return true;
    if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") return true;
    if (NON_RETRYABLE_STATUS.has(error.response.status)) return false;
    // 5xx and anything else → retry
    return true;
  }
  // Unknown errors — retry once
  return true;
}

// Create a client with sane defaults for an API-driven app.
let queryClient: QueryClient;

const queryCache = new QueryCache({
  // Show a toast for query errors that already have data on screen
  // (the component itself shows its own loading/error UI on first load).
  onError: (error, query) => {
    const hasCachedData = query.state.data !== undefined;
    if (!hasCachedData) return;

    // Network errors already surface a toast from the axios interceptor —
    // skip duplicate notifications here.
    if (error instanceof AxiosError) {
      const isNetwork =
        !error.response ||
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK";
      if (isNetwork) return;
    }

    toast.error("تعذر تحديث البيانات", {
      description: "حدث خطأ أثناء جلب أحدث المعلومات. سيتم استخدام البيانات المخزّنة.",
    });
  },
});

const mutationCache = new MutationCache({
  onSuccess: async () => {
    // After ANY successful mutation, revalidate currently-active queries
    // so any open page reflects backend state immediately.
    await queryClient.invalidateQueries({ type: "active" });
  },
});

queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Retry network/5xx with exponential backoff up to 3 times,
      // but do NOT retry 4xx (client errors are not transient).
      retry: (failureCount, error) => {
        if (!isRetryableError(error)) return false;
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // Throw to the nearest ErrorBoundary ONLY on initial load failure
      // (no cached data yet). Background refetch failures keep the existing
      // data on screen and surface via the QueryCache toast above.
      throwOnError: (_error, query) => query.state.data === undefined,
      refetchOnWindowFocus: false,
      // Refetch when the browser comes back online — recovers paused queries
      // automatically once connectivity returns.
      refetchOnReconnect: true,
      networkMode: "online",
      staleTime: 1000 * 60 * 2, // 2 minutes default
    },
    mutations: {
      retry: (failureCount, error) => {
        if (!isRetryableError(error)) return false;
        return failureCount < 1;
      },
      // Mutations sent while offline pause and run automatically once online.
      networkMode: "online",
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
