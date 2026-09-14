/**
 * Vercel serverless entry point. vercel.json rewrites every /api/* request to
 * this function; Fastify then routes it using the original URL.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../server/app.js'

const app = buildApp({ logger: true })
const ready = app.ready()

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await ready
  app.server.emit('request', request, response)
}
