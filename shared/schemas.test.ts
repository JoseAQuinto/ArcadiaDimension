import { describe, expect, it } from 'vitest'
import type { WarehouseElement } from './elements.js'
import { createWarehouseSchema, locationContentSchema, registerSchema, saveLayoutSchema } from './schemas.js'

const rack = (id: string, code: string): WarehouseElement => ({
  id,
  type: 'rack',
  name: `Rack ${code}`,
  x: 10,
  y: 10,
  width: 12,
  height: 1.2,
  rotation: 0,
  color: null,
  properties: { code, rows: 3, columns: 6 },
})

const ID_1 = '5b4c2f0e-8d3a-4f7b-9c1e-2a6d8e0f1b3c'
const ID_2 = '7e9a1c3d-5f2b-4a8e-b6c0-d4e2f8a1b5c7'

describe('createWarehouseSchema', () => {
  it('accepts a valid warehouse and normalises an empty description', () => {
    const result = createWarehouseSchema.parse({ name: '  Almacén Valencia ', description: '', width: 120, height: 80 })
    expect(result).toEqual({ name: 'Almacén Valencia', description: null, width: 120, height: 80 })
  })

  it('rejects non positive or too small dimensions', () => {
    expect(createWarehouseSchema.safeParse({ name: 'Test', width: 0, height: 80 }).success).toBe(false)
    expect(createWarehouseSchema.safeParse({ name: 'Test', width: -10, height: 80 }).success).toBe(false)
    expect(createWarehouseSchema.safeParse({ name: 'Test', width: 120, height: 3 }).success).toBe(false)
  })

  it('requires a name', () => {
    expect(createWarehouseSchema.safeParse({ name: ' ', width: 120, height: 80 }).success).toBe(false)
  })
})

describe('saveLayoutSchema', () => {
  it('accepts a valid layout', () => {
    const result = saveLayoutSchema.safeParse({ baseVersion: 0, elements: [rack(ID_1, 'A'), rack(ID_2, 'B')] })
    expect(result.success).toBe(true)
  })

  it('rejects unknown element types', () => {
    const invalid = { ...rack(ID_1, 'A'), type: 'forklift' }
    expect(saveLayoutSchema.safeParse({ baseVersion: 0, elements: [invalid] }).success).toBe(false)
  })

  it('rejects duplicated rack codes and ids', () => {
    const duplicatedCode = saveLayoutSchema.safeParse({ baseVersion: 0, elements: [rack(ID_1, 'A'), rack(ID_2, 'A')] })
    expect(duplicatedCode.success).toBe(false)

    const duplicatedId = saveLayoutSchema.safeParse({ baseVersion: 0, elements: [rack(ID_1, 'A'), rack(ID_1, 'B')] })
    expect(duplicatedId.success).toBe(false)
  })

  it('rejects racks with invalid grids and elements with invalid geometry', () => {
    const badGrid = { ...rack(ID_1, 'A'), properties: { code: 'A', rows: 0, columns: 6 } }
    expect(saveLayoutSchema.safeParse({ baseVersion: 0, elements: [badGrid] }).success).toBe(false)

    const badSize = { ...rack(ID_1, 'A'), width: -1 }
    expect(saveLayoutSchema.safeParse({ baseVersion: 0, elements: [badSize] }).success).toBe(false)

    const badRotation = { ...rack(ID_1, 'A'), rotation: 360 }
    expect(saveLayoutSchema.safeParse({ baseVersion: 0, elements: [badRotation] }).success).toBe(false)
  })
})

describe('locationContentSchema', () => {
  it('normalises the article code and optional fields', () => {
    const result = locationContentSchema.parse({ articleCode: ' art-00125 ', quantity: 340, lot: '', description: 'Tornillo M8' })
    expect(result).toEqual({ articleCode: 'ART-00125', quantity: 340, lot: null, description: 'Tornillo M8' })
  })

  it('rejects zero, negative and decimal quantities', () => {
    expect(locationContentSchema.safeParse({ articleCode: 'ART-1', quantity: 0 }).success).toBe(false)
    expect(locationContentSchema.safeParse({ articleCode: 'ART-1', quantity: -5 }).success).toBe(false)
    expect(locationContentSchema.safeParse({ articleCode: 'ART-1', quantity: 1.5 }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('normalises the email and enforces password length', () => {
    expect(registerSchema.parse({ name: 'Ana', email: ' Ana@Example.COM ', password: 'secret123' }).email).toBe(
      'ana@example.com',
    )
    expect(registerSchema.safeParse({ name: 'Ana', email: 'ana@example.com', password: 'short' }).success).toBe(false)
    expect(registerSchema.safeParse({ name: 'Ana', email: 'not-an-email', password: 'secret123' }).success).toBe(false)
  })
})
