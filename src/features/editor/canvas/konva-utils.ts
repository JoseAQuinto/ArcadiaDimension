import type Konva from 'konva'

export const CANVAS_FONT = 'Inter Variable, Inter, system-ui, sans-serif'
export const SELECTION_COLOR = '#4146e6'

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Mixes a color with slate-900 to get readable text on light fills. */
export function darken(hex: string, amount = 0.35): string {
  const target = [15, 23, 42]
  const mixed = parseHex(hex).map((channel, index) => Math.round(channel + (target[index] - channel) * amount))
  return `rgb(${mixed.join(', ')})`
}

/** Draws 45° hatch lines clipped to a width × height rectangle. */
export function traceHatch(context: Konva.Context, width: number, height: number, spacing: number): void {
  context.beginPath()
  for (let offset = -height; offset < width; offset += spacing) {
    const startX = Math.max(0, offset)
    const endX = Math.min(width, offset + height)
    if (endX <= startX) continue
    context.moveTo(startX, height - (startX - offset))
    context.lineTo(endX, height - (endX - offset))
  }
}
