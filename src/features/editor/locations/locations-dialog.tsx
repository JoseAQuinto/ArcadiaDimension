import { MousePointerClick, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { getErrorMessage } from '@/lib/api-client'
import { formatInteger, formatPercent } from '@/lib/format'
import { useRackLocations } from '../api'
import { getOccupancyLevel, OCCUPANCY_PALETTE, occupancyRatio } from '../lib/occupancy'
import { useEditorStore } from '../store/editor-store'
import { LocationDetail } from './location-detail'
import { LocationGrid } from './location-grid'

export interface LocationsTarget {
  rackId: string
  locationId?: string
}

interface LocationsDialogProps {
  warehouseId: string
  target: LocationsTarget | null
  onClose: () => void
}

export function LocationsDialog({ warehouseId, target, onClose }: LocationsDialogProps) {
  const rack = useEditorStore((state) =>
    target ? state.elements.find((element) => element.id === target.rackId) : undefined,
  )
  const grid = rack?.type === 'rack' ? rack.properties : null

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      size="xl"
      title={`${rack?.name ?? 'Rack'} · Ubicaciones`}
      description={
        grid
          ? `${grid.rows} ${grid.rows === 1 ? 'fila' : 'filas'} × ${grid.columns} ${grid.columns === 1 ? 'columna' : 'columnas'} · ${formatInteger(grid.rows * grid.columns)} ubicaciones`
          : undefined
      }
      bodyClassName="p-0 overflow-hidden"
    >
      {target && (
        <LocationsBrowser
          key={target.rackId}
          warehouseId={warehouseId}
          rackId={target.rackId}
          initialLocationId={target.locationId}
        />
      )}
    </Dialog>
  )
}

interface LocationsBrowserProps {
  warehouseId: string
  rackId: string
  initialLocationId?: string
}

function LocationsBrowser({ warehouseId, rackId, initialLocationId }: LocationsBrowserProps) {
  const query = useRackLocations(rackId)
  const [selectedId, setSelectedId] = useState<string | null>(initialLocationId ?? null)

  if (query.isPending) {
    return (
      <div className="grid h-[min(40rem,calc(100vh-12rem))] grid-cols-6 content-start gap-2 p-6" aria-busy="true">
        {Array.from({ length: 18 }, (_, index) => (
          <div key={index} className="h-[4.5rem] animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <EmptyState
        className="h-80"
        title="No se han podido cargar las ubicaciones"
        description={getErrorMessage(query.error)}
        action={
          <Button onClick={() => query.refetch()} loading={query.isFetching}>
            <RefreshCw />
            Reintentar
          </Button>
        }
      />
    )
  }

  const { rack, locations } = query.data
  const selected = locations.find((location) => location.id === selectedId) ?? null
  const occupied = locations.filter((location) => location.content).length
  const ratio = occupancyRatio(occupied, locations.length)
  const palette = OCCUPANCY_PALETTE[getOccupancyLevel(ratio)]

  const stats = [
    ['Ubicaciones', formatInteger(locations.length)],
    ['Ocupadas', formatInteger(occupied)],
    ['Libres', formatInteger(locations.length - occupied)],
  ]

  return (
    <div className="grid h-[min(40rem,calc(100vh-12rem))] grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-6 border-b border-slate-100 px-6 py-3">
          {stats.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-slate-900 tabular-nums">{value}</p>
            </div>
          ))}
          <div className="ml-auto w-48">
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="text-slate-500">Ocupación</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: palette.text }}>
                {formatPercent(ratio)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, backgroundColor: palette.solid }} />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6 scrollbar-thin">
          <LocationGrid
            rows={rack.rows}
            columns={rack.columns}
            locations={locations}
            selectedId={selectedId}
            highlightId={initialLocationId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      <aside className="min-h-0 overflow-y-auto border-l border-slate-100 bg-slate-50/60 scrollbar-thin">
        {selected ? (
          <LocationDetail
            key={`${selected.id}:${selected.content?.updatedAt ?? 'empty'}`}
            warehouseId={warehouseId}
            rackId={rackId}
            location={selected}
          />
        ) : (
          <EmptyState
            className="h-full"
            icon={<MousePointerClick className="size-6" />}
            title="Selecciona una ubicación"
            description="Haz clic en una celda para ver su contenido o asignar un artículo."
          />
        )}
      </aside>
    </div>
  )
}
