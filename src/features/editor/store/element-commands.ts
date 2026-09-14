import { toast } from '@/components/ui/toast'
import { useEditorStore } from './editor-store'

/** Deletes an element and offers an undo shortcut in a toast. */
export function deleteElementWithUndo(id: string): void {
  const removed = useEditorStore.getState().deleteElement(id)
  if (!removed) return

  const label = `Eliminar ${removed.name}`
  toast.info(`«${removed.name}» eliminado`, {
    label: 'Deshacer',
    onClick: () => {
      const editor = useEditorStore.getState()
      if (editor.history.past.at(-1)?.label === label) editor.undo()
    },
  })
}
