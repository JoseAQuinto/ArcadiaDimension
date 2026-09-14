import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { MousePointerClick } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Layer, Stage } from 'react-konva'
import type { RackOccupancy } from '@shared/api'
import { useElementSize } from '@/hooks/use-element-size'
import { cn } from '@/lib/cn'
import { ELEMENT_LAYER } from '../lib/catalog'
import { roundTo } from '../lib/geometry'
import { ELEMENT_DRAG_MIME, isElementType } from '../lib/palette-dnd'
import { useEditorStore } from '../store/editor-store'
import { CanvasTooltip } from './canvas-tooltip'
import { ElementNode } from './element-node'
import { FloorLayer } from './floor-layer'
import { SelectionTransformer } from './selection-transformer'
import { useViewportSync } from './use-viewport-sync'

const WHEEL_ZOOM_SPEED = 0.0015
const editor = useEditorStore.getState

interface WarehouseCanvasProps {
  occupancy: Map<string, RackOccupancy>
  onOpenLocations: (rackId: string) => void
}

const isStageEvent = (event: KonvaEventObject<unknown>) => event.target === event.target.getStage()

export function WarehouseCanvas({ occupancy, onOpenLocations }: WarehouseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isDropTarget, setIsDropTarget] = useState(false)

  const elements = useEditorStore((state) => state.elements)
  const floor = useEditorStore((state) => state.floor)
  const stageSize = useEditorStore((state) => state.stageSize)
  const showGrid = useEditorStore((state) => state.showGrid)
  const gridSize = useEditorStore((state) => state.gridSize)
  const showOccupancy = useEditorStore((state) => state.showOccupancy)
  const highlightedIds = useEditorStore((state) => state.highlightedIds)
  const setStageSize = useEditorStore((state) => state.setStageSize)

  useElementSize(containerRef, setStageSize)
  const ready = stageSize.width > 0 && stageSize.height > 0
  useViewportSync(stageRef, ready)

  // Canvas text is measured with the web font once it is available.
  useEffect(() => {
    void document.fonts?.ready.then(() => stageRef.current?.batchDraw())
  }, [ready])

  const ordered = useMemo(
    () =>
      elements
        .map((element, index) => ({ element, index }))
        .sort((a, b) => ELEMENT_LAYER[a.element.type] - ELEMENT_LAYER[b.element.type] || a.index - b.index)
        .map(({ element }) => element),
    [elements],
  )
  const highlighted = useMemo(() => new Set(highlightedIds), [highlightedIds])

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const { viewport, setViewport, zoomTo } = editor()
    const { deltaX, deltaY, ctrlKey, metaKey, shiftKey } = event.evt

    if (ctrlKey || metaKey) {
      const pointer = event.target.getStage()?.getPointerPosition() ?? undefined
      zoomTo(viewport.scale * Math.exp(-deltaY * WHEEL_ZOOM_SPEED), pointer)
      return
    }
    const horizontal = shiftKey && deltaX === 0
    setViewport({ ...viewport, x: viewport.x - (horizontal ? deltaY : deltaX), y: viewport.y - (horizontal ? 0 : deltaY) })
  }

  const syncViewportFromStage = (stage: Konva.Node) =>
    editor().setViewport({ x: stage.x(), y: stage.y(), scale: stage.scaleX() })

  const handleDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes(ELEMENT_DRAG_MIME)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDropTarget(true)
  }

  const handleDrop = (event: DragEvent) => {
    setIsDropTarget(false)
    const type = event.dataTransfer.getData(ELEMENT_DRAG_MIME)
    const stage = stageRef.current
    if (!stage || !isElementType(type)) return
    event.preventDefault()
    stage.setPointersPositions(event.nativeEvent)
    const point = stage.getRelativePointerPosition()
    if (point) editor().addElement(type, point)
  }

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden outline-none', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
      aria-label="Plano del almacén"
    >
      {ready && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable
          onWheel={handleWheel}
          onMouseDown={(event) => isStageEvent(event) && editor().select(null)}
          onTouchStart={(event) => isStageEvent(event) && editor().select(null)}
          onMouseMove={(event) => {
            const point = event.target.getStage()?.getRelativePointerPosition()
            if (point) editor().setPointer({ x: roundTo(point.x, 1), y: roundTo(point.y, 1) })
          }}
          onMouseLeave={() => editor().setPointer(null)}
          onDragStart={(event) => isStageEvent(event) && setIsPanning(true)}
          onDragMove={(event) => isStageEvent(event) && syncViewportFromStage(event.target)}
          onDragEnd={(event) => {
            if (!isStageEvent(event)) return
            setIsPanning(false)
            syncViewportFromStage(event.target)
          }}
        >
          <Layer listening={false}>
            <FloorLayer width={floor.width} height={floor.height} showGrid={showGrid} gridSize={gridSize} />
          </Layer>
          <Layer>
            {ordered.map((element) => (
              <ElementNode
                key={element.id}
                element={element}
                occupancy={occupancy.get(element.id)}
                showOccupancy={showOccupancy}
                highlighted={highlighted.has(element.id)}
                dimmed={highlighted.size > 0 && !highlighted.has(element.id)}
                onOpenLocations={onOpenLocations}
              />
            ))}
            <SelectionTransformer />
          </Layer>
        </Stage>
      )}

      {isDropTarget && (
        <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-brand-400 bg-brand-500/5" />
      )}

      <CanvasTooltip occupancy={occupancy} />

      {elements.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
          <div className="flex animate-slide-up items-center gap-3 rounded-full border border-slate-200 bg-white/95 py-2 pr-5 pl-2 text-sm text-slate-600 shadow-float backdrop-blur">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MousePointerClick className="size-4" />
            </span>
            Arrastra una zona o un rack desde el panel izquierdo para empezar
          </div>
        </div>
      )}
    </div>
  )
}
