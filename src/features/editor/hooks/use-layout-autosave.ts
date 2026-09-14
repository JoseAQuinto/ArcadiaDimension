import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import type { SaveLayoutResult } from '@shared/api'
import { api, ApiError, getErrorMessage } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { useEditorStore } from '../store/editor-store'

const AUTOSAVE_DELAY_MS = 800
const RETRY_DELAY_MS = 5000

const isDirty = () => {
  const state = useEditorStore.getState()
  return state.revision !== state.savedRevision
}

/**
 * Debounced autosave of the whole layout. Saves never overlap: changes made
 * while a request is in flight are sent right after it finishes. Nothing is
 * sent while an element is being dragged or transformed.
 */
export function useLayoutAutosave(warehouseId: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const inFlight = useRef<Promise<void> | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const save = useCallback(async (): Promise<void> => {
    while (inFlight.current) await inFlight.current

    const state = useEditorStore.getState()
    if (state.warehouseId !== warehouseId || !isDirty() || state.saveStatus === 'conflict') return

    const revision = state.revision
    state.markSaving()

    inFlight.current = api
      .put<SaveLayoutResult>(`/warehouses/${warehouseId}/layout`, {
        baseVersion: state.layoutVersion,
        elements: state.elements,
      })
      .then((result) => {
        if (useEditorStore.getState().warehouseId !== warehouseId) return
        useEditorStore.getState().markSaved({ revision, layoutVersion: result.layoutVersion, savedAt: result.updatedAt })
        void queryClient.invalidateQueries({ queryKey: queryKeys.occupancy(warehouseId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.warehouses, exact: true })
      })
      .catch((error: unknown) => {
        if (useEditorStore.getState().warehouseId !== warehouseId) return
        if (error instanceof ApiError && error.status === 409) {
          useEditorStore.getState().markConflict(error.message)
        } else {
          useEditorStore.getState().markSaveError(getErrorMessage(error, 'No se ha podido guardar el plano'))
        }
      })
      .finally(() => {
        inFlight.current = null
      })

    await inFlight.current
  }, [queryClient, warehouseId])

  /** Saves immediately. Resolves to true when everything is persisted. */
  const flush = useCallback(async (): Promise<boolean> => {
    window.clearTimeout(timer.current)
    await save()
    if (isDirty() && useEditorStore.getState().saveStatus === 'pending') await save()
    return !isDirty()
  }, [save])

  useEffect(() => {
    if (!enabled) return

    const schedule = (delay: number) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void save(), delay)
    }

    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.warehouseId !== warehouseId || state.revision === state.savedRevision) return
      if (state.interactionSnapshot || state.saveStatus === 'conflict') return

      if (state.revision !== previous.revision || previous.interactionSnapshot) schedule(AUTOSAVE_DELAY_MS)
      else if (previous.saveStatus === 'saving' && state.saveStatus === 'pending') schedule(0)
      else if (previous.saveStatus !== 'error' && state.saveStatus === 'error') schedule(RETRY_DELAY_MS)
    })

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (isDirty() || useEditorStore.getState().saveStatus === 'saving') event.preventDefault()
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)

    return () => {
      unsubscribe()
      window.removeEventListener('beforeunload', warnBeforeLeaving)
      window.clearTimeout(timer.current)
      // Leaving the editor inside the SPA: persist pending changes in the background.
      if (isDirty()) void save()
    }
  }, [enabled, save, warehouseId])

  return { flush, retry: save }
}
