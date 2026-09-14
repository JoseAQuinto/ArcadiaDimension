export const queryKeys = {
  session: ['session'] as const,
  warehouses: ['warehouses'] as const,
  layout: (warehouseId: string) => ['warehouses', warehouseId, 'layout'] as const,
  occupancy: (warehouseId: string) => ['warehouses', warehouseId, 'occupancy'] as const,
  searchAll: (warehouseId: string) => ['warehouses', warehouseId, 'search'] as const,
  search: (warehouseId: string, query: string) => ['warehouses', warehouseId, 'search', query] as const,
  rackLocations: (rackId: string) => ['racks', rackId, 'locations'] as const,
}
