import type { WarehouseElement } from '@shared/elements'

/** Canvas pixels per meter at 100 % zoom. */
export const PIXELS_PER_METER = 10
export const MIN_SCALE = 1
export const MAX_SCALE = 80
export const GRID_SIZES = [0.5, 1, 2, 5] as const

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** Stage transform: screen = world × scale + (x, y). */
export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type Geometry = Pick<WarehouseElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  // `|| 0` turns -0 into 0
  return Math.round(value * factor) / factor || 0
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function snapToStep(value: number, step: number): number {
  return roundTo(Math.round(value / step) * step, 4)
}

/** Normalises any angle to [0, 360) with two decimals. */
export function normalizeRotation(degrees: number): number {
  const normalized = roundTo(((degrees % 360) + 360) % 360, 2)
  return normalized >= 360 ? 0 : normalized
}

export function rotateVector({ x, y }: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return { x: x * cos - y * sin, y: x * sin + y * cos }
}

/** Corners of an element rotated around its origin (Konva semantics). */
export function getCorners({ x, y, width, height, rotation }: Geometry): Point[] {
  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ].map((corner) => {
    const rotated = rotateVector(corner, rotation)
    return { x: x + rotated.x, y: y + rotated.y }
  })
}

export function getBounds(geometry: Geometry): Bounds {
  const corners = getCorners(geometry)
  const xs = corners.map((corner) => corner.x)
  const ys = corners.map((corner) => corner.y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function getCenter(geometry: Geometry): Point {
  const offset = rotateVector({ x: geometry.width / 2, y: geometry.height / 2 }, geometry.rotation)
  return { x: geometry.x + offset.x, y: geometry.y + offset.y }
}

/** New origin and rotation that keep the element's visual center in place. */
export function rotateAroundCenter(geometry: Geometry, rotation: number): Pick<Geometry, 'x' | 'y' | 'rotation'> {
  const center = getCenter(geometry)
  const nextRotation = normalizeRotation(rotation)
  const offset = rotateVector({ x: geometry.width / 2, y: geometry.height / 2 }, nextRotation)
  return { x: roundTo(center.x - offset.x), y: roundTo(center.y - offset.y), rotation: nextRotation }
}

/** Moves the origin so the element's bounding box stays inside the floor whenever it fits. */
export function clampToFloor(geometry: Geometry, floor: Size): Point {
  const local = getBounds({ ...geometry, x: 0, y: 0 })
  const fitsHorizontally = local.maxX - local.minX <= floor.width
  const fitsVertically = local.maxY - local.minY <= floor.height
  return {
    x: roundTo(fitsHorizontally ? clamp(geometry.x, -local.minX, floor.width - local.maxX) : geometry.x),
    y: roundTo(fitsVertically ? clamp(geometry.y, -local.minY, floor.height - local.maxY) : geometry.y),
  }
}

export function toWorld(viewport: Viewport, screen: Point): Point {
  return { x: (screen.x - viewport.x) / viewport.scale, y: (screen.y - viewport.y) / viewport.scale }
}

/** Zooms keeping the world point under `anchor` (screen coordinates) fixed. */
export function zoomAt(viewport: Viewport, nextScale: number, anchor: Point): Viewport {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
  const world = toWorld(viewport, anchor)
  return { scale, x: anchor.x - world.x * scale, y: anchor.y - world.y * scale }
}

export function centerOn(point: Point, stage: Size, scale: number): Viewport {
  return { scale, x: stage.width / 2 - point.x * scale, y: stage.height / 2 - point.y * scale }
}

export function fitToView(floor: Size, stage: Size, padding = 48): Viewport {
  const scale = clamp(
    Math.min((stage.width - padding * 2) / floor.width, (stage.height - padding * 2) / floor.height),
    MIN_SCALE,
    MAX_SCALE,
  )
  return { scale, x: (stage.width - floor.width * scale) / 2, y: (stage.height - floor.height * scale) / 2 }
}

const FOCUS_MIN_SCALE = 15

/** Centers some bounds, zooming in enough to make them comfortable to edit. */
export function focusBounds(bounds: Bounds, stage: Size, currentScale: number, padding = 120): Viewport {
  const width = Math.max(bounds.maxX - bounds.minX, 0.1)
  const height = Math.max(bounds.maxY - bounds.minY, 0.1)
  const fitScale = Math.min((stage.width - padding * 2) / width, (stage.height - padding * 2) / height)
  const scale = clamp(Math.min(fitScale, Math.max(currentScale, FOCUS_MIN_SCALE)), MIN_SCALE, MAX_SCALE)
  return centerOn({ x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }, stage, scale)
}
