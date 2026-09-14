import { and, asc, eq, ilike, isNull, lte, or, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { LocationSearchResult, RackLocation, RackLocations, RackOccupancy } from '../../../shared/api.js'
import type { RackProperties } from '../../../shared/elements.js'
import type { locationContentSchema } from '../../../shared/schemas.js'
import { getDb } from '../../db/client.js'
import { toContentDto } from '../../db/mappers.js'
import { locationWithinRackGrid, touchWarehouse } from '../../db/queries.js'
import { locationContents, rackLocations, warehouseElements, warehouses, type LocationContentRow } from '../../db/schema.js'
import { notFound } from '../../lib/errors.js'
import { assertWarehouseOwner } from '../warehouses/warehouses.service.js'

const activeRack = and(eq(warehouseElements.type, 'rack'), isNull(warehouseElements.deletedAt))

export async function getRackLocations(ownerId: string, elementId: string): Promise<RackLocations> {
  const db = getDb()
  const [rack] = await db
    .select({
      id: warehouseElements.id,
      warehouseId: warehouseElements.warehouseId,
      name: warehouseElements.name,
      properties: warehouseElements.properties,
    })
    .from(warehouseElements)
    .innerJoin(warehouses, eq(warehouses.id, warehouseElements.warehouseId))
    .where(and(eq(warehouseElements.id, elementId), eq(warehouses.ownerId, ownerId), activeRack))
    .limit(1)
  if (!rack) throw notFound('Rack no encontrado. Guarda el plano e inténtalo de nuevo.')

  const { code, rows, columns } = rack.properties as RackProperties
  const locations = await db
    .select({ location: rackLocations, content: locationContents })
    .from(rackLocations)
    .leftJoin(locationContents, eq(locationContents.locationId, rackLocations.id))
    .where(
      and(
        eq(rackLocations.elementId, elementId),
        lte(rackLocations.rowNumber, rows),
        lte(rackLocations.columnNumber, columns),
      ),
    )
    .orderBy(asc(rackLocations.rowNumber), asc(rackLocations.columnNumber))

  return {
    rack: { id: rack.id, warehouseId: rack.warehouseId, name: rack.name, code, rows, columns },
    locations: locations.map(({ location, content }) => toRackLocation(location, content)),
  }
}

function toRackLocation(
  location: { id: string; code: string; rowNumber: number; columnNumber: number },
  content: LocationContentRow | null,
): RackLocation {
  return {
    id: location.id,
    code: location.code,
    row: location.rowNumber,
    column: location.columnNumber,
    content: content ? toContentDto(content) : null,
  }
}

/** Finds an active location (inside the grid of a live rack) owned by the user. */
async function findOwnedLocation(ownerId: string, locationId: string) {
  const [location] = await getDb()
    .select({
      id: rackLocations.id,
      code: rackLocations.code,
      rowNumber: rackLocations.rowNumber,
      columnNumber: rackLocations.columnNumber,
      warehouseId: warehouseElements.warehouseId,
    })
    .from(rackLocations)
    .innerJoin(warehouseElements, eq(warehouseElements.id, rackLocations.elementId))
    .innerJoin(warehouses, eq(warehouses.id, warehouseElements.warehouseId))
    .where(and(eq(rackLocations.id, locationId), eq(warehouses.ownerId, ownerId), activeRack, locationWithinRackGrid))
    .limit(1)
  if (!location) throw notFound('Ubicación no encontrada')
  return location
}

export async function saveLocationContent(
  ownerId: string,
  locationId: string,
  input: z.output<typeof locationContentSchema>,
): Promise<RackLocation> {
  const location = await findOwnedLocation(ownerId, locationId)

  const content = await getDb().transaction(async (tx) => {
    const values = {
      articleCode: input.articleCode,
      description: input.description ?? null,
      quantity: input.quantity,
      lot: input.lot ?? null,
    }
    const [row] = await tx
      .insert(locationContents)
      .values({ ...values, locationId })
      .onConflictDoUpdate({ target: locationContents.locationId, set: values })
      .returning()
    await touchWarehouse(tx, location.warehouseId)
    return row
  })

  return toRackLocation(location, content)
}

export async function clearLocationContent(ownerId: string, locationId: string): Promise<RackLocation> {
  const location = await findOwnedLocation(ownerId, locationId)

  await getDb().transaction(async (tx) => {
    const removed = await tx
      .delete(locationContents)
      .where(eq(locationContents.locationId, locationId))
      .returning({ id: locationContents.id })
    if (removed.length > 0) await touchWarehouse(tx, location.warehouseId)
  })

  return toRackLocation(location, null)
}

export async function getWarehouseOccupancy(ownerId: string, warehouseId: string): Promise<RackOccupancy[]> {
  await assertWarehouseOwner(ownerId, warehouseId)

  const rows = await getDb()
    .select({
      elementId: rackLocations.elementId,
      row: rackLocations.rowNumber,
      column: rackLocations.columnNumber,
      columns: sql<number>`(${warehouseElements.properties}->>'columns')::int`,
    })
    .from(locationContents)
    .innerJoin(rackLocations, eq(rackLocations.id, locationContents.locationId))
    .innerJoin(warehouseElements, eq(warehouseElements.id, rackLocations.elementId))
    .where(and(eq(warehouseElements.warehouseId, warehouseId), activeRack, locationWithinRackGrid))

  const byRack = new Map<string, RackOccupancy>()
  for (const { elementId, row, column, columns } of rows) {
    let entry = byRack.get(elementId)
    if (!entry) {
      entry = {
        elementId,
        occupied: 0,
        occupiedByColumn: Array.from({ length: columns }, () => 0),
        maxOccupiedRow: 0,
        maxOccupiedColumn: 0,
      }
      byRack.set(elementId, entry)
    }
    entry.occupied += 1
    entry.occupiedByColumn[column - 1] += 1
    entry.maxOccupiedRow = Math.max(entry.maxOccupiedRow, row)
    entry.maxOccupiedColumn = Math.max(entry.maxOccupiedColumn, column)
  }

  return [...byRack.values()]
}

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`)

export async function searchLocations(
  ownerId: string,
  warehouseId: string,
  query: string,
): Promise<LocationSearchResult[]> {
  await assertWarehouseOwner(ownerId, warehouseId)
  const pattern = `%${escapeLikePattern(query)}%`

  const rows = await getDb()
    .select({
      location: rackLocations,
      content: locationContents,
      elementId: warehouseElements.id,
      elementName: warehouseElements.name,
      rackCode: sql<string>`${warehouseElements.properties}->>'code'`,
    })
    .from(locationContents)
    .innerJoin(rackLocations, eq(rackLocations.id, locationContents.locationId))
    .innerJoin(warehouseElements, eq(warehouseElements.id, rackLocations.elementId))
    .where(
      and(
        eq(warehouseElements.warehouseId, warehouseId),
        activeRack,
        locationWithinRackGrid,
        or(
          ilike(locationContents.articleCode, pattern),
          ilike(locationContents.description, pattern),
          ilike(locationContents.lot, pattern),
          ilike(rackLocations.code, pattern),
        ),
      ),
    )
    .orderBy(sql`upper(${locationContents.articleCode}) = ${query.toUpperCase()} desc`, asc(rackLocations.code))
    .limit(100)

  return rows.map(({ location, content, elementId, elementName, rackCode }) => ({
    locationId: location.id,
    locationCode: location.code,
    row: location.rowNumber,
    column: location.columnNumber,
    elementId,
    elementName,
    rackCode,
    content: toContentDto(content),
  }))
}
