import { Rect, Shape, Text } from 'react-konva'
import type { RackOccupancy } from '@shared/api'
import type { RackElement } from '@shared/elements'
import { RACK_COLOR } from '../../lib/catalog'
import { clamp } from '../../lib/geometry'
import { EMPTY_BAY_FILL, getOccupancyLevel, OCCUPANCY_PALETTE, occupancyRatio } from '../../lib/occupancy'
import { CANVAS_FONT } from '../konva-utils'

interface RackShapeProps {
  element: RackElement
  occupancy: RackOccupancy | undefined
  showOccupancy: boolean
}

/** Top-down rack: one bay per column, tinted by how many of its levels hold stock. */
export function RackShape({ element, occupancy, showOccupancy }: RackShapeProps) {
  const { width, height, rotation } = element
  const { rows, columns, code } = element.properties
  const bayWidth = width / columns
  const occupied = occupancy?.occupied ?? 0
  const ratio = occupancyRatio(occupied, rows * columns)
  const palette = OCCUPANCY_PALETTE[getOccupancyLevel(ratio)]
  const emphasized = showOccupancy && occupied > 0

  const fontSize = clamp(height * 0.42, 0.45, Math.min(1.4, width * 0.3))
  const fullLabel = showOccupancy ? `${code} · ${Math.round(ratio * 100)}%` : code
  const label = width > fontSize * (fullLabel.length * 0.62 + 1) ? fullLabel : code
  // Keep the label readable when the rack is upside down.
  const flipLabel = rotation > 90 && rotation <= 270

  return (
    <>
      <Rect width={width} height={height} fill={EMPTY_BAY_FILL} />

      {showOccupancy &&
        occupancy?.occupiedByColumn.slice(0, columns).map((count, index) =>
          count > 0 ? (
            <Rect
              key={index}
              x={index * bayWidth}
              width={bayWidth}
              height={height}
              fill={OCCUPANCY_PALETTE[getOccupancyLevel(count / rows)].fill}
              listening={false}
            />
          ) : null,
        )}

      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath()
          for (let column = 1; column < columns; column++) {
            context.moveTo(column * bayWidth, 0)
            context.lineTo(column * bayWidth, height)
          }
          context.strokeShape(shape)
        }}
        stroke="#cbd5e1"
        strokeWidth={1}
        strokeScaleEnabled={false}
        listening={false}
      />

      <Rect
        width={width}
        height={height}
        stroke={emphasized ? palette.solid : RACK_COLOR}
        strokeWidth={emphasized ? 2 : 1.5}
        strokeScaleEnabled={false}
        listening={false}
      />

      <Text
        x={flipLabel ? width : 0}
        y={flipLabel ? height : 0}
        rotation={flipLabel ? 180 : 0}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        text={label}
        fontFamily={CANVAS_FONT}
        fontStyle="700"
        fontSize={fontSize}
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth={3}
        strokeScaleEnabled={false}
        fillAfterStrokeEnabled
        wrap="none"
        listening={false}
      />
    </>
  )
}
