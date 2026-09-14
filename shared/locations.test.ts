import { describe, expect, it } from 'vitest'
import { buildLocationCode, generateLocationSlots, nextRackCode, rackCodeFromIndex } from './locations.js'

describe('buildLocationCode', () => {
  it('pads row and column to two digits', () => {
    expect(buildLocationCode('A', 1, 3)).toBe('A-01-03')
    expect(buildLocationCode('B2', 12, 45)).toBe('B2-12-45')
  })
})

describe('generateLocationSlots', () => {
  it('creates rows × columns slots ordered by row then column', () => {
    const slots = generateLocationSlots('A', 3, 5)

    expect(slots).toHaveLength(15)
    expect(slots.slice(0, 3).map((slot) => slot.code)).toEqual(['A-01-01', 'A-01-02', 'A-01-03'])
    expect(slots[5]).toEqual({ row: 2, column: 1, code: 'A-02-01' })
    expect(slots.at(-1)?.code).toBe('A-03-05')
  })

  it('returns no slots for an empty grid', () => {
    expect(generateLocationSlots('A', 0, 4)).toEqual([])
  })
})

describe('rack codes', () => {
  it('follows a spreadsheet-like sequence', () => {
    expect(rackCodeFromIndex(0)).toBe('A')
    expect(rackCodeFromIndex(25)).toBe('Z')
    expect(rackCodeFromIndex(26)).toBe('AA')
    expect(rackCodeFromIndex(27)).toBe('AB')
    expect(rackCodeFromIndex(701)).toBe('ZZ')
    expect(rackCodeFromIndex(702)).toBe('AAA')
  })

  it('picks the first free code', () => {
    expect(nextRackCode([])).toBe('A')
    expect(nextRackCode(['A', 'B', 'D'])).toBe('C')
    expect(nextRackCode(['A', 'CUSTOM'])).toBe('B')
  })
})
