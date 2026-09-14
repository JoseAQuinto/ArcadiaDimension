import { lazy, Suspense } from 'react'
import { FullScreenLoader } from '@/components/ui/spinner'

// Konva and the editor are only downloaded when a warehouse is opened.
const EditorPage = lazy(() => import('./editor-page'))

export function LazyEditorPage() {
  return (
    <Suspense fallback={<FullScreenLoader label="Cargando editor…" />}>
      <EditorPage />
    </Suspense>
  )
}
