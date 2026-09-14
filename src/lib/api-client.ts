import type { ApiErrorCode, ApiResponse, ValidationIssue } from '@shared/api'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR'

export class ApiError extends Error {
  override name = 'ApiError'
  readonly status: number
  readonly code: ClientErrorCode
  readonly details: ValidationIssue[]

  constructor(status: number, code: ClientErrorCode, message: string, details: ValidationIssue[] = []) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'No se puede conectar con el servidor. Comprueba tu conexión.')
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (payload?.success) return payload.data

  if (payload && !payload.success) {
    throw new ApiError(response.status, payload.code, payload.message, payload.details)
  }

  throw new ApiError(
    response.status,
    response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'BAD_REQUEST',
    'El servidor no responde correctamente. Inténtalo de nuevo en unos segundos.',
  )
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function getErrorMessage(error: unknown, fallback = 'Se ha producido un error inesperado'): string {
  return error instanceof ApiError ? error.message : fallback
}
