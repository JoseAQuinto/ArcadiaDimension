import type { WarehouseElement } from '../../../shared/elements.js'

export interface StoredElement {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string | null
  properties: Record<string, unknown>
  sortOrder: number
  deletedAt: Date | null
}

export type ElementWrite = Omit<StoredElement, 'deletedAt'>

export interface RackGridSync {
  elementId: string
  code: string
  rows: number
  columns: number
}

export interface LayoutPlan {
  /** New, modified or restored elements (upserted in a single statement). */
  writes: ElementWrite[]
  /** Active elements that are no longer part of the layout. */
  removedIds: string[]
  /** Racks whose locations must be (re)generated. */
  rackSyncs: RackGridSync[]
  hasChanges: boolean
}

const GEOMETRY_KEYS = ['type', 'name', 'x', 'y', 'width', 'height', 'rotation', 'color', 'sortOrder'] as const

function sameProperties(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

function sameRackGrid(stored: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  return stored.code === incoming.code && stored.rows === incoming.rows && stored.columns === incoming.columns
}

/**
 * Compares the stored layout with the one sent by the editor and returns the
 * minimum set of writes. Pure function: the service applies the plan.
 */
export function planLayoutChanges(stored: StoredElement[], incoming: WarehouseElement[]): LayoutPlan {
  const storedById = new Map(stored.map((element) => [element.id, element]))
  const incomingIds = new Set(incoming.map((element) => element.id))
  const writes: ElementWrite[] = []
  const rackSyncs: RackGridSync[] = []

  incoming.forEach((element, index) => {
    const write: ElementWrite = {
      id: element.id,
      type: element.type,
      name: element.name,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      color: element.color,
      properties: element.properties,
      sortOrder: index,
    }
    const current = storedById.get(element.id)

    const unchanged =
      current !== undefined &&
      current.deletedAt === null &&
      GEOMETRY_KEYS.every((key) => current[key] === write[key]) &&
      sameProperties(current.properties, write.properties)
    if (!unchanged) writes.push(write)

    const gridUnchanged =
      current !== undefined &&
      current.deletedAt === null &&
      current.type === 'rack' &&
      sameRackGrid(current.properties, element.properties)
    if (element.type === 'rack' && !gridUnchanged) {
      rackSyncs.push({
        elementId: element.id,
        code: element.properties.code,
        rows: element.properties.rows,
        columns: element.properties.columns,
      })
    }
  })

  const removedIds = stored
    .filter((element) => element.deletedAt === null && !incomingIds.has(element.id))
    .map((element) => element.id)

  return { writes, removedIds, rackSyncs, hasChanges: writes.length > 0 || removedIds.length > 0 }
}
