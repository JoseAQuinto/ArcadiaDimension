import { and, asc, eq, inArray, isNull, ne, notExists, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { SaveLayoutResult, WarehouseLayout } from '../../../shared/api.js'
import type { saveLayoutSchema } from '../../../shared/schemas.js'
import { getDb, type Transaction } from '../../db/client.js'
import { toElementDto } from '../../db/mappers.js'
import { locationContents, rackLocations, warehouseElements, warehouses } from '../../db/schema.js'
import { badRequest, conflict, notFound } from '../../lib/errors.js'
import { getWarehouse } from '../warehouses/warehouses.service.js'
import { planLayoutChanges, type RackGridSync } from './layout-plan.js'

export async function getLayout(ownerId: string, warehouseId: string): Promise<WarehouseLayout> {
  const db = getDb()
  const warehouse = await getWarehouse(ownerId, warehouseId, db)
  const rows = await db
    .select()
    .from(warehouseElements)
    .where(and(eq(warehouseElements.warehouseId, warehouseId), isNull(warehouseElements.deletedAt)))
    .orderBy(asc(warehouseElements.sortOrder), asc(warehouseElements.createdAt))

  return { warehouse, elements: rows.map(toElementDto) }
}

/**
 * Persists the whole layout atomically. The editor always sends the complete
 * element list; only the differences are written. `baseVersion` provides
 * optimistic concurrency between browser tabs.
 */
export async function saveLayout(
  ownerId: string,
  warehouseId: string,
  input: z.output<typeof saveLayoutSchema>,
): Promise<SaveLayoutResult> {
  return getDb().transaction(async (tx) => {
    const [warehouse] = await tx
      .select({ layoutVersion: warehouses.layoutVersion, updatedAt: warehouses.updatedAt })
      .from(warehouses)
      .where(and(eq(warehouses.id, warehouseId), eq(warehouses.ownerId, ownerId)))
      .for('update')

    if (!warehouse) throw notFound('Almacén no encontrado')
    if (warehouse.layoutVersion !== input.baseVersion) {
      throw conflict('El plano se ha modificado desde otra sesión. Recarga para ver la versión más reciente.')
    }

    const incomingIds = input.elements.map((element) => element.id)
    if (incomingIds.length > 0) {
      const [foreign] = await tx
        .select({ id: warehouseElements.id })
        .from(warehouseElements)
        .where(and(inArray(warehouseElements.id, incomingIds), ne(warehouseElements.warehouseId, warehouseId)))
        .limit(1)
      if (foreign) throw badRequest('El plano contiene elementos que pertenecen a otro almacén')
    }

    const stored = await tx
      .select({
        id: warehouseElements.id,
        type: warehouseElements.type,
        name: warehouseElements.name,
        x: warehouseElements.x,
        y: warehouseElements.y,
        width: warehouseElements.width,
        height: warehouseElements.height,
        rotation: warehouseElements.rotation,
        color: warehouseElements.color,
        properties: warehouseElements.properties,
        sortOrder: warehouseElements.sortOrder,
        deletedAt: warehouseElements.deletedAt,
      })
      .from(warehouseElements)
      .where(eq(warehouseElements.warehouseId, warehouseId))

    const plan = planLayoutChanges(stored, input.elements)
    if (!plan.hasChanges) {
      return { layoutVersion: warehouse.layoutVersion, updatedAt: warehouse.updatedAt.toISOString() }
    }

    if (plan.writes.length > 0) {
      await tx
        .insert(warehouseElements)
        .values(plan.writes.map((write) => ({ ...write, type: write.type as (typeof stored)[number]['type'], warehouseId })))
        .onConflictDoUpdate({
          target: warehouseElements.id,
          set: {
            type: sql`excluded.type`,
            name: sql`excluded.name`,
            x: sql`excluded.x`,
            y: sql`excluded.y`,
            width: sql`excluded.width`,
            height: sql`excluded.height`,
            rotation: sql`excluded.rotation`,
            color: sql`excluded.color`,
            properties: sql`excluded.properties`,
            sortOrder: sql`excluded.sort_order`,
            deletedAt: sql`null`,
          },
          setWhere: sql`warehouse_elements.warehouse_id = excluded.warehouse_id`,
        })
    }

    if (plan.removedIds.length > 0) await removeElements(tx, plan.removedIds)
    if (plan.rackSyncs.length > 0) await syncRackLocations(tx, plan.rackSyncs)

    const [updated] = await tx
      .update(warehouses)
      .set({ layoutVersion: sql`${warehouses.layoutVersion} + 1`, updatedAt: sql`now()` })
      .where(eq(warehouses.id, warehouseId))
      .returning({ layoutVersion: warehouses.layoutVersion, updatedAt: warehouses.updatedAt })

    return { layoutVersion: updated.layoutVersion, updatedAt: updated.updatedAt.toISOString() }
  })
}

/**
 * Elements without stock are deleted. Racks that still hold stock are soft
 * deleted so an undo in the editor restores them together with their contents.
 */
async function removeElements(tx: Transaction, ids: string[]): Promise<void> {
  const occupiedLocation = tx
    .select({ one: sql`1` })
    .from(rackLocations)
    .innerJoin(locationContents, eq(locationContents.locationId, rackLocations.id))
    .where(eq(rackLocations.elementId, warehouseElements.id))

  await tx.delete(warehouseElements).where(and(inArray(warehouseElements.id, ids), notExists(occupiedLocation)))
  await tx
    .update(warehouseElements)
    .set({ deletedAt: sql`now()` })
    .where(and(inArray(warehouseElements.id, ids), isNull(warehouseElements.deletedAt)))
}

/** Creates missing locations, renames codes and drops empty locations outside the grid. */
async function syncRackLocations(tx: Transaction, racks: RackGridSync[]): Promise<void> {
  const payload = JSON.stringify(
    racks.map((rack) => ({ element_id: rack.elementId, code: rack.code, rack_rows: rack.rows, rack_columns: rack.columns })),
  )
  const racksCte = sql`with racks as (
    select * from jsonb_to_recordset(${payload}::jsonb)
      as r(element_id uuid, code text, rack_rows int, rack_columns int)
  )`
  const codeOf = (row: string, column: string) =>
    sql.raw(`racks.code || '-' || lpad(${row}::text, 2, '0') || '-' || lpad(${column}::text, 2, '0')`)

  await tx.execute(sql`${racksCte}
    update rack_locations l
    set code = ${codeOf('l.row_number', 'l.column_number')}
    from racks
    where l.element_id = racks.element_id
      and l.code <> ${codeOf('l.row_number', 'l.column_number')}`)

  await tx.execute(sql`${racksCte}
    insert into rack_locations (element_id, row_number, column_number, code)
    select racks.element_id, r.n, c.n, ${codeOf('r.n', 'c.n')}
    from racks
    cross join lateral generate_series(1, racks.rack_rows) as r(n)
    cross join lateral generate_series(1, racks.rack_columns) as c(n)
    on conflict (element_id, row_number, column_number) do nothing`)

  await tx.execute(sql`${racksCte}
    delete from rack_locations l
    using racks
    where l.element_id = racks.element_id
      and (l.row_number > racks.rack_rows or l.column_number > racks.rack_columns)
      and not exists (select 1 from location_contents c where c.location_id = l.id)`)
}
