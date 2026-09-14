import type { RackOccupancy } from '@shared/api'
import { formatInteger, formatNumber, formatPercent } from '@/lib/format'
import { ELEMENT_META, getVariantLabel } from '../lib/catalog'
import { occupancyRatio } from '../lib/occupancy'
import { useEditorStore } from '../store/editor-store'

const OFFSET = 16
const MAX_WIDTH = 260

export function CanvasTooltip({ occupancy }: { occupancy: Map<string, RackOccupancy> }) {
  const element = useEditorStore((state) =>
    state.hoveredId && !state.interactionSnapshot
      ? state.elements.find((candidate) => candidate.id === state.hoveredId)
      : undefined,
  )
  const pointer = useEditorStore((state) => (state.hoveredId ? state.pointer : null))
  const viewport = useEditorStore((state) => state.viewport)
  const stageWidth = useEditorStore((state) => state.stageSize.width)

  if (!element || !pointer) return null

  const left = Math.min(pointer.x * viewport.scale + viewport.x + OFFSET, stageWidth - MAX_WIDTH - 8)
  const top = pointer.y * viewport.scale + viewport.y + OFFSET

  let occupancyLine: string | null = null
  if (element.type === 'rack') {
    const total = element.properties.rows * element.properties.columns
    const occupied = occupancy.get(element.id)?.occupied ?? 0
    occupancyLine = `${formatInteger(occupied)} de ${formatInteger(total)} ubicaciones ocupadas · ${formatPercent(occupancyRatio(occupied, total))}`
  }

  return (
    <div
      className="pointer-events-none absolute z-10 animate-fade-in rounded-lg bg-ink-900/95 px-3 py-2 text-xs text-white shadow-float"
      style={{ left, top, maxWidth: MAX_WIDTH }}
      role="tooltip"
    >
      <p className="truncate font-semibold">{element.name}</p>
      <p className="mt-0.5 text-white/60">
        {ELEMENT_META[element.type].label} · {getVariantLabel(element)} · {formatNumber(element.width)} ×{' '}
        {formatNumber(element.height)} m
      </p>
      {occupancyLine && <p className="mt-1 text-white/85">{occupancyLine}</p>}
      {element.type === 'rack' && <p className="mt-1 text-white/45">Doble clic para ver ubicaciones</p>}
    </div>
  )
}
