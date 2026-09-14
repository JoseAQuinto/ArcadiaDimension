import { describe, expect, it } from 'vitest'
import {
  clampToFloor,
  fitToView,
  getBounds,
  getCenter,
  normalizeRotation,
  rotateAroundCenter,
  snapToStep,
  zoomAt,
} from './geometry'

describe('snapToStep', () => {
  it('rounds to the closest grid line', () => {
    expect(snapToStep(143, 10)).toBe(140)
    expect(snapToStep(147, 10)).toBe(150)
    expect(snapToStep(14.3, 1)).toBe(14)
    expect(snapToStep(0.74, 0.5)).toBe(0.5)
    expect(snapToStep(0.76, 0.5)).toBe(1)
    expect(snapToStep(-2.6, 1)).toBe(-3)
  })

  it('avoids floating point noise', () => {
    expect(snapToStep(0.3, 0.1)).toBe(0.3)
  })
})

describe('normalizeRotation', () => {
  it('keeps angles in [0, 360)', () => {
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(359.999)).toBe(0)
  })
})

describe('bounds and rotation', () => {
  const rack = { x: 10, y: 10, width: 10, height: 2, rotation: 90 }

  it('computes the bounding box of a rotated element', () => {
    const bounds = getBounds(rack)
    expect(bounds.minX).toBeCloseTo(8)
    expect(bounds.maxX).toBeCloseTo(10)
    expect(bounds.minY).toBeCloseTo(10)
    expect(bounds.maxY).toBeCloseTo(20)
  })

  it('rotates around the visual center', () => {
    const element = { x: 0, y: 0, width: 10, height: 2, rotation: 0 }
    const rotated = rotateAroundCenter(element, 90)

    expect(rotated).toEqual({ x: 6, y: -4, rotation: 90 })
    const before = getCenter(element)
    const after = getCenter({ ...element, ...rotated })
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
})

describe('clampToFloor', () => {
  const floor = { width: 100, height: 50 }

  it('keeps elements inside the floor', () => {
    expect(clampToFloor({ x: -5, y: 3, width: 10, height: 2, rotation: 0 }, floor)).toEqual({ x: 0, y: 3 })
    expect(clampToFloor({ x: 95, y: 49, width: 10, height: 2, rotation: 0 }, floor)).toEqual({ x: 90, y: 48 })
  })

  it('accounts for rotation', () => {
    expect(clampToFloor({ x: 0, y: 0, width: 10, height: 2, rotation: 90 }, floor)).toEqual({ x: 2, y: 0 })
  })

  it('leaves elements bigger than the floor untouched', () => {
    expect(clampToFloor({ x: -20, y: 0, width: 200, height: 2, rotation: 0 }, floor)).toEqual({ x: -20, y: 0 })
  })
})

describe('viewport math', () => {
  it('zooms around the pointer', () => {
    expect(zoomAt({ x: 0, y: 0, scale: 10 }, 20, { x: 100, y: 100 })).toEqual({ x: -100, y: -100, scale: 20 })
  })

  it('fits the floor into the stage', () => {
    expect(fitToView({ width: 100, height: 50 }, { width: 1096, height: 596 })).toEqual({ x: 48, y: 48, scale: 10 })
  })
})
