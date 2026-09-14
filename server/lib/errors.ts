import type { ApiErrorCode, ValidationIssue } from '../../shared/api.js'

export class AppError extends Error {
  override name = 'AppError'
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details?: ValidationIssue[]

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: ValidationIssue[]) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, details?: ValidationIssue[]) =>
  new AppError(400, 'BAD_REQUEST', message, details)

export const unauthorized = (message = 'Necesitas iniciar sesión para continuar') =>
  new AppError(401, 'UNAUTHORIZED', message)

export const notFound = (message = 'Recurso no encontrado') => new AppError(404, 'NOT_FOUND', message)

export const conflict = (message: string) => new AppError(409, 'CONFLICT', message)
