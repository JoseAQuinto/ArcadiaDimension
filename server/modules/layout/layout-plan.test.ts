import { describe, expect, it } from 'vitest'
import type { WarehouseElement } from '../../../shared/elements.js'
import { planLayoutChanges, type StoredElement } from './layout-plan.js'

const RACK_ID = '5b4c2f0e-8d3a-4f7b-9c1e-2a6d8e0f1b3c'
const ZONE_ID = '7e9a1c3d-5f2b-4a8e-b6c0-d4e2f8a1b5c7'

const rack: WarehouseElement = {
  id: RACK_ID,
  type: 'rack',
  name: 'Rack A',
  x: 10,
  y: 20,
  width: 12,
  height: 1.2,
  rotation: 0,
  color: null,
  properties: { code: 'A', rows: 3, columns: 5 },
}

const zone: WarehouseElement = {
  id: ZONE_ID,
  type: 'zone',
  name: 'Recepción',
  x: 0,
  y: 0,
  width: 20,
  height: 10,
  rotation: 0,
  color: null,
  properties: { category: 'reception' },
}

const stored = (element: WarehouseElement, sortOrder: number, deletedAt: Date | null = null): StoredElement => ({
  ...element,
  // jsonb does not preserve key order
  properties: Object.fromEntries(Object.entries(element.properties).reverse()),
  sortOrder,
  deletedAt,
})

describe('planLayoutChanges', () => {
  it('creates new elements and generates locations for new racks', () => {
    const plan = planLayoutChanges([], [zone, rack])

    expect(plan.writes.map((write) => write.id)).toEqual([ZONE_ID, RACK_ID])
    expect(plan.writes[1].sortOrder).toBe(1)
    expect(plan.rackSyncs).toEqual([{ elementId: RACK_ID, code: 'A', rows: 3, columns: 5 }])
    expect(plan.hasChanges).toBe(true)
  })

  it('does nothing when the layout is unchanged', () => {
    const plan = planLayoutChanges([stored(zone, 0), stored(rack, 1)], [zone, rack])

    expect(plan).toEqual({ writes: [], removedIds: [], rackSyncs: [], hasChanges: false })
  })

  it('updates moved elements without regenerating rack locations', () => {
    const plan = planLayoutChanges([stored(rack, 0)], [{ ...rack, x: 42, rotation: 90 }])

    expect(plan.writes).toHaveLength(1)
    expect(plan.rackSyncs).toEqual([])
  })

  it('regenerates locations when the rack grid or code changes', () => {
    const resized = { ...rack, properties: { code: 'A', rows: 4, columns: 5 } }
    expect(planLayoutChanges([stored(rack, 0)], [resized]).rackSyncs).toHaveLength(1)

    const renamed = { ...rack, properties: { code: 'B', rows: 3, columns: 5 } }
    expect(planLayoutChanges([stored(rack, 0)], [renamed]).rackSyncs).toHaveLength(1)
  })

  it('removes elements missing from the layout and restores soft-deleted ones', () => {
    const removal = planLayoutChanges([stored(zone, 0), stored(rack, 1)], [zone])
    expect(removal.removedIds).toEqual([RACK_ID])

    const restore = planLayoutChanges([stored(rack, 0, new Date())], [rack])
    expect(restore.writes).toHaveLength(1)
    expect(restore.removedIds).toEqual([])
    expect(restore.rackSyncs).toHaveLength(1)
  })

  it('treats a new drawing order as a change', () => {
    const plan = planLayoutChanges([stored(zone, 0), stored(rack, 1)], [rack, zone])
    expect(plan.writes.map((write) => write.sortOrder)).toEqual([0, 1])
  })
})
