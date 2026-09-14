import type { ElementType, WarehouseElement } from './elements.js'

/* -------------------------------- Envelope -------------------------------- */

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ValidationIssue {
  path: string
  message: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiFailure {
  success: false
  code: ApiErrorCode
  message: string
  details?: ValidationIssue[]
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

/* ---------------------------------- Auth ---------------------------------- */

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

/* ------------------------------- Warehouses ------------------------------- */

export interface Warehouse {
  id: string
  name: string
  description: string | null
  width: number
  height: number
  layoutVersion: number
  createdAt: string
  updatedAt: string
}

export interface WarehouseStats {
  elements: number
  racks: number
  locations: number
  occupiedLocations: number
}

/** Geometry-only projection of an element, used to draw dashboard thumbnails. */
export interface PreviewShape {
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  color: string | null
  variant: string | null
}

export interface WarehouseSummary extends Warehouse {
  stats: WarehouseStats
  preview: PreviewShape[]
}

/* --------------------------------- Layout --------------------------------- */

export interface WarehouseLayout {
  warehouse: Warehouse
  elements: WarehouseElement[]
}

export interface SaveLayoutResult {
  layoutVersion: number
  updatedAt: string
}

export interface RackOccupancy {
  elementId: string
  occupied: number
  /** Occupied locations per column; index 0 is column 1. */
  occupiedByColumn: number[]
  /** Highest occupied row / column, 0 when the rack is empty. */
  maxOccupiedRow: number
  maxOccupiedColumn: number
}

/* -------------------------------- Locations ------------------------------- */

export interface LocationContent {
  id: string
  articleCode: string
  description: string | null
  quantity: number
  lot: string | null
  updatedAt: string
}

export interface RackLocation {
  id: string
  code: string
  row: number
  column: number
  content: LocationContent | null
}

export interface RackLocations {
  rack: {
    id: string
    warehouseId: string
    name: string
    code: string
    rows: number
    columns: number
  }
  locations: RackLocation[]
}

export interface LocationSearchResult {
  locationId: string
  locationCode: string
  row: number
  column: number
  elementId: string
  elementName: string
  rackCode: string
  content: LocationContent
}
