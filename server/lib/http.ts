import type { z } from 'zod'
import type { ApiSuccess } from '../../shared/api.js'
import { AppError } from './errors.js'

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

/** Parses untrusted input and throws a 400 with every validation issue. */
export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input)
  if (result.success) return result.data

  const details = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))
  throw new AppError(400, 'VALIDATION_ERROR', details[0]?.message ?? 'Datos no válidos', details)
}
