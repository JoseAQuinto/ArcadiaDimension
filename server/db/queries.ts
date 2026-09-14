import { eq, sql } from 'drizzle-orm'
import type { Executor } from './client.js'
import { rackLocations, warehouseElements, warehouses } from './schema.js'

/**
 * A location is active while it lies inside its rack's current rows × columns.
 * Locations outside the grid are kept only when they still hold stock, so
 * shrinking a rack and undoing it never loses data.
 */
export const locationWithinRackGrid = sql`${rackLocations.rowNumber} <= (${warehouseElements.properties}->>'rows')::int
  and ${rackLocations.columnNumber} <= (${warehouseElements.properties}->>'columns')::int`

export async function touchWarehouse(executor: Executor, warehouseId: string): Promise<void> {
  await executor.update(warehouses).set({ updatedAt: sql`now()` }).where(eq(warehouses.id, warehouseId))
}
