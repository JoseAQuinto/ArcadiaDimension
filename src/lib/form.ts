import type { z } from 'zod'
import { ApiError } from './api-client'

export type FieldErrors = Partial<Record<string, string>>

/** First message per top-level field of a Zod error. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    errors[field] ??= issue.message
  }
  return errors
}

/** Field errors returned by the API validation layer. */
export function apiFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {}
  const errors: FieldErrors = {}
  for (const detail of error.details) {
    const field = detail.path.split('.')[0] || 'form'
    errors[field] ??= detail.message
  }
  return errors
}

/** Parses the value of a numeric input; blank strings become NaN so the schema reports them. */
export const parseNumberInput = (value: string) => (value.trim() === '' ? Number.NaN : Number(value.replace(',', '.')))
