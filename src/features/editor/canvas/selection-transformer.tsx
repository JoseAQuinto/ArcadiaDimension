import type Konva from 'konva'
import type { Vector2d } from 'konva/lib/types'
import type { Box } from 'konva/lib/shapes/Transformer'
import { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import { LIMITS } from '@shared/elements'
import { snapToStep } from '../lib/geometry'
import { useEditorStore } from '../store/editor-store'
import { SELECTION_COLOR } from './konva-utils'

const ROTATION_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315]

/** Konva Transformer bound to the selected element: resize from 8 anchors and free rotation with 45° magnets. */
export function SelectionTransformer() {
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectedId = useEditorStore((state) => state.selectedId)
  const elements = useEditorStore((state) => state.elements)
  const snapToGrid = useEditorStore((state) => state.snapToGrid)
  const gridSize = useEditorStore((state) => state.gridSize)

  // Re-attach when the selection changes or the selected node is re-created (e.g. after undo).
  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return
    const node = selectedId ? transformer.getStage()?.findOne<Konva.Group>(`#${selectedId}`) : undefined
    if (transformer.nodes()[0] !== node) {
      transformer.nodes(node ? [node] : [])
      transformer.getLayer()?.batchDraw()
    }
  }, [selectedId, elements])

  const boundBoxFunc = (oldBox: Box, newBox: Box) => {
    const minimum = LIMITS.elementMinSize * (transformerRef.current?.getStage()?.scaleX() ?? 1)
    return Math.abs(newBox.width) < minimum || Math.abs(newBox.height) < minimum ? oldBox : newBox
  }

  /** Snaps the dragged anchor to the grid while the element is axis aligned. */
  const anchorDragBoundFunc = (_oldPosition: Vector2d, newPosition: Vector2d): Vector2d => {
    const transformer = transformerRef.current
    const stage = transformer?.getStage()
    const node = transformer?.nodes()[0]
    if (!snapToGrid || !transformer || !stage || !node) return newPosition
    if (transformer.getActiveAnchor() === 'rotater' || node.rotation() % 90 !== 0) return newPosition

    const transform = stage.getAbsoluteTransform().copy()
    const world = transform.copy().invert().point(newPosition)
    return transform.point({ x: snapToStep(world.x, gridSize), y: snapToStep(world.y, gridSize) })
  }

  return (
    <Transformer
      ref={transformerRef}
      rotationSnaps={ROTATION_SNAPS}
      rotationSnapTolerance={6}
      rotateAnchorOffset={26}
      keepRatio={false}
      flipEnabled={false}
      ignoreStroke
      borderStroke={SELECTION_COLOR}
      borderStrokeWidth={1.5}
      anchorStroke={SELECTION_COLOR}
      anchorStrokeWidth={1.5}
      anchorFill="#ffffff"
      anchorSize={9}
      anchorCornerRadius={2}
      boundBoxFunc={boundBoxFunc}
      anchorDragBoundFunc={anchorDragBoundFunc}
    />
  )
}
