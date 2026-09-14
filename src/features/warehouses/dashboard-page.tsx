import { Plus, RefreshCw, Warehouse as WarehouseIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { WarehouseSummary } from '@shared/api'
import { AppHeader } from '@/components/layout/app-header'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { getErrorMessage } from '@/lib/api-client'
import { formatInteger, formatPercent } from '@/lib/format'
import { useDeleteWarehouse, useWarehouses } from './api'
import { WarehouseCard } from './warehouse-card'
import { WarehouseFormDialog } from './warehouse-form-dialog'

export function DashboardPage() {
  useDocumentTitle('Almacenes')
  const navigate = useNavigate()
  const warehouses = useWarehouses()
  const deleteWarehouse = useDeleteWarehouse()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<WarehouseSummary | null>(null)
  const [deleting, setDeleting] = useState<WarehouseSummary | null>(null)

  const confirmDelete = () => {
    if (!deleting) return
    deleteWarehouse.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Almacén «${deleting.name}» eliminado`)
        setDeleting(null)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  const list = warehouses.data ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Almacenes</h1>
            <p className="mt-1 text-sm text-slate-500">Diseña y visualiza la distribución de tus centros logísticos.</p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus />
            Nuevo almacén
          </Button>
        </div>

        {warehouses.isPending && <CardsSkeleton />}

        {warehouses.isError && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-panel">
            <EmptyState
              title="No se han podido cargar los almacenes"
              description={getErrorMessage(warehouses.error)}
              action={
                <Button onClick={() => warehouses.refetch()} loading={warehouses.isFetching}>
                  <RefreshCw />
                  Reintentar
                </Button>
              }
            />
          </div>
        )}

        {warehouses.isSuccess && list.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white">
            <EmptyState
              className="py-16"
              icon={
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
                  <WarehouseIcon className="size-6" />
                </div>
              }
              title="Todavía no tienes almacenes"
              description="Crea tu primer almacén, define sus dimensiones y empieza a colocar zonas, racks y muelles en el plano."
              action={
                <Button variant="primary" onClick={() => setCreating(true)}>
                  <Plus />
                  Crear mi primer almacén
                </Button>
              }
            />
          </div>
        )}

        {list.length > 0 && (
          <>
            <SummaryStrip warehouses={list} />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((warehouse) => (
                <WarehouseCard key={warehouse.id} warehouse={warehouse} onEdit={setEditing} onDelete={setDeleting} />
              ))}
            </div>
          </>
        )}
      </main>

      <WarehouseFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={(warehouse) => navigate(`/warehouses/${warehouse.id}`)}
      />
      <WarehouseFormDialog open={editing !== null} onOpenChange={() => setEditing(null)} warehouse={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar almacén"
        confirmLabel="Eliminar almacén"
        loading={deleteWarehouse.isPending}
        onConfirm={confirmDelete}
        description={
          <>
            Se eliminará <strong className="font-semibold text-slate-900">{deleting?.name}</strong> junto con su plano,
            sus ubicaciones y el contenido asignado. Esta acción no se puede deshacer.
          </>
        }
      />
    </div>
  )
}

function SummaryStrip({ warehouses }: { warehouses: WarehouseSummary[] }) {
  const totals = warehouses.reduce(
    (acc, { stats }) => ({
      racks: acc.racks + stats.racks,
      locations: acc.locations + stats.locations,
      occupied: acc.occupied + stats.occupiedLocations,
    }),
    { racks: 0, locations: 0, occupied: 0 },
  )
  const items = [
    ['Almacenes', formatInteger(warehouses.length)],
    ['Racks', formatInteger(totals.racks)],
    ['Ubicaciones', formatInteger(totals.locations)],
    ['Ocupación global', totals.locations ? formatPercent(totals.occupied / totals.locations) : '—'],
  ]

  return (
    <dl className="mt-8 grid grid-cols-2 divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel sm:grid-cols-4 sm:divide-x">
      {items.map(([label, value]) => (
        <div key={label} className="px-5 py-4">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function CardsSkeleton() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando almacenes">
      {[0, 1, 2].map((index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-[16/9] animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
