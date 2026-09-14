import { useId } from 'react'
import type { PreviewShape } from '@shared/api'
import { ELEMENT_LAYER, getDefaultColor } from '@/features/editor/lib/catalog'
import { cn } from '@/lib/cn'

interface WarehousePreviewProps {
  width: number
  height: number
  shapes: PreviewShape[]
  className?: string
}

function fillFor(shape: PreviewShape, color: string) {
  switch (shape.type) {
    case 'zone':
      return { fill: color, fillOpacity: 0.14, stroke: color, strokeOpacity: 0.7, dash: '3 2' }
    case 'rack':
      return { fill: '#334155', fillOpacity: 0.85, stroke: '#1e293b', strokeOpacity: 1 }
    default:
      return { fill: color, fillOpacity: 0.55, stroke: color, strokeOpacity: 0.9 }
  }
}

/** Lightweight SVG thumbnail of a floor plan. */
export function WarehousePreview({ width, height, shapes, className }: WarehousePreviewProps) {
  const patternId = useId()
  const margin = Math.max(width, height) * 0.06
  const sorted = [...shapes].sort((a, b) => ELEMENT_LAYER[a.type] - ELEMENT_LAYER[b.type])
  const gridStep = width > 300 ? 50 : 10

  return (
    <svg
      viewBox={`${-margin} ${-margin} ${width + margin * 2} ${height + margin * 2}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn('h-full w-full', className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
          <path
            d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#ffffff" />
      <rect width={width} height={height} fill={`url(#${patternId})`} />
      <rect
        width={width}
        height={height}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {sorted.map((shape, index) => {
        const color = shape.color ?? getDefaultColor(shape.type, shape.variant)
        const style = fillFor(shape, color)
        return (
          <rect
            key={index}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            transform={shape.rotation ? `rotate(${shape.rotation} ${shape.x} ${shape.y})` : undefined}
            fill={style.fill}
            fillOpacity={style.fillOpacity}
            stroke={style.stroke}
            strokeOpacity={style.strokeOpacity}
            strokeDasharray={style.dash}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}
