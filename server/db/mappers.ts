import type { LocationContent, User, Warehouse } from '../../shared/api.js'
import type { WarehouseElement } from '../../shared/elements.js'
import type { LocationContentRow, UserRow, WarehouseElementRow, WarehouseRow } from './schema.js'

export function toUserDto(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt.toISOString() }
}

export function toWarehouseDto(row: WarehouseRow): Warehouse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    width: row.width,
    height: row.height,
    layoutVersion: row.layoutVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

type ElementColumns = Pick<
  WarehouseElementRow,
  'id' | 'type' | 'name' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'color' | 'properties'
>

/** Rows were validated against the element schema when they were written. */
export function toElementDto(row: ElementColumns): WarehouseElement {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    color: row.color,
    properties: row.properties,
  } as WarehouseElement
}

export function toContentDto(row: LocationContentRow): LocationContent {
  return {
    id: row.id,
    articleCode: row.articleCode,
    description: row.description,
    quantity: row.quantity,
    lot: row.lot,
    updatedAt: row.updatedAt.toISOString(),
  }
}
