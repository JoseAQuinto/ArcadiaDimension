/**
 * Serverless rewrites can deliver `/api/<path>` as `/api?path=<path>`.
 * Restores the original route so Fastify can match it; other URLs are untouched.
 */
export function restoreApiPath(url = '/'): string {
  const parsed = new URL(url, 'http://localhost')
  const path = parsed.searchParams.get('path')
  if (parsed.pathname !== '/api' || path === null) return url

  parsed.searchParams.delete('path')
  return `/api/${path.replace(/^\/+/, '')}${parsed.search}`
}
