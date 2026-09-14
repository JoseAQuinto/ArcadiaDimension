import type { FastifyInstance } from 'fastify'
import { idParamSchema, locationContentSchema } from '../../../shared/schemas.js'
import { requireAuth } from '../../lib/auth.js'
import { ok, parseInput } from '../../lib/http.js'
import { clearLocationContent, getRackLocations, saveLocationContent } from './locations.service.js'

export async function locationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  app.get('/racks/:id/locations', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await getRackLocations(request.userId, id))
  })

  app.put('/locations/:id/content', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await saveLocationContent(request.userId, id, parseInput(locationContentSchema, request.body)))
  })

  app.delete('/locations/:id/content', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await clearLocationContent(request.userId, id))
  })
}
