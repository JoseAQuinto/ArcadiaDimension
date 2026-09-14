/**
 * Vercel serverless entry point. vercel.json rewrites every /api/* request to
 * this function; Fastify then routes it using the original URL.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../server/app.js'
import { restoreApiPath } from '../server/lib/request-url.js'

const app = buildApp({ logger: true })
const ready = app.ready()

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await ready
  request.url = restoreApiPath(request.url)
  app.server.emit('request', request, response)
}
