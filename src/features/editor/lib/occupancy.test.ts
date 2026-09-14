import { describe, expect, it } from 'vitest'
import { getOccupancyLevel, occupancyRatio } from './occupancy'

describe('occupancy', () => {
  it('computes a bounded ratio', () => {
    expect(occupancyRatio(3, 15)).toBeCloseTo(0.2)
    expect(occupancyRatio(0, 0)).toBe(0)
    expect(occupancyRatio(20, 10)).toBe(1)
  })

  it('maps percentages to levels (0–50 / 51–80 / 81–100)', () => {
    expect(getOccupancyLevel(0)).toBe('low')
    expect(getOccupancyLevel(0.5)).toBe('low')
    expect(getOccupancyLevel(0.51)).toBe('medium')
    expect(getOccupancyLevel(0.8)).toBe('medium')
    expect(getOccupancyLevel(0.81)).toBe('high')
    expect(getOccupancyLevel(1)).toBe('high')
  })
})
