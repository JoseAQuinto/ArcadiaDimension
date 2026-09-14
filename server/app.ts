import cookie from '@fastify/cookie'
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify'
import type { ApiErrorCode, ApiFailure, ValidationIssue } from '../shared/api.js'
import { ConfigurationError } from './config/env.js'
import { getErrorCode } from './lib/db-errors.js'
import { AppError } from './lib/errors.js'
import { ok } from './lib/http.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { locationRoutes } from './modules/locations/locations.routes.js'
import { warehouseRoutes } from './modules/warehouses/warehouses.routes.js'

interface BuildAppOptions {
  logger?: boolean
}

const failure = (code: ApiErrorCode, message: string, details?: ValidationIssue[]): ApiFailure => ({
  success: false,
  code,
  message,
  ...(details ? { details } : {}),
})

const CONNECTION_ERROR_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01', '53300'])

const CLIENT_ERROR_MESSAGES: Record<string, string> = {
  FST_ERR_CTP_BODY_TOO_LARGE: 'La petición es demasiado grande',
  FST_ERR_CTP_INVALID_MEDIA_TYPE: 'Tipo de contenido no soportado',
  FST_ERR_CTP_EMPTY_JSON_BODY: 'El cuerpo de la petición está vacío',
  FST_ERR_CTP_INVALID_JSON_BODY: 'El cuerpo de la petición no es un JSON válido',
}

export function buildApp({ logger = false }: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: logger ? { level: process.env.LOG_LEVEL ?? 'info' } : false,
    bodyLimit: 2 * 1024 * 1024,
    trustProxy: true,
  })

  app.register(cookie)

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(failure(error.code, error.message, error.details))
    }

    if (error instanceof ConfigurationError) {
      request.log.error(error.message)
      return reply
        .code(503)
        .send(failure('SERVICE_UNAVAILABLE', 'El servidor no está configurado correctamente. Revisa las variables de entorno.'))
    }

    const errorCode = getErrorCode(error)
    if (errorCode === '42P01') {
      request.log.error(error)
      return reply
        .code(503)
        .send(failure('SERVICE_UNAVAILABLE', 'La base de datos no está inicializada. Ejecuta database/schema.sql.'))
    }
    if (errorCode && CONNECTION_ERROR_CODES.has(errorCode)) {
      request.log.error(error)
      return reply
        .code(503)
        .send(failure('SERVICE_UNAVAILABLE', 'No se puede conectar con la base de datos. Inténtalo de nuevo en unos segundos.'))
    }

    if (typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
      const message = CLIENT_ERROR_MESSAGES[error.code] ?? 'La petición no es válida'
      return reply.code(error.statusCode).send(failure('BAD_REQUEST', message))
    }

    request.log.error(error)
    return reply.code(500).send(failure('INTERNAL_ERROR', 'Se ha producido un error inesperado. Inténtalo de nuevo.'))
  })

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send(failure('NOT_FOUND', 'Ruta no encontrada'))
  })

  app.register(
    async (api) => {
      api.get('/health', async () => ok({ status: 'ok' }))
      await api.register(authRoutes, { prefix: '/auth' })
      await api.register(warehouseRoutes, { prefix: '/warehouses' })
      await api.register(locationRoutes)
    },
    { prefix: '/api' },
  )

  return app
}
