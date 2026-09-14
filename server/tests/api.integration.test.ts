/**
 * End-to-end API flow against a real database. It creates throwaway users
 * (…@integration.test) and removes them when it finishes.
 *   npm run test:integration
 */
import { randomUUID } from 'node:crypto'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { WarehouseElement } from '../../shared/elements.js'
import { buildApp } from '../app.js'
import { SESSION_COOKIE } from '../lib/auth.js'

try {
  process.loadEnvFile()
} catch {
  // Use the environment as is.
}

const { closeDb, getDb } = await import('../db/client.js')
const { users } = await import('../db/schema.js')
const { like } = await import('drizzle-orm')

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const RUN_ID = randomUUID().slice(0, 8)
const EMAIL_DOMAIN = '@integration.test'

let app: FastifyInstance

function sessionFrom(response: LightMyRequestResponse): string {
  const cookie = response.cookies.find((entry) => entry.name === SESSION_COOKIE)
  if (!cookie) throw new Error('Session cookie missing')
  return cookie.value
}

async function call(method: Method, url: string, session?: string, payload?: unknown) {
  const response = await app.inject({
    method,
    url,
    cookies: session ? { [SESSION_COOKIE]: session } : undefined,
    ...(payload === undefined ? {} : { payload: payload as object }),
  })
  return { status: response.statusCode, body: response.json(), response }
}

const zone: WarehouseElement = {
  id: randomUUID(),
  type: 'zone',
  name: 'Recepción',
  x: 2,
  y: 2,
  width: 20,
  height: 12,
  rotation: 0,
  color: null,
  properties: { category: 'reception' },
}

const rack: WarehouseElement = {
  id: randomUUID(),
  type: 'rack',
  name: 'Rack A',
  x: 30,
  y: 10,
  width: 12,
  height: 1.2,
  rotation: 0,
  color: null,
  properties: { code: 'A', rows: 3, columns: 5 },
}

const withGrid = (code: string, rows: number, columns: number): WarehouseElement => ({
  ...rack,
  properties: { code, rows, columns },
})

