import { Fragment, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import type { RackLocation } from '@shared/api'
import { padPosition } from '@shared/locations'
import { cn } from '@/lib/cn'
import { formatInteger } from '@/lib/format'

interface LocationGridProps {
  rows: number
  columns: number
  locations: RackLocation[]
  selectedId: string | null
  /** Location to reveal and emphasise, e.g. a search result. */
  highlightId?: string
  onSelect: (locationId: string) => void
}

const ARROWS: Record<string, [row: number, column: number]> = {
  ArrowUp: [1, 0],
  ArrowDown: [-1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
}

/** Front view of a rack: level 1 at the bottom, bays from left to right. */
export function LocationGrid({ rows, columns, locations, selectedId, highlightId, onSelect }: LocationGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const byPosition = useMemo(
    () => new Map(locations.map((location) => [`${location.row}:${location.column}`, location])),
    [locations],
  )
  const rowNumbers = Array.from({ length: rows }, (_, index) => rows - index)
  const columnNumbers = Array.from({ length: columns }, (_, index) => index + 1)

  useEffect(() => {
    if (!highlightId) return
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-location-id="${highlightId}"]`)
      ?.scrollIntoView({ block: 'center', inline: 'center' })
  }, [highlightId])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const arrow = ARROWS[event.key]
    const current = locations.find((location) => location.id === selectedId)
    if (!arrow || !current) return
    const next = byPosition.get(`${current.row + arrow[0]}:${current.column + arrow[1]}`)
    if (!next) return
    event.preventDefault()
    onSelect(next.id)
    gridRef.current?.querySelector<HTMLElement>(`[data-location-id="${next.id}"]`)?.focus()
  }

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Ubicaciones del rack"
      onKeyDown={handleKeyDown}
      className="inline-grid min-w-full gap-1.5"
      style={{ gridTemplateColumns: `2.25rem repeat(${columns}, minmax(6.5rem, 1fr))` }}
    >
      <div />
      {columnNumbers.map((column) => (
        <div key={column} className="pb-1 text-center font-mono text-[11px] font-medium text-slate-400">
          C{padPosition(column)}
        </div>
      ))}

      {rowNumbers.map((row) => (
        <Fragment key={row}>
          <div className="flex items-center justify-center font-mono text-[11px] font-medium text-slate-400">
            F{padPosition(row)}
          </div>
          {columnNumbers.map((column) => {
            const location = byPosition.get(`${row}:${column}`)
            if (!location) return <div key={column} className="rounded-lg border border-dashed border-slate-100" />
            return (
              <LocationCell
                key={location.id}
                location={location}
                selected={location.id === selectedId}
                highlighted={location.id === highlightId}
                onSelect={onSelect}
              />
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

interface LocationCellProps {
  location: RackLocation
  selected: boolean
  highlighted: boolean
  onSelect: (locationId: string) => void
}

function LocationCell({ location, selected, highlighted, onSelect }: LocationCellProps) {
  const { content } = location

  return (
    <button
      type="button"
      role="gridcell"
      data-location-id={location.id}
      aria-selected={selected}
      aria-label={`${location.code}: ${content ? `${content.articleCode}, ${content.quantity} unidades` : 'vacía'}`}
      onClick={() => onSelect(location.id)}
      className={cn(
        'flex h-[4.5rem] min-w-0 flex-col items-start justify-between rounded-lg border px-2.5 py-2 text-left transition focus-visible:ring-4 focus-visible:ring-brand-500/25 focus-visible:outline-none',
        content
          ? 'border-brand-200 bg-brand-50/70 hover:border-brand-300 hover:bg-brand-50'
          : 'border-dashed border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        selected && 'border-brand-500 bg-white shadow-sm ring-2 ring-brand-500/30',
        highlighted && !selected && 'ring-2 ring-amber-400',
      )}
    >
      <span className="font-mono text-[10.5px] font-medium text-slate-500">{location.code}</span>
      {content ? (
        <span className="w-full min-w-0">
          <span className="block truncate text-[12.5px] font-semibold text-slate-900">{content.articleCode}</span>
          <span className="block text-[11px] text-slate-500 tabular-nums">{formatInteger(content.quantity)} uds</span>
        </span>
      ) : (
        <span className="text-xs text-slate-400">Vacía</span>
      )}
    </button>
  )
}
