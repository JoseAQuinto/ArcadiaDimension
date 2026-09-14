import { useEffect, useEffectEvent } from 'react'
import { deleteElementWithUndo } from '../store/element-commands'
import { useEditorStore } from '../store/editor-store'

interface ShortcutHandlers {
  onOpenLocations: (rackId: string) => void
  onFocusSearch: () => void
  onShowShortcuts: () => void
}

const NUDGE_STEP = 0.1

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function useEditorShortcuts(handlers: ShortcutHandlers, enabled: boolean) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || isEditableTarget(event.target)) return
    if (document.querySelector('[role="dialog"], [role="menu"]')) return

    const editor = useEditorStore.getState()
    const selected = editor.elements.find((element) => element.id === editor.selectedId)
    const key = event.key.toLowerCase()
    const run = (action: () => unknown) => {
      event.preventDefault()
      action()
    }

    if (event.ctrlKey || event.metaKey) {
      if (key === 'z') run(() => (event.shiftKey ? editor.redo() : editor.undo()))
      else if (key === 'y') run(editor.redo)
      else if (key === 'd' && selected) run(() => editor.duplicateElement(selected.id))
      else if (key === 'c' && selected) run(editor.copySelection)
      else if (key === 'v' && editor.clipboard) run(editor.paste)
      else if (key === 'f') run(handlers.onFocusSearch)
      else if (key === '0') run(editor.fitToScreen)
      else if (key === '=' || key === '+') run(() => editor.zoomBy(1.25))
      else if (key === '-') run(() => editor.zoomBy(0.8))
      return
    }
    if (event.altKey) return

    const arrow = ARROWS[event.key]
    if (arrow && selected) {
      const step = event.shiftKey ? editor.gridSize : NUDGE_STEP
      run(() => editor.nudgeElement(selected.id, arrow[0] * step, arrow[1] * step))
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && selected) {
      run(() => deleteElementWithUndo(selected.id))
    } else if (event.key === 'Escape' && selected) {
      run(() => editor.select(null))
    } else if (event.key === 'Enter' && selected?.type === 'rack') {
      run(() => handlers.onOpenLocations(selected.id))
    } else if (event.key === '?') {
      run(handlers.onShowShortcuts)
    } else if (event.key === '/') {
      run(handlers.onFocusSearch)
    } else if (key === 'r' && selected) {
      run(() => editor.rotateElement(selected.id, event.shiftKey ? -90 : 90))
    } else if (key === 'g') {
      run(editor.toggleGrid)
    } else if (key === 's') {
      run(editor.toggleSnap)
    } else if (key === 'o') {
      run(editor.toggleOccupancy)
    }
  })

  useEffect(() => {
    if (!enabled) return
    const listener = (event: KeyboardEvent) => handleKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [enabled])
}
