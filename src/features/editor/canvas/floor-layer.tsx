import type Konva from 'konva'
import { Group, Line, Rect, Shape, Text } from 'react-konva'
import { formatNumber } from '@/lib/format'
import { clamp } from '../lib/geometry'
import { CANVAS_FONT } from './konva-utils'

interface FloorLayerProps {
  width: number
  height: number
  showGrid: boolean
  gridSize: number
}

/** Below this on-screen spacing grid lines are skipped to avoid visual noise. */
const MIN_LINE_SPACING_PX = 6

function traceGrid(
  context: Konva.Context,
  shape: Konva.Shape,
  { width, height, step, skipEvery }: { width: number; height: number; step: number; skipEvery?: number },
) {
  if (step * shape.getAbsoluteScale().x < MIN_LINE_SPACING_PX) return

  context.beginPath()
  const columns = Math.floor(width / step + 1e-6)
  const rows = Math.floor(height / step + 1e-6)
  for (let index = 1; index < columns + 1; index++) {
    if (skipEvery && index % skipEvery === 0) continue
    const x = index * step
    if (x >= width) continue
    context.moveTo(x, 0)
    context.lineTo(x, height)
  }
  for (let index = 1; index < rows + 1; index++) {
    if (skipEvery && index % skipEvery === 0) continue
    const y = index * step
    if (y >= height) continue
    context.moveTo(0, y)
    context.lineTo(width, y)
  }
  context.strokeShape(shape)
}

export function FloorLayer({ width, height, showGrid, gridSize }: FloorLayerProps) {
  const majorEvery = gridSize >= 1 ? 5 : 10
  const labelSize = clamp(Math.max(width, height) * 0.014, 0.8, 8)
  const gap = labelSize * 1.2
  const tick = labelSize * 0.35

  return (
    <>
      <Rect
        width={width}
        height={height}
        fill="#ffffff"
        shadowColor="#0f172a"
        shadowOpacity={0.1}
        shadowBlur={Math.max(width, height) * 0.02}
        shadowOffsetY={Math.max(width, height) * 0.004}
        shadowForStrokeEnabled={false}
        perfectDrawEnabled={false}
      />

      {showGrid && (
        <>
          <Shape
            sceneFunc={(context, shape) => traceGrid(context, shape, { width, height, step: gridSize, skipEvery: majorEvery })}
            stroke="#eef1f5"
            strokeWidth={1}
            strokeScaleEnabled={false}
            perfectDrawEnabled={false}
          />
          <Shape
            sceneFunc={(context, shape) => traceGrid(context, shape, { width, height, step: gridSize * majorEvery })}
            stroke="#dde2ea"
            strokeWidth={1}
            strokeScaleEnabled={false}
            perfectDrawEnabled={false}
          />
        </>
      )}

      <Rect width={width} height={height} stroke="#94a3b8" strokeWidth={1.5} strokeScaleEnabled={false} />

      <Group y={-gap}>
        <Line points={[0, 0, width, 0]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Line points={[0, -tick, 0, tick]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Line points={[width, -tick, width, tick]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Text
          y={-labelSize * 1.5}
          width={width}
          align="center"
          text={`${formatNumber(width)} m`}
          fontFamily={CANVAS_FONT}
          fontSize={labelSize}
          fontStyle="500"
          fill="#64748b"
        />
      </Group>

      <Group x={-gap}>
        <Line points={[0, 0, 0, height]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Line points={[-tick, 0, tick, 0]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Line points={[-tick, height, tick, height]} stroke="#94a3b8" strokeWidth={1} strokeScaleEnabled={false} />
        <Text
          x={-labelSize * 1.5}
          y={height}
          width={height}
          rotation={-90}
          align="center"
          text={`${formatNumber(height)} m`}
          fontFamily={CANVAS_FONT}
          fontSize={labelSize}
          fontStyle="500"
          fill="#64748b"
        />
      </Group>
    </>
  )
}
