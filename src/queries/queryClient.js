import { QueryClient } from '@tanstack/react-query';

// How long a cached answer is served without asking the API again.
export const STALE_TIME_MS = 60_000;
// How long an unused entry survives in memory before it is garbage collected.
export const GC_TIME_MS = 5 * 60_000;

// 4xx is the server's final word (not found, invalid, conflict) — retrying it
// only wastes a round-trip. 5xx and network blips are worth one more attempt.
function shouldRetry(failureCount, error) {
  if (typeof error?.status === 'number' && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
        // Revalidation: stale data is refreshed in the background when the user
        // comes back to the tab or the connection returns. Fresh data is not.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: 0 },
    },
  });
}
