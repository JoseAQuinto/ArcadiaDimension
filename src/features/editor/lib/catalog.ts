import { Columns3, Construction, DoorOpen, SquareDashed, Truck, type LucideIcon } from 'lucide-react'
import type {
  DockDirection,
  DoorKind,
  ElementType,
  ObstacleKind,
  WarehouseElement,
  ZoneCategory,
} from '@shared/elements'

export interface ElementTypeMeta {
  label: string
  plural: string
  description: string
  icon: LucideIcon
  defaultSize: { width: number; height: number }
}

/** Default sizes are realistic, in meters. */
export const ELEMENT_META: Record<ElementType, ElementTypeMeta> = {
  zone: {
    label: 'Zona',
    plural: 'Zonas',
    description: 'Área funcional: recepción, picking, expediciones…',
    icon: SquareDashed,
    defaultSize: { width: 20, height: 12 },
  },
  rack: {
    label: 'Rack',
    plural: 'Racks',
    description: 'Estantería con ubicaciones por filas y columnas',
    icon: Columns3,
    defaultSize: { width: 12, height: 2.4 },
  },
  dock: {
    label: 'Muelle',
    plural: 'Muelles',
    description: 'Punto de carga y descarga de camiones',
    icon: Truck,
    defaultSize: { width: 4, height: 3 },
  },
  door: {
    label: 'Puerta',
    plural: 'Puertas',
    description: 'Acceso peatonal, seccional o de emergencia',
    icon: DoorOpen,
    defaultSize: { width: 3, height: 0.4 },
  },
  obstacle: {
    label: 'Obstáculo',
    plural: 'Obstáculos',
    description: 'Columna, pared o maquinaria fija',
    icon: Construction,
    defaultSize: { width: 1, height: 1 },
  },
}

export const ELEMENT_TYPE_ORDER: ElementType[] = ['zone', 'rack', 'dock', 'door', 'obstacle']

/** Drawing layers: zones always stay below everything else. */
export const ELEMENT_LAYER: Record<ElementType, number> = { zone: 0, obstacle: 1, dock: 2, door: 3, rack: 4 }

export const ZONE_CATEGORY_META: Record<ZoneCategory, { label: string; color: string }> = {
  reception: { label: 'Recepción', color: '#3b82f6' },
  picking: { label: 'Picking', color: '#8b5cf6' },
  shipping: { label: 'Expediciones', color: '#f97316' },
  production: { label: 'Producción', color: '#14b8a6' },
  storage: { label: 'Almacenaje', color: '#64748b' },
  quality: { label: 'Calidad', color: '#ec4899' },
  other: { label: 'Otra', color: '#0ea5e9' },
}

export const DOCK_DIRECTION_LABELS: Record<DockDirection, string> = {
  inbound: 'Entrada',
  outbound: 'Salida',
  mixed: 'Entrada y salida',
}

export const DOOR_KIND_META: Record<DoorKind, { label: string; color: string }> = {
  personnel: { label: 'Peatonal', color: '#0369a1' },
  sectional: { label: 'Seccional (vehículos)', color: '#0f766e' },
  emergency: { label: 'Emergencia', color: '#16a34a' },
}

export const OBSTACLE_KIND_META: Record<ObstacleKind, { label: string; color: string }> = {
  column: { label: 'Columna', color: '#475569' },
  wall: { label: 'Pared', color: '#334155' },
  machine: { label: 'Maquinaria', color: '#78716c' },
  other: { label: 'Otro', color: '#64748b' },
}

export const DOCK_COLOR = '#d97706'
export const RACK_COLOR = '#475569'

export const COLOR_SWATCHES = [
  '#3b82f6',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#0ea5e9',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#64748b',
]

export function getDefaultColor(type: ElementType, variant: string | null): string {
  switch (type) {
    case 'zone':
      return ZONE_CATEGORY_META[variant as ZoneCategory]?.color ?? ZONE_CATEGORY_META.other.color
    case 'door':
      return DOOR_KIND_META[variant as DoorKind]?.color ?? DOOR_KIND_META.personnel.color
    case 'obstacle':
      return OBSTACLE_KIND_META[variant as ObstacleKind]?.color ?? OBSTACLE_KIND_META.other.color
    case 'dock':
      return DOCK_COLOR
    case 'rack':
      return RACK_COLOR
  }
}

export function getElementVariant(element: WarehouseElement): string | null {
  switch (element.type) {
    case 'zone':
      return element.properties.category
    case 'door':
    case 'obstacle':
      return element.properties.kind
    case 'dock':
      return element.properties.direction
    case 'rack':
      return null
  }
}

export function getElementColor(element: WarehouseElement): string {
  return element.color ?? getDefaultColor(element.type, getElementVariant(element))
}

export function getVariantLabel(element: WarehouseElement): string {
  switch (element.type) {
    case 'zone':
      return ZONE_CATEGORY_META[element.properties.category].label
    case 'door':
      return DOOR_KIND_META[element.properties.kind].label
    case 'obstacle':
      return OBSTACLE_KIND_META[element.properties.kind].label
    case 'dock':
      return DOCK_DIRECTION_LABELS[element.properties.direction]
    case 'rack':
      return `${element.properties.rows} × ${element.properties.columns}`
  }
}
