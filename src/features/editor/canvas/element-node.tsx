import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { memo, useRef } from 'react'
import { Group } from 'react-konva'
import type { RackOccupancy } from '@shared/api'
import { LIMITS, type WarehouseElement } from '@shared/elements'
import { clampToFloor, normalizeRotation, roundTo, snapToStep } from '../lib/geometry'
import { useEditorStore } from '../store/editor-store'
import { ElementShape } from './shapes/element-shape'
import { HighlightRing } from './shapes/highlight-ring'

interface ElementNodeProps {
  element: WarehouseElement
  occupancy: RackOccupancy | undefined
  showOccupancy: boolean
  highlighted: boolean
  dimmed: boolean
  onOpenLocations: (rackId: string) => void
}

const editor = useEditorStore.getState

function setCursor(event: KonvaEventObject<MouseEvent>, cursor: string) {
  const container = event.target.getStage()?.container()
  if (container) container.style.cursor = cursor
}

function ElementNodeComponent({ element, occupancy, showOccupancy, highlighted, dimmed, onOpenLocations }: ElementNodeProps) {
  const groupRef = useRef<Konva.Group>(null)
  const rotationAtStart = useRef(element.rotation)

  const handleDragMove = (event: KonvaEventObject<DragEvent>) => {
    const node = event.target
    const { snapToGrid, gridSize, floor } = editor()
    const raw = { x: node.x(), y: node.y() }
    const snapped = snapToGrid ? { x: snapToStep(raw.x, gridSize), y: snapToStep(raw.y, gridSize) } : raw
    const position = clampToFloor({ ...element, ...snapped }, floor)
    node.position(position)
    editor().updateElementLive(element.id, position)
  }

  // Scale is converted into width/height on every frame so labels and bays re-layout instead of stretching.
  const handleTransform = () => {
    const node = groupRef.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scale({ x: 1, y: 1 })
    editor().updateElementLive(element.id, {
      x: roundTo(node.x()),
      y: roundTo(node.y()),
      width: roundTo(Math.max(LIMITS.elementMinSize, node.width() * scaleX)),
      height: roundTo(Math.max(LIMITS.elementMinSize, node.height() * scaleY)),
      rotation: normalizeRotation(node.rotation()),
    })
  }

  const handleTransformEnd = () => {
    const current = editor().elements.find((candidate) => candidate.id === element.id)
    const verb = current && current.rotation !== rotationAtStart.current ? 'Rotar' : 'Redimensionar'
    editor().endInteraction(`${verb} ${element.name}`)
  }

  return (
    <Group
      ref={groupRef}
      id={element.id}
      name="element"
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={dimmed ? 0.35 : 1}
      draggable
      onMouseDown={(event) => event.evt.button === 0 && editor().select(element.id)}
      onTap={() => editor().select(element.id)}
      onDblClick={() => element.type === 'rack' && onOpenLocations(element.id)}
      onDblTap={() => element.type === 'rack' && onOpenLocations(element.id)}
      onMouseEnter={(event) => {
        editor().setHovered(element.id)
        setCursor(event, 'move')
      }}
      onMouseLeave={(event) => {
        editor().setHovered(null)
        setCursor(event, '')
      }}
      onDragStart={() => {
        editor().select(element.id)
        editor().beginInteraction()
      }}
      onDragMove={handleDragMove}
      onDragEnd={() => editor().endInteraction(`Mover ${element.name}`)}
      onTransformStart={() => {
        rotationAtStart.current = element.rotation
        editor().beginInteraction()
      }}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    >
      <ElementShape element={element} occupancy={occupancy} showOccupancy={showOccupancy} />
      {highlighted && <HighlightRing width={element.width} height={element.height} />}
    </Group>
  )
}

export const ElementNode = memo(ElementNodeComponent)
