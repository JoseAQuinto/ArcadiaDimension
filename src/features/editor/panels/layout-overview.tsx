import { MousePointer2, Pencil } from 'lucide-react'
import type { RackOccupancy, Warehouse } from '@shared/api'
import { isRack } from '@shared/elements'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { formatInteger, formatNumber, formatPercent } from '@/lib/format'
import { ELEMENT_META, ELEMENT_TYPE_ORDER } from '../lib/catalog'
import { getOccupancyLevel, OCCUPANCY_LEGEND, OCCUPANCY_PALETTE, occupancyRatio } from '../lib/occupancy'
import { useEditorStore } from '../store/editor-store'
import { PanelSection } from './fields'

interface LayoutOverviewProps {
  warehouse: Warehouse
  occupancy: Map<string, RackOccupancy>
  onEditWarehouse: () => void
}

export function LayoutOverview({ warehouse, occupancy, onEditWarehouse }: LayoutOverviewProps) {
  const elements = useEditorStore((state) => state.elements)
  const showOccupancy = useEditorStore((state) => state.showOccupancy)
  const toggleOccupancy = useEditorStore((state) => state.toggleOccupancy)

  const racks = elements.filter(isRack)
  const totals = racks.reduce(
    (acc, rack) => {
      const capacity = rack.properties.rows * rack.properties.columns
      return {
        locations: acc.locations + capacity,
        occupied: acc.occupied + Math.min(occupancy.get(rack.id)?.occupied ?? 0, capacity),
      }
    },
    { locations: 0, occupied: 0 },
  )
  const ratio = occupancyRatio(totals.occupied, totals.locations)
  const palette = OCCUPANCY_PALETTE[getOccupancyLevel(ratio)]

  return (
    <>
      <PanelSection
        title="Plano"
        action={
          <Button variant="ghost" size="sm" className="-my-1 -mr-2 h-7" onClick={onEditWarehouse}>
            <Pencil />
            Editar
          </Button>
        }
      >
        <p className="text-sm font-semibold text-slate-900">{warehouse.name}</p>
        {warehouse.description && (
          <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-slate-500">{warehouse.description}</p>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] text-slate-500">Dimensiones</dt>
            <dd className="text-[13px] font-semibold text-slate-800 tabular-nums">
              {formatNumber(warehouse.width)} × {formatNumber(warehouse.height)} m
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-[11px] text-slate-500">Superficie</dt>
            <dd className="text-[13px] font-semibold text-slate-800 tabular-nums">
              {formatInteger(Math.round(warehouse.width * warehouse.height))} m²
            </dd>
          </div>
        </dl>
      </PanelSection>

      <PanelSection title="Elementos">
        <ul className="space-y-1.5">
          {ELEMENT_TYPE_ORDER.map((type) => {
            const { plural, icon: Icon } = ELEMENT_META[type]
            const count = elements.filter((element) => element.type === type).length
            return (
              <li key={type} className="flex items-center gap-2.5 text-[13px]">
                <Icon className="size-3.5 text-slate-400" />
                <span className="flex-1 text-slate-600">{plural}</span>
                <span className={cn('font-medium tabular-nums', count ? 'text-slate-900' : 'text-slate-300')}>{count}</span>
              </li>
            )
          })}
        </ul>
      </PanelSection>

      <PanelSection
        title="Ocupación"
        action={
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            En plano
            <input
              type="checkbox"
              checked={showOccupancy}
              onChange={toggleOccupancy}
              aria-label="Mostrar ocupación en el plano"
              className="peer sr-only"
            />
            <span className="relative h-4 w-7 rounded-full bg-slate-200 transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/30 after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-3" />
          </label>
        }
      >
        {racks.length === 0 ? (
          <p className="text-[13px] text-slate-500">Añade racks para calcular la ocupación del almacén.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tracking-tight tabular-nums" style={{ color: palette.text }}>
                {formatPercent(ratio)}
              </span>
              <span className="text-xs text-slate-500">
                {formatInteger(totals.occupied)} / {formatInteger(totals.locations)} ubicaciones
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, backgroundColor: palette.solid }} />
            </div>
          </>
        )}
        <ul className="mt-4 space-y-1.5">
          {OCCUPANCY_LEGEND.map(({ level, label }) => (
            <li key={level} className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className="size-3 rounded-[3px] border"
                style={{ backgroundColor: OCCUPANCY_PALETTE[level].fill, borderColor: OCCUPANCY_PALETTE[level].solid }}
              />
              {label}
            </li>
          ))}
        </ul>
      </PanelSection>

      <div className="m-4 flex gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3.5 text-[13px] leading-relaxed text-slate-500">
        <MousePointer2 className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>Selecciona un elemento para editar sus propiedades. Haz doble clic en un rack para gestionar sus ubicaciones.</p>
      </div>
    </>
  )
}
