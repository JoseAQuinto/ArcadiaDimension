import { z } from 'zod'
import { LIMITS, warehouseElementSchema } from './elements.js'

/** Optional free text: blank strings become null, an omitted field stays undefined. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: máximo ${max} caracteres`)
    .nullish()
    .transform((value) => (value === undefined ? undefined : value || null))

const warehouseDimension = (label: string) =>
  z
    .number(`${label} debe ser un número`)
    .min(LIMITS.warehouseMinSize, `${label}: mínimo ${LIMITS.warehouseMinSize} m`)
    .max(LIMITS.warehouseMaxSize, `${label}: máximo ${LIMITS.warehouseMaxSize} m`)

/* ---------------------------------- Auth ---------------------------------- */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email demasiado largo')
  .pipe(z.email('Introduce un email válido'))

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Introduce tu contraseña').max(128),
})

export type RegisterInput = z.input<typeof registerSchema>
export type LoginInput = z.input<typeof loginSchema>

/* ------------------------------- Warehouses ------------------------------- */

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80, 'Máximo 80 caracteres'),
  description: optionalText(500, 'Descripción'),
  width: warehouseDimension('El ancho'),
  height: warehouseDimension('El alto'),
})

export const updateWarehouseSchema = createWarehouseSchema
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'No hay cambios que guardar',
  })

export type CreateWarehouseInput = z.input<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.input<typeof updateWarehouseSchema>

/* --------------------------------- Layout --------------------------------- */

export const saveLayoutSchema = z
  .object({
    baseVersion: z.int().min(0),
    elements: z
      .array(warehouseElementSchema)
      .max(LIMITS.maxElementsPerLayout, `Un plano admite como máximo ${LIMITS.maxElementsPerLayout} elementos`),
  })
  .superRefine(({ elements }, ctx) => {
    const ids = new Set<string>()
    const rackCodes = new Set<string>()
    elements.forEach((element, index) => {
      if (ids.has(element.id)) {
        ctx.addIssue({ code: 'custom', message: 'Identificador de elemento duplicado', path: ['elements', index, 'id'] })
      }
      ids.add(element.id)

      if (element.type === 'rack') {
        const { code } = element.properties
        if (rackCodes.has(code)) {
          ctx.addIssue({
            code: 'custom',
            message: `El código de rack "${code}" está duplicado`,
            path: ['elements', index, 'properties', 'code'],
          })
        }
        rackCodes.add(code)
      }
    })
  })

export type SaveLayoutInput = z.input<typeof saveLayoutSchema>

/* -------------------------------- Locations ------------------------------- */

export const locationContentSchema = z.object({
  articleCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'El artículo es obligatorio')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[A-Z0-9][A-Z0-9._\-/]*$/, 'Usa letras, números y los símbolos . _ - /'),
  description: optionalText(160, 'Descripción'),
  quantity: z
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser mayor que 0')
    .max(1_000_000_000, 'Cantidad demasiado grande'),
  lot: optionalText(40, 'Lote'),
})

export type LocationContentInput = z.input<typeof locationContentSchema>

/* ------------------------------ Common params ----------------------------- */

export const idParamSchema = z.object({ id: z.uuid('Identificador no válido') })

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 caracteres').max(60, 'Búsqueda demasiado larga'),
})
