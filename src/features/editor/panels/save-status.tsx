import { CloudCheck, CloudOff, TriangleAlert } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip } from '@/components/ui/tooltip'
import { formatDateTime } from '@/lib/format'
import { useEditorStore } from '../store/editor-store'

interface SaveStatusProps {
  onRetry: () => void
  onReload: () => void
}

export function SaveStatus({ onRetry, onReload }: SaveStatusProps) {
  const status = useEditorStore((state) => state.saveStatus)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const saveError = useEditorStore((state) => state.saveError)

  return (
    <div role="status" aria-live="polite" className="flex min-w-36 items-center justify-end text-xs font-medium">
      {status === 'saved' && (
        <Tooltip content={lastSavedAt ? `Último guardado: ${formatDateTime(lastSavedAt)}` : 'Todo guardado'}>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <CloudCheck className="size-4" />
            Guardado
          </span>
        </Tooltip>
      )}
      {status === 'pending' && (
        <span className="flex items-center gap-2 text-slate-500">
          <span className="size-1.5 rounded-full bg-amber-400" />
          Cambios sin guardar
        </span>
      )}
      {status === 'saving' && (
        <span className="flex items-center gap-2 text-slate-500">
          <Spinner className="size-3.5 text-brand-600" />
          Guardando…
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-2 text-rose-600" title={saveError ?? undefined}>
          <CloudOff className="size-4" />
          Error al guardar
          <button type="button" onClick={onRetry} className="rounded px-1 font-semibold underline-offset-2 hover:underline">
            Reintentar
          </button>
        </span>
      )}
      {status === 'conflict' && (
        <span className="flex items-center gap-2 text-amber-700">
          <TriangleAlert className="size-4" />
          Conflicto de versiones
          <button type="button" onClick={onReload} className="rounded px-1 font-semibold underline-offset-2 hover:underline">
            Recargar
          </button>
        </span>
      )}
    </div>
  )
}
