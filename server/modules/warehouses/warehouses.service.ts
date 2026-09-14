import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { z } from 'zod'
import type { PreviewShape, Warehouse, WarehouseSummary } from '../../../shared/api.js'
import type { createWarehouseSchema, updateWarehouseSchema } from '../../../shared/schemas.js'
import { getDb, type Executor } from '../../db/client.js'
import { toWarehouseDto } from '../../db/mappers.js'
import { locationWithinRackGrid } from '../../db/queries.js'
import { locationContents, rackLocations, warehouseElements, warehouses } from '../../db/schema.js'
import { notFound } from '../../lib/errors.js'

const WAREHOUSE_NOT_FOUND = 'Almacén no encontrado'

const ownedBy = (ownerId: string, warehouseId: string) =>
  and(eq(warehouses.id, warehouseId), eq(warehouses.ownerId, ownerId))

export async function getWarehouse(ownerId: string, warehouseId: string, executor: Executor = getDb()): Promise<Warehouse> {
  const [row] = await executor.select().from(warehouses).where(ownedBy(ownerId, warehouseId)).limit(1)
  if (!row) throw notFound(WAREHOUSE_NOT_FOUND)
  return toWarehouseDto(row)
}

export async function assertWarehouseOwner(ownerId: string, warehouseId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(ownedBy(ownerId, warehouseId))
    .limit(1)
  if (!row) throw notFound(WAREHOUSE_NOT_FOUND)
}

export async function listWarehouses(ownerId: string): Promise<WarehouseSummary[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.ownerId, ownerId))
    .orderBy(desc(warehouses.updatedAt))
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)
  const [elements, occupiedCounts] = await Promise.all([
    db
      .select({
        warehouseId: warehouseElements.warehouseId,
        type: warehouseElements.type,
        x: warehouseElements.x,
        y: warehouseElements.y,
        width: warehouseElements.width,
        height: warehouseElements.height,
        rotation: warehouseElements.rotation,
        color: warehouseElements.color,
        properties: warehouseElements.properties,
      })
      .from(warehouseElements)
      .where(and(inArray(warehouseElements.warehouseId, ids), isNull(warehouseElements.deletedAt)))
      .orderBy(asc(warehouseElements.sortOrder)),
    db
      .select({ warehouseId: warehouseElements.warehouseId, occupied: count() })
      .from(locationContents)
      .innerJoin(rackLocations, eq(rackLocations.id, locationContents.locationId))
      .innerJoin(warehouseElements, eq(warehouseElements.id, rackLocations.elementId))
      .where(
        and(
          inArray(warehouseElements.warehouseId, ids),
          isNull(warehouseElements.deletedAt),
          locationWithinRackGrid,
        ),
      )
      .groupBy(warehouseElements.warehouseId),
  ])

  const occupiedByWarehouse = new Map(occupiedCounts.map((entry) => [entry.warehouseId, entry.occupied]))

  return rows.map((row) => {
    const own = elements.filter((element) => element.warehouseId === row.id)
    const racks = own.filter((element) => element.type === 'rack')
    const preview: PreviewShape[] = own.map(({ properties, warehouseId: _warehouseId, ...shape }) => ({
      ...shape,
      variant: previewVariant(properties),
    }))

    return {
      ...toWarehouseDto(row),
      stats: {
        elements: own.length,
        racks: racks.length,
        locations: racks.reduce(
          (total, rack) => total + Number(rack.properties.rows ?? 0) * Number(rack.properties.columns ?? 0),
          0,
        ),
        occupiedLocations: occupiedByWarehouse.get(row.id) ?? 0,
      },
      preview,
    }
  })
}

function previewVariant(properties: Record<string, unknown>): string | null {
  const variant = properties.category ?? properties.kind ?? properties.direction
  return typeof variant === 'string' ? variant : null
}

export async function createWarehouse(
  ownerId: string,
  input: z.output<typeof createWarehouseSchema>,
): Promise<Warehouse> {
  const [row] = await getDb()
    .insert(warehouses)
    .values({ ...input, ownerId })
    .returning()
  return toWarehouseDto(row)
}

export async function updateWarehouse(
  ownerId: string,
  warehouseId: string,
  input: z.output<typeof updateWarehouseSchema>,
): Promise<Warehouse> {
  const [row] = await getDb().update(warehouses).set(input).where(ownedBy(ownerId, warehouseId)).returning()
  if (!row) throw notFound(WAREHOUSE_NOT_FOUND)
  return toWarehouseDto(row)
}

export async function deleteWarehouse(ownerId: string, warehouseId: string): Promise<void> {
  const deleted = await getDb()
    .delete(warehouses)
    .where(ownedBy(ownerId, warehouseId))
    .returning({ id: warehouses.id })
  if (deleted.length === 0) throw notFound(WAREHOUSE_NOT_FOUND)
}
