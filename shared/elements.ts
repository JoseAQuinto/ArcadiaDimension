import { z } from 'zod'

export const ELEMENT_TYPES = ['zone', 'rack', 'dock', 'door', 'obstacle'] as const
export type ElementType = (typeof ELEMENT_TYPES)[number]

export const ZONE_CATEGORIES = [
  'reception',
  'picking',
  'shipping',
  'production',
  'storage',
  'quality',
  'other',
] as const
export type ZoneCategory = (typeof ZONE_CATEGORIES)[number]

export const DOCK_DIRECTIONS = ['inbound', 'outbound', 'mixed'] as const
export type DockDirection = (typeof DOCK_DIRECTIONS)[number]

export const DOOR_KINDS = ['personnel', 'sectional', 'emergency'] as const
export type DoorKind = (typeof DOOR_KINDS)[number]

export const OBSTACLE_KINDS = ['column', 'wall', 'machine', 'other'] as const
export type ObstacleKind = (typeof OBSTACLE_KINDS)[number]

/** All distances are expressed in meters. */
export const LIMITS = {
  warehouseMinSize: 5,
  warehouseMaxSize: 2000,
  elementMinSize: 0.2,
  elementMaxSize: 2000,
  maxCoordinate: 10_000,
  rackMaxRows: 20,
  rackMaxColumns: 60,
  maxElementsPerLayout: 2000,
} as const

export const RACK_CODE_PATTERN = /^[A-Z0-9]{1,6}$/

const coordinate = z
  .number('Debe ser un número')
  .min(-LIMITS.maxCoordinate, 'Coordenada fuera de rango')
  .max(LIMITS.maxCoordinate, 'Coordenada fuera de rango')

const size = z
  .number('Debe ser un número')
  .min(LIMITS.elementMinSize, `El tamaño mínimo es ${LIMITS.elementMinSize} m`)
  .max(LIMITS.elementMaxSize, `El tamaño máximo es ${LIMITS.elementMaxSize} m`)

const baseElementShape = {
  id: z.uuid('Identificador de elemento no válido'),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
  x: coordinate,
  y: coordinate,
  width: size,
  height: size,
  rotation: z.number().min(0).lt(360, 'La rotación debe estar entre 0 y 359°'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color no válido')
    .nullable(),
}

export const rackCodeSchema = z
  .string()
  .trim()
  .regex(RACK_CODE_PATTERN, 'Código de 1 a 6 caracteres: letras mayúsculas o números')

export const zoneElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('zone'),
  properties: z.object({ category: z.enum(ZONE_CATEGORIES) }),
})

export const rackElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('rack'),
  properties: z.object({
    code: rackCodeSchema,
    rows: z.int().min(1, 'Mínimo 1 fila').max(LIMITS.rackMaxRows, `Máximo ${LIMITS.rackMaxRows} filas`),
    columns: z
      .int()
      .min(1, 'Mínimo 1 columna')
      .max(LIMITS.rackMaxColumns, `Máximo ${LIMITS.rackMaxColumns} columnas`),
  }),
})

export const dockElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('dock'),
  properties: z.object({ direction: z.enum(DOCK_DIRECTIONS) }),
})

export const doorElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('door'),
  properties: z.object({ kind: z.enum(DOOR_KINDS) }),
})

export const obstacleElementSchema = z.object({
  ...baseElementShape,
  type: z.literal('obstacle'),
  properties: z.object({ kind: z.enum(OBSTACLE_KINDS) }),
})

export const warehouseElementSchema = z.discriminatedUnion('type', [
  zoneElementSchema,
  rackElementSchema,
  dockElementSchema,
  doorElementSchema,
  obstacleElementSchema,
])

export type WarehouseElement = z.infer<typeof warehouseElementSchema>
export type ZoneElement = z.infer<typeof zoneElementSchema>
export type RackElement = z.infer<typeof rackElementSchema>
export type DockElement = z.infer<typeof dockElementSchema>
export type DoorElement = z.infer<typeof doorElementSchema>
export type ObstacleElement = z.infer<typeof obstacleElementSchema>

export type ElementOfType<T extends ElementType> = Extract<WarehouseElement, { type: T }>
export type RackProperties = RackElement['properties']

export function isRack(element: WarehouseElement): element is RackElement {
  return element.type === 'rack'
}
