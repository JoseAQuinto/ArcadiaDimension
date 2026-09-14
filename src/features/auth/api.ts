import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@shared/api'
import type { LoginInput, RegisterInput } from '@shared/schemas'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export const DEMO_CREDENTIALS = { email: 'demo@arcadiadimension.app', password: 'demo1234' } as const

interface UserPayload {
  user: User
}

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => (await api.get<{ user: User | null }>('/auth/me', signal)).user,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

/** Only valid below <RequireAuth>, where the session is guaranteed. */
export function useCurrentUser(): User {
  const { data } = useSession()
  if (!data) throw new Error('useCurrentUser must be used inside an authenticated route')
  return data
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<UserPayload>('/auth/login', input),
    onSuccess: ({ user }) => queryClient.setQueryData(queryKeys.session, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<UserPayload>('/auth/register', input),
    onSuccess: ({ user }) => queryClient.setQueryData(queryKeys.session, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ loggedOut: boolean }>('/auth/logout'),
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.session, null)
    },
  })
}
