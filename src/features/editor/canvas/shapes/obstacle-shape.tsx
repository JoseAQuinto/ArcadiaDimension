import { Line, Rect, Shape, Text } from 'react-konva'
import type { ObstacleElement } from '@shared/elements'
import { getElementColor } from '../../lib/catalog'
import { clamp } from '../../lib/geometry'
import { CANVAS_FONT, darken, traceHatch, withAlpha } from '../konva-utils'

export function ObstacleShape({ element }: { element: ObstacleElement }) {
  const { width, height, name } = element
  const { kind } = element.properties
  const color = getElementColor(element)

  if (kind === 'wall') return <Rect width={width} height={height} fill={color} />

  if (kind === 'column') {
    return (
      <>
        <Rect width={width} height={height} fill={color} />
        {[
          [0, 0, width, height],
          [width, 0, 0, height],
        ].map((points) => (
          <Line
            key={points.join()}
            points={points}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth={1}
            strokeScaleEnabled={false}
            listening={false}
          />
        ))}
      </>
    )
  }

  const fontSize = clamp(Math.min(width, height) * 0.18, 0.35, 1)
  const showLabel = width > fontSize * 4 && height > fontSize * 2.5

  return (
    <>
      <Rect width={width} height={height} fill={withAlpha(color, 0.14)} stroke={color} strokeWidth={1.5} strokeScaleEnabled={false} />
      <Shape
        sceneFunc={(context, shape) => {
          traceHatch(context, width, height, Math.max(0.35, Math.min(width, height) / 6))
          context.strokeShape(shape)
        }}
        stroke={withAlpha(color, 0.45)}
        strokeWidth={1}
        strokeScaleEnabled={false}
        listening={false}
      />
      {showLabel && (
        <Text
          width={width}
          height={height}
          align="center"
          verticalAlign="middle"
          text={name}
          fontFamily={CANVAS_FONT}
          fontStyle="600"
          fontSize={fontSize}
          fill={darken(color, 0.5)}
          stroke="#ffffff"
          strokeWidth={3}
          strokeScaleEnabled={false}
          fillAfterStrokeEnabled
          wrap="none"
          ellipsis
          listening={false}
        />
      )}
    </>
  )
}
