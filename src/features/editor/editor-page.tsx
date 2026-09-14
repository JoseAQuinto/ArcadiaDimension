import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { RackOccupancy, Warehouse } from '@shared/api'
import { LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { buttonClassName } from '@/components/ui/button-styles'
import { FullScreenLoader } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { WarehouseFormDialog } from '@/features/warehouses/warehouse-form-dialog'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ApiError, getErrorMessage } from '@/lib/api-client'
import { useLayout, useOccupancy } from './api'
import { WarehouseCanvas } from './canvas/warehouse-canvas'
import { useEditorShortcuts } from './hooks/use-editor-shortcuts'
import { useLayoutAutosave } from './hooks/use-layout-autosave'
import { LocationsDialog, type LocationsTarget } from './locations/locations-dialog'
import { EditorHeader } from './panels/editor-header'
import { EditorToolbar } from './panels/editor-toolbar'
import { ElementPalette } from './panels/element-palette'
import { PropertiesPanel } from './panels/properties-panel'
import { ShortcutsDialog } from './panels/shortcuts-dialog'
import { SmallScreenNotice } from './panels/small-screen-notice'
import { SearchBox } from './search/search-box'
import { useEditorStore } from './store/editor-store'

const EMPTY_OCCUPANCY = new Map<string, RackOccupancy>()

export default function EditorPage() {
  const { warehouseId = '' } = useParams()
  const layout = useLayout(warehouseId)
  const occupancyQuery = useOccupancy(warehouseId)
  const load = useEditorStore((state) => state.load)
  const setFloor = useEditorStore((state) => state.setFloor)
  const loadedSource = useEditorStore((state) => state.source)
  const ready = layout.data !== undefined && loadedSource === layout.data

  const [warehouseMeta, setWarehouseMeta] = useState<Warehouse | null>(null)
  const [locationsTarget, setLocationsTarget] = useState<LocationsTarget | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const warehouse = warehouseMeta ?? layout.data?.warehouse
  useDocumentTitle(warehouse?.name)

  useEffect(() => {
    if (layout.data && useEditorStore.getState().source !== layout.data) load(layout.data)
  }, [layout.data, load])

  const { flush, retry } = useLayoutAutosave(warehouseId, ready)
  const { refetch } = layout

  /** Locations live on the server, so pending layout changes are saved before opening them. */
  const openLocations = useCallback(
    async (rackId: string, locationId?: string) => {
      if (!(await flush())) {
        toast.error('No se ha podido guardar el plano. Revisa la conexión e inténtalo de nuevo.')
        return
      }
      setLocationsTarget({ rackId, locationId })
    },
    [flush],
  )
  const handleOpenLocations = useCallback(
    (rackId: string, locationId?: string) => void openLocations(rackId, locationId),
    [openLocations],
  )

  const reloadLayout = useCallback(async () => {
    const result = await refetch()
    if (result.data) {
      load(result.data)
      toast.info('Plano recargado con la última versión guardada')
    }
  }, [load, refetch])

  useEditorShortcuts(
    {
      onOpenLocations: handleOpenLocations,
      onFocusSearch: () => searchInputRef.current?.focus(),
      onShowShortcuts: () => setShortcutsOpen(true),
    },
    ready,
  )

  if (layout.isError) return <EditorLoadError error={layout.error} onRetry={() => void refetch()} />
  if (!ready || !warehouse) return <FullScreenLoader label="Cargando plano…" />

  const occupancy = occupancyQuery.data ?? EMPTY_OCCUPANCY

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas">
      <EditorHeader
        warehouse={warehouse}
        onEditWarehouse={() => setSettingsOpen(true)}
        onShowShortcuts={() => setShortcutsOpen(true)}
        search={<SearchBox warehouseId={warehouseId} inputRef={searchInputRef} onOpenLocation={handleOpenLocations} />}
      />
      <ConflictBanner onReload={() => void reloadLayout()} />

      <div className="flex min-h-0 flex-1">
        <ElementPalette />
        <main className="relative min-w-0 flex-1">
          <WarehouseCanvas occupancy={occupancy} onOpenLocations={handleOpenLocations} />
        </main>
        <PropertiesPanel
          warehouse={warehouse}
          occupancy={occupancy}
          onOpenLocations={handleOpenLocations}
          onEditWarehouse={() => setSettingsOpen(true)}
        />
      </div>

      <EditorToolbar onRetrySave={() => void retry()} onReload={() => void reloadLayout()} />

      <LocationsDialog warehouseId={warehouseId} target={locationsTarget} onClose={() => setLocationsTarget(null)} />
      <WarehouseFormDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        warehouse={warehouse}
        onSaved={(saved) => {
          setWarehouseMeta(saved)
          setFloor({ width: saved.width, height: saved.height })
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SmallScreenNotice />
    </div>
  )
}

function ConflictBanner({ onReload }: { onReload: () => void }) {
  const status = useEditorStore((state) => state.saveStatus)
  if (status !== 'conflict') return null

  return (
    <div role="alert" className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <TriangleAlert className="size-4 shrink-0 text-amber-600" />
      <span>
        Este plano se ha modificado desde otra sesión y tus últimos cambios no se han podido guardar.
      </span>
      <Button size="sm" className="ml-auto" onClick={onReload}>
        <RefreshCw />
        Recargar plano
      </Button>
    </div>
  )
}

function EditorLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <LogoMark className="size-10" />
      <h1 className="mt-6 text-lg font-semibold text-slate-900">
        {notFound ? 'Almacén no encontrado' : 'No se ha podido abrir el plano'}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {notFound ? 'Puede que se haya eliminado o que no tengas acceso a él.' : getErrorMessage(error)}
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className={buttonClassName()}>
          <ArrowLeft />
          Volver a almacenes
        </Link>
        {!notFound && (
          <Button variant="primary" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
