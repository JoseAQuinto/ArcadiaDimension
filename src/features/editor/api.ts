import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LocationSearchResult, RackLocation, RackLocations, RackOccupancy, WarehouseLayout } from '@shared/api'
import type { LocationContentInput } from '@shared/schemas'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function useLayout(warehouseId: string) {
  return useQuery({
    queryKey: queryKeys.layout(warehouseId),
    queryFn: ({ signal }) => api.get<WarehouseLayout>(`/warehouses/${warehouseId}/layout`, signal),
    // The editor store owns the layout once loaded: never refetch behind its back.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  })
}

const toOccupancyMap = (entries: RackOccupancy[]) => new Map(entries.map((entry) => [entry.elementId, entry]))

export function useOccupancy(warehouseId: string) {
  return useQuery({
    queryKey: queryKeys.occupancy(warehouseId),
    queryFn: ({ signal }) => api.get<RackOccupancy[]>(`/warehouses/${warehouseId}/occupancy`, signal),
    select: toOccupancyMap,
  })
}

export function useLocationSearch(warehouseId: string, query: string) {
  return useQuery({
    queryKey: queryKeys.search(warehouseId, query),
    queryFn: ({ signal }) =>
      api.get<LocationSearchResult[]>(`/warehouses/${warehouseId}/search?q=${encodeURIComponent(query)}`, signal),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

export function useRackLocations(rackId: string) {
  return useQuery({
    queryKey: queryKeys.rackLocations(rackId),
    queryFn: ({ signal }) => api.get<RackLocations>(`/racks/${rackId}/locations`, signal),
    staleTime: 0,
  })
}

function useLocationMutationEffects(warehouseId: string, rackId: string) {
  const queryClient = useQueryClient()
  return (location: RackLocation) => {
    queryClient.setQueryData<RackLocations>(queryKeys.rackLocations(rackId), (current) =>
      current && {
        ...current,
        locations: current.locations.map((candidate) => (candidate.id === location.id ? location : candidate)),
      },
    )
    void queryClient.invalidateQueries({ queryKey: queryKeys.occupancy(warehouseId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.searchAll(warehouseId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.warehouses, exact: true })
  }
}

export function useSaveLocationContent(warehouseId: string, rackId: string) {
  const onSuccess = useLocationMutationEffects(warehouseId, rackId)
  return useMutation({
    mutationFn: ({ locationId, input }: { locationId: string; input: LocationContentInput }) =>
      api.put<RackLocation>(`/locations/${locationId}/content`, input),
    onSuccess,
  })
}

export function useClearLocationContent(warehouseId: string, rackId: string) {
  const onSuccess = useLocationMutationEffects(warehouseId, rackId)
  return useMutation({
    mutationFn: (locationId: string) => api.delete<RackLocation>(`/locations/${locationId}/content`),
    onSuccess,
  })
}
