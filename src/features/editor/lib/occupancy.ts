export type OccupancyLevel = 'low' | 'medium' | 'high'

export interface OccupancyPalette {
  /** Tint used to fill occupied bays. */
  fill: string
  /** Strong color for outlines, bars and badges. */
  solid: string
  text: string
}

export const OCCUPANCY_PALETTE: Record<OccupancyLevel, OccupancyPalette> = {
  low: { fill: '#bbf7d0', solid: '#22c55e', text: '#15803d' },
  medium: { fill: '#fde68a', solid: '#f59e0b', text: '#b45309' },
  high: { fill: '#fecaca', solid: '#ef4444', text: '#b91c1c' },
}

export const EMPTY_BAY_FILL = '#f8fafc'

export const OCCUPANCY_LEGEND: { level: OccupancyLevel; label: string }[] = [
  { level: 'low', label: '0 – 50 %' },
  { level: 'medium', label: '51 – 80 %' },
  { level: 'high', label: '81 – 100 %' },
]

export function occupancyRatio(occupied: number, total: number): number {
  return total > 0 ? Math.min(1, occupied / total) : 0
}

/** 0–50 % → low, 51–80 % → medium, 81–100 % → high (percentages are rounded). */
export function getOccupancyLevel(ratio: number): OccupancyLevel {
  const percent = Math.round(ratio * 100)
  if (percent <= 50) return 'low'
  if (percent <= 80) return 'medium'
  return 'high'
}
