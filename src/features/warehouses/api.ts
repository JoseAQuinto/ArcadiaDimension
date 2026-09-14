import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Warehouse, WarehouseSummary } from '@shared/api'
import type { CreateWarehouseInput, UpdateWarehouseInput } from '@shared/schemas'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: ({ signal }) => api.get<WarehouseSummary[]>('/warehouses', signal),
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWarehouseInput) => api.post<Warehouse>('/warehouses', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.warehouses }),
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWarehouseInput }) =>
      api.patch<Warehouse>(`/warehouses/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.warehouses, exact: true }),
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/warehouses/${id}`),
    onSuccess: ({ id }) => {
      queryClient.setQueryData<WarehouseSummary[]>(queryKeys.warehouses, (current) =>
        current?.filter((warehouse) => warehouse.id !== id),
      )
      queryClient.removeQueries({ queryKey: ['warehouses', id] })
    },
  })
}
