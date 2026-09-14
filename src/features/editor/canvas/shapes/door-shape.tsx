import { Line, Rect } from 'react-konva'
import type { DoorElement } from '@shared/elements'
import { getElementColor } from '../../lib/catalog'
import { darken, withAlpha } from '../konva-utils'

export function DoorShape({ element }: { element: DoorElement }) {
  const { width, height } = element
  const color = getElementColor(element)
  const jamb = Math.min(0.2, width * 0.08)

  return (
    <>
      <Rect width={width} height={height} fill={withAlpha(color, 0.85)} />
      <Rect width={jamb} height={height} fill={darken(color, 0.45)} listening={false} />
      <Rect x={width - jamb} width={jamb} height={height} fill={darken(color, 0.45)} listening={false} />
      <Line
        points={[jamb, height / 2, width - jamb, height / 2]}
        stroke="#ffffff"
        strokeWidth={1.5}
        dash={element.properties.kind === 'emergency' ? [2, 3] : [6, 4]}
        strokeScaleEnabled={false}
        listening={false}
      />
    </>
  )
}
