import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'
import { queryKeys } from './query-keys'

const isRetryable = (error: unknown) =>
  !(error instanceof ApiError) || error.status === 0 || error.status >= 500

function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    // Session expired: RequireAuth reacts to this and redirects to /login.
    queryClient.setQueryData(queryKeys.session, null)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
    },
    mutations: {
      retry: false,
    },
  },
})
