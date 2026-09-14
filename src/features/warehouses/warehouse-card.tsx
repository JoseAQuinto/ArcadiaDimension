import { ArrowRight, Ellipsis, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { WarehouseSummary } from '@shared/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getOccupancyLevel, OCCUPANCY_PALETTE, occupancyRatio } from '@/features/editor/lib/occupancy'
import { cn } from '@/lib/cn'
import { formatDateTime, formatInteger, formatNumber, formatPercent, formatRelativeTime } from '@/lib/format'
import { WarehousePreview } from './warehouse-preview'

interface WarehouseCardProps {
  warehouse: WarehouseSummary
  onEdit: (warehouse: WarehouseSummary) => void
  onDelete: (warehouse: WarehouseSummary) => void
}

export function WarehouseCard({ warehouse, onEdit, onDelete }: WarehouseCardProps) {
  const navigate = useNavigate()
  const { stats } = warehouse
  const editorPath = `/warehouses/${warehouse.id}`
  const ratio = occupancyRatio(stats.occupiedLocations, stats.locations)
  const palette = OCCUPANCY_PALETTE[getOccupancyLevel(ratio)]

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel transition duration-200 hover:border-slate-300 hover:shadow-float">
      <Link
        to={editorPath}
        className="relative block aspect-[16/9] overflow-hidden border-b border-slate-100 bg-slate-50 p-3 outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 focus-visible:ring-inset"
        aria-label={`Abrir editor de ${warehouse.name}`}
      >
        <WarehousePreview
          width={warehouse.width}
          height={warehouse.height}
          shapes={warehouse.preview}
          className="transition duration-300 group-hover:scale-[1.02]"
        />
        {warehouse.preview.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
            Plano vacío
          </span>
        )}
        <span className="absolute right-3 bottom-3 inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-ink-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-float transition group-hover:translate-y-0 group-hover:opacity-100">
          Abrir editor
          <ArrowRight className="size-3.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              <Link to={editorPath} className="hover:text-brand-700">
                {warehouse.name}
              </Link>
            </h3>
            <p className={cn('mt-0.5 line-clamp-1 text-[13px]', warehouse.description ? 'text-slate-500' : 'text-slate-400')}>
              {warehouse.description ?? 'Sin descripción'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="-mt-1 -mr-1.5 rounded-md p-1.5 text-slate-400 transition outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-brand-500/30 data-[state=open]:bg-slate-100"
              aria-label={`Acciones de ${warehouse.name}`}
            >
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem icon={<ExternalLink />} onSelect={() => navigate(editorPath)}>
                Abrir editor
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Pencil />} onSelect={() => onEdit(warehouse)}>
                Editar datos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 />} tone="danger" onSelect={() => onDelete(warehouse)}>
                Eliminar almacén
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Superficie', `${formatNumber(warehouse.width)} × ${formatNumber(warehouse.height)} m`],
            ['Racks', formatInteger(stats.racks)],
            ['Ubicaciones', formatInteger(stats.locations)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 px-2 py-2">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-semibold text-slate-800 tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Ocupación</span>
            <span className="font-medium tabular-nums" style={{ color: stats.locations ? palette.text : undefined }}>
              {stats.locations ? formatPercent(ratio) : '—'}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${ratio * 100}%`, backgroundColor: palette.solid }}
            />
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400" title={formatDateTime(warehouse.updatedAt)}>
          Modificado {formatRelativeTime(warehouse.updatedAt)}
        </p>
      </div>
    </article>
  )
}
