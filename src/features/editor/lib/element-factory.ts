import type { ElementType, WarehouseElement, ZoneCategory } from '@shared/elements'
import { nextRackCode } from '@shared/locations'
import { ELEMENT_META, ZONE_CATEGORY_META } from './catalog'
import { roundTo, type Point } from './geometry'

const ZONE_SEQUENCE: ZoneCategory[] = ['reception', 'picking', 'shipping', 'storage', 'production', 'quality']
const MAX_NAME_LENGTH = 80

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rackCodes = (elements: WarehouseElement[]) =>
  elements.flatMap((element) => (element.type === 'rack' ? [element.properties.code] : []))

export function nextSequentialName(prefix: string, elements: WarehouseElement[]): string {
  const pattern = new RegExp(`^${escapeRegExp(prefix)} (\\d+)$`)
  const highest = elements.reduce((max, element) => {
    const match = pattern.exec(element.name)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix} ${highest + 1}`
}

const copyName = (name: string) => `${name} (copia)`.slice(0, MAX_NAME_LENGTH)

/** Creates an element of the given type centered on `center` with sensible defaults. */
export function createElement(type: ElementType, center: Point, elements: WarehouseElement[]): WarehouseElement {
  const { width, height } = ELEMENT_META[type].defaultSize
  const base = {
    id: crypto.randomUUID(),
    x: roundTo(center.x - width / 2),
    y: roundTo(center.y - height / 2),
    width,
    height,
    rotation: 0,
    color: null,
  }

  switch (type) {
    case 'zone': {
      const used = new Set(elements.flatMap((element) => (element.type === 'zone' ? [element.properties.category] : [])))
      const category = ZONE_SEQUENCE.find((candidate) => !used.has(candidate))
      return category
        ? { ...base, type, name: ZONE_CATEGORY_META[category].label, properties: { category } }
        : { ...base, type, name: nextSequentialName('Zona', elements), properties: { category: 'other' } }
    }
    case 'rack': {
      const code = nextRackCode(rackCodes(elements))
      return { ...base, type, name: `Rack ${code}`, properties: { code, rows: 3, columns: 6 } }
    }
    case 'dock':
      return { ...base, type, name: nextSequentialName('Muelle', elements), properties: { direction: 'mixed' } }
    case 'door':
      return { ...base, type, name: nextSequentialName('Puerta', elements), properties: { kind: 'sectional' } }
    case 'obstacle':
      return { ...base, type, name: nextSequentialName('Columna', elements), properties: { kind: 'column' } }
  }
}

/** Copy with a new identity, shifted by `offset`; racks receive the next free code. */
export function duplicateElement(source: WarehouseElement, elements: WarehouseElement[], offset: number): WarehouseElement {
  const shifted = { id: crypto.randomUUID(), x: roundTo(source.x + offset), y: roundTo(source.y + offset) }

  if (source.type === 'rack') {
    const code = nextRackCode(rackCodes(elements))
    const name = source.name === `Rack ${source.properties.code}` ? `Rack ${code}` : copyName(source.name)
    return { ...source, ...shifted, name, properties: { ...source.properties, code } }
  }

  const sequence = /^(.*\S) \d+$/.exec(source.name)
  const name = sequence ? nextSequentialName(sequence[1], elements) : copyName(source.name)
  return { ...source, ...shifted, name }
}
