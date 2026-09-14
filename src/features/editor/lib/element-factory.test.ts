import { describe, expect, it } from 'vitest'
import type { WarehouseElement } from '@shared/elements'
import { warehouseElementSchema } from '@shared/elements'
import { createElement, duplicateElement, nextSequentialName } from './element-factory'

describe('createElement', () => {
  it('creates valid elements centered on the given point', () => {
    for (const type of ['zone', 'rack', 'dock', 'door', 'obstacle'] as const) {
      const element = createElement(type, { x: 50, y: 40 }, [])
      expect(warehouseElementSchema.safeParse(element).success).toBe(true)
      expect(element.x + element.width / 2).toBeCloseTo(50)
      expect(element.y + element.height / 2).toBeCloseTo(40)
    }
  })

  it('assigns consecutive rack codes and zone categories', () => {
    const elements: WarehouseElement[] = []
    const rackA = createElement('rack', { x: 0, y: 0 }, elements)
    elements.push(rackA)
    const rackB = createElement('rack', { x: 0, y: 0 }, elements)

    expect(rackA.name).toBe('Rack A')
    expect(rackB).toMatchObject({ name: 'Rack B', properties: { code: 'B' } })

    const reception = createElement('zone', { x: 0, y: 0 }, [])
    const picking = createElement('zone', { x: 0, y: 0 }, [reception])
    expect(reception).toMatchObject({ name: 'Recepción', properties: { category: 'reception' } })
    expect(picking).toMatchObject({ name: 'Picking', properties: { category: 'picking' } })
  })
})

describe('duplicateElement', () => {
  it('gives duplicated racks a new id and the next free code', () => {
    const rack = createElement('rack', { x: 10, y: 10 }, [])
    const copy = duplicateElement(rack, [rack], 1)

    expect(copy.id).not.toBe(rack.id)
    expect(copy).toMatchObject({ name: 'Rack B', x: rack.x + 1, y: rack.y + 1, properties: { code: 'B', rows: 3 } })
  })

  it('continues numbered names and marks other copies', () => {
    const dock = createElement('dock', { x: 0, y: 0 }, [])
    expect(duplicateElement(dock, [dock], 1).name).toBe('Muelle 2')

    const zone = { ...createElement('zone', { x: 0, y: 0 }, []), name: 'Recepción norte' }
    expect(duplicateElement(zone, [zone], 1).name).toBe('Recepción norte (copia)')
  })
})

describe('nextSequentialName', () => {
  it('uses the highest existing number', () => {
    const docks = [1, 4].map((n) => ({ ...createElement('dock', { x: 0, y: 0 }, []), name: `Muelle ${n}` }))
    expect(nextSequentialName('Muelle', docks)).toBe('Muelle 5')
  })
})
