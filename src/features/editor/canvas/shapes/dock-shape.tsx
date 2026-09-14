import { Arrow, Rect, Shape, Text } from 'react-konva'
import type { DockElement } from '@shared/elements'
import { getElementColor } from '../../lib/catalog'
import { clamp } from '../../lib/geometry'
import { CANVAS_FONT, darken, traceHatch, withAlpha } from '../konva-utils'

/** Loading dock. The top edge (local y = 0) is the building facade. */
export function DockShape({ element }: { element: DockElement }) {
  const { width, height, name } = element
  const { direction } = element.properties
  const color = getElementColor(element)
  const bumper = Math.min(height * 0.18, 0.6)
  const minSide = Math.min(width, height)
  const fontSize = clamp(minSide * 0.2, 0.35, 1)
  const arrowTop = bumper + height * 0.14
  const arrowBottom = height - fontSize * 2

  return (
    <>
      <Rect width={width} height={height} fill={withAlpha(color, 0.12)} stroke={color} strokeWidth={1.5} strokeScaleEnabled={false} />
      <Rect width={width} height={bumper} fill={color} listening={false} />
      <Shape
        sceneFunc={(context, shape) => {
          traceHatch(context, width, bumper, bumper * 1.4)
          context.strokeShape(shape)
        }}
        stroke="#1f2937"
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={false}
      />
      {arrowBottom - arrowTop > minSide * 0.2 && (
        <Arrow
          points={[width / 2, arrowTop, width / 2, arrowBottom]}
          pointerLength={minSide * 0.12}
          pointerWidth={minSide * 0.14}
          pointerAtBeginning={direction !== 'inbound'}
          pointerAtEnding={direction !== 'outbound'}
          stroke={darken(color, 0.1)}
          fill={darken(color, 0.1)}
          strokeWidth={2}
          strokeScaleEnabled={false}
          listening={false}
        />
      )}
      <Text
        y={height - fontSize * 1.5}
        width={width}
        align="center"
        text={name}
        fontFamily={CANVAS_FONT}
        fontStyle="600"
        fontSize={fontSize}
        fill={darken(color, 0.4)}
        wrap="none"
        ellipsis
        listening={false}
      />
    </>
  )
}