describe.skipIf(!process.env.DATABASE_URL)('ArcadiaDimension API', () => {
  let session = ''
  let otherSession = ''
  let warehouseId = ''
  let version = 0

  const saveLayout = async (elements: WarehouseElement[]) => {
    const result = await call('PUT', `/api/warehouses/${warehouseId}/layout`, session, { baseVersion: version, elements })
    if (result.status === 200) version = result.body.data.layoutVersion
    return result
  }

  beforeAll(async () => {
    app = buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await getDb().delete(users).where(like(users.email, `%${EMAIL_DOMAIN}`))
    await app.close()
    await closeDb()
  })

  it('reports health and rejects anonymous requests', async () => {
    expect((await call('GET', '/api/health')).status).toBe(200)

    const anonymous = await call('GET', '/api/warehouses')
    expect(anonymous.status).toBe(401)
    expect(anonymous.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' })

    const unknownRoute = await call('GET', '/api/nope')
    expect(unknownRoute.body).toMatchObject({ success: false, code: 'NOT_FOUND' })

    const anonymousSession = await call('GET', '/api/auth/me')
    expect(anonymousSession.status).toBe(200)
    expect(anonymousSession.body.data.user).toBeNull()
  })

  it('registers, rejects duplicates and validates credentials', async () => {
    const email = `ana-${RUN_ID}${EMAIL_DOMAIN}`
    const registered = await call('POST', '/api/auth/register', undefined, { name: 'Ana', email, password: 'secret123' })
    expect(registered.status).toBe(201)
    session = sessionFrom(registered.response)

    const duplicate = await call('POST', '/api/auth/register', undefined, { name: 'Ana', email, password: 'secret123' })
    expect(duplicate.status).toBe(409)

    const wrongPassword = await call('POST', '/api/auth/login', undefined, { email, password: 'wrong-password' })
    expect(wrongPassword.status).toBe(401)

    const login = await call('POST', '/api/auth/login', undefined, { email: email.toUpperCase(), password: 'secret123' })
    expect(login.status).toBe(200)

    const me = await call('GET', '/api/auth/me', session)
    expect(me.body.data.user.email).toBe(email)

    const other = await call('POST', '/api/auth/register', undefined, {
      name: 'Luis',
      email: `luis-${RUN_ID}${EMAIL_DOMAIN}`,
      password: 'secret123',
    })
    otherSession = sessionFrom(other.response)
  })

  it('validates and creates warehouses', async () => {
    const invalid = await call('POST', '/api/warehouses', session, { name: 'X', width: -1, height: 80 })
    expect(invalid.status).toBe(400)
    expect(invalid.body.code).toBe('VALIDATION_ERROR')
    expect(invalid.body.details.length).toBeGreaterThan(0)

    const created = await call('POST', '/api/warehouses', session, {
      name: 'Almacén Valencia',
      description: 'Centro regional',
      width: 120,
      height: 80,
    })
    expect(created.status).toBe(201)
    warehouseId = created.body.data.id

    const list = await call('GET', '/api/warehouses', session)
    expect(list.body.data.map((warehouse: { id: string }) => warehouse.id)).toContain(warehouseId)

    const layout = await call('GET', `/api/warehouses/${warehouseId}/layout`, session)
    expect(layout.body.data.elements).toEqual([])
    expect(layout.body.data.warehouse.layoutVersion).toBe(0)
  })

  it('isolates warehouses between users', async () => {
    expect((await call('GET', `/api/warehouses/${warehouseId}`, otherSession)).status).toBe(404)
    expect((await call('GET', '/api/warehouses/not-a-uuid', session)).status).toBe(400)
  })

  it('saves the layout and generates rack locations', async () => {
    const saved = await saveLayout([zone, rack])
    expect(saved.status).toBe(200)
    expect(version).toBe(1)

    const stale = await call('PUT', `/api/warehouses/${warehouseId}/layout`, session, {
      baseVersion: 0,
      elements: [zone],
    })
    expect(stale.status).toBe(409)

    const invalidType = await call('PUT', `/api/warehouses/${warehouseId}/layout`, session, {
      baseVersion: version,
      elements: [{ ...zone, type: 'forklift' }],
    })
    expect(invalidType.status).toBe(400)

    const reloaded = await call('GET', `/api/warehouses/${warehouseId}/layout`, session)
    expect(reloaded.body.data.elements).toEqual([zone, rack])

    const locations = await call('GET', `/api/racks/${rack.id}/locations`, session)
    expect(locations.body.data.locations).toHaveLength(15)
    expect(locations.body.data.locations[2].code).toBe('A-01-03')
  })

  it('assigns contents, computes occupancy and finds articles', async () => {
    const locations = await call('GET', `/api/racks/${rack.id}/locations`, session)
    const target = locations.body.data.locations[2]

    const invalid = await call('PUT', `/api/locations/${target.id}/content`, session, { articleCode: 'ART-001', quantity: 0 })
    expect(invalid.status).toBe(400)

    const saved = await call('PUT', `/api/locations/${target.id}/content`, session, {
      articleCode: 'art-001',
      description: 'Tornillo M8',
      quantity: 120,
      lot: 'L260914',
    })
    expect(saved.status).toBe(200)
    expect(saved.body.data.content).toMatchObject({ articleCode: 'ART-001', quantity: 120 })

    const forbidden = await call('PUT', `/api/locations/${target.id}/content`, otherSession, {
      articleCode: 'HACK',
      quantity: 1,
    })
    expect(forbidden.status).toBe(404)

    const occupancy = await call('GET', `/api/warehouses/${warehouseId}/occupancy`, session)
    expect(occupancy.body.data).toEqual([
      { elementId: rack.id, occupied: 1, occupiedByColumn: [0, 0, 1, 0, 0], maxOccupiedRow: 1, maxOccupiedColumn: 3 },
    ])

    const search = await call('GET', `/api/warehouses/${warehouseId}/search?q=ART-001`, session)
    expect(search.body.data).toHaveLength(1)
    expect(search.body.data[0]).toMatchObject({ elementName: 'Rack A', rackCode: 'A', locationCode: 'A-01-03' })

    const tooShort = await call('GET', `/api/warehouses/${warehouseId}/search?q=A`, session)
    expect(tooShort.status).toBe(400)
  })

  it('keeps stock when a rack shrinks, is renamed or is deleted and restored', async () => {
    await saveLayout([zone, withGrid('A', 2, 2)])
    const shrunk = await call('GET', `/api/racks/${rack.id}/locations`, session)
    expect(shrunk.body.data.locations).toHaveLength(4)
    expect((await call('GET', `/api/warehouses/${warehouseId}/search?q=ART-001`, session)).body.data).toHaveLength(0)

    await saveLayout([zone, withGrid('B', 3, 5)])
    const regrown = await call('GET', `/api/racks/${rack.id}/locations`, session)
    expect(regrown.body.data.locations).toHaveLength(15)
    expect(regrown.body.data.locations[2]).toMatchObject({ code: 'B-01-03', content: { articleCode: 'ART-001' } })

    await saveLayout([zone])
    expect((await call('GET', `/api/racks/${rack.id}/locations`, session)).status).toBe(404)

    await saveLayout([zone, withGrid('B', 3, 5)])
    const restored = await call('GET', `/api/racks/${rack.id}/locations`, session)
    expect(restored.body.data.locations[2].content.articleCode).toBe('ART-001')

    const cleared = await call('DELETE', `/api/locations/${restored.body.data.locations[2].id}/content`, session)
    expect(cleared.body.data.content).toBeNull()
  })

  it('updates and deletes warehouses', async () => {
    const renamed = await call('PATCH', `/api/warehouses/${warehouseId}`, session, { name: 'Almacén Valencia Norte' })
    expect(renamed.body.data).toMatchObject({ name: 'Almacén Valencia Norte', description: 'Centro regional' })

    const summary = await call('GET', '/api/warehouses', session)
    expect(summary.body.data[0].stats).toEqual({ elements: 2, racks: 1, locations: 15, occupiedLocations: 0 })

    expect((await call('DELETE', `/api/warehouses/${warehouseId}`, session)).status).toBe(200)
    expect((await call('GET', `/api/warehouses/${warehouseId}`, session)).status).toBe(404)
  })
})
