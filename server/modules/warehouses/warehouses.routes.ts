import type { FastifyInstance } from 'fastify'
import {
  createWarehouseSchema,
  idParamSchema,
  saveLayoutSchema,
  searchQuerySchema,
  updateWarehouseSchema,
} from '../../../shared/schemas.js'
import { requireAuth } from '../../lib/auth.js'
import { ok, parseInput } from '../../lib/http.js'
import { getLayout, saveLayout } from '../layout/layout.service.js'
import { getWarehouseOccupancy, searchLocations } from '../locations/locations.service.js'
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  listWarehouses,
  updateWarehouse,
} from './warehouses.service.js'

export async function warehouseRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth)

  app.get('/', async (request) => ok(await listWarehouses(request.userId)))

  app.post('/', async (request, reply) => {
    const warehouse = await createWarehouse(request.userId, parseInput(createWarehouseSchema, request.body))
    return reply.code(201).send(ok(warehouse))
  })

  app.get('/:id', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await getWarehouse(request.userId, id))
  })

  app.patch('/:id', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await updateWarehouse(request.userId, id, parseInput(updateWarehouseSchema, request.body)))
  })

  app.delete('/:id', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    await deleteWarehouse(request.userId, id)
    return ok({ id })
  })

  app.get('/:id/layout', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await getLayout(request.userId, id))
  })

  app.put('/:id/layout', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await saveLayout(request.userId, id, parseInput(saveLayoutSchema, request.body)))
  })

  app.get('/:id/occupancy', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    return ok(await getWarehouseOccupancy(request.userId, id))
  })

  app.get('/:id/search', async (request) => {
    const { id } = parseInput(idParamSchema, request.params)
    const { q } = parseInput(searchQuerySchema, request.query)
    return ok(await searchLocations(request.userId, id, q))
  })
}
