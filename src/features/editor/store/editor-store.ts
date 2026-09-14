import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { WarehouseLayout } from '@shared/api'
import type { ElementType, WarehouseElement } from '@shared/elements'
import { createElement, duplicateElement } from '../lib/element-factory'
import {
  clampToFloor,
  fitToView,
  focusBounds,
  getBounds,
  PIXELS_PER_METER,
  rotateAroundCenter,
  roundTo,
  snapToStep,
  toWorld,
  zoomAt,
  type Point,
  type Size,
  type Viewport,
} from '../lib/geometry'
import { emptyHistory, pushHistory, redoHistory, undoHistory, type History } from '../lib/history'

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error' | 'conflict'

type PropertiesPatch = { [E in WarehouseElement as E['type']]: Partial<E['properties']> }[ElementType]

export interface ElementPatch {
  name?: string
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  color?: string | null
  properties?: PropertiesPatch
}

export type GeometryPatch = Pick<ElementPatch, 'x' | 'y' | 'width' | 'height' | 'rotation'>

interface UpdateOptions {
  label?: string
  coalesceKey?: string
}

interface Preferences {
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  showOccupancy: boolean
}

interface EditorData extends Preferences {
  warehouseId: string | null
  /** Layout object the store was loaded from (identifies stale stores). */
  source: WarehouseLayout | null
  floor: Size
  elements: WarehouseElement[]
  selectedId: string | null
  hoveredId: string | null
  history: History<WarehouseElement[]>
  /** Elements before the current drag/transform started; null when idle. */
  interactionSnapshot: WarehouseElement[] | null
  /** Increments on every persisted change. */
  revision: number
  savedRevision: number
  layoutVersion: number
  saveStatus: SaveStatus
  saveError: string | null
  lastSavedAt: string | null
  stageSize: Size
  viewport: Viewport
  viewportAnimated: boolean
  needsFit: boolean
  clipboard: WarehouseElement | null
  highlightedIds: string[]
  pointer: Point | null
}

interface EditorActions {
  load: (layout: WarehouseLayout) => void
  setFloor: (floor: Size) => void
  select: (id: string | null) => void
  setHovered: (id: string | null) => void
  addElement: (type: ElementType, center?: Point) => WarehouseElement
  updateElement: (id: string, patch: ElementPatch, options?: UpdateOptions) => void
  beginInteraction: () => void
  updateElementLive: (id: string, patch: GeometryPatch) => void
  endInteraction: (label: string) => void
  deleteElement: (id: string) => WarehouseElement | null
  duplicateElement: (id: string) => WarehouseElement | null
  copySelection: () => void
  paste: () => WarehouseElement | null
  rotateElement: (id: string, delta: number) => void
  nudgeElement: (id: string, dx: number, dy: number) => void
  undo: () => string | null
  redo: () => string | null
  setStageSize: (size: Size) => void
  setViewport: (viewport: Viewport, animated?: boolean) => void
  zoomTo: (scale: number, anchor?: Point, animated?: boolean) => void
  zoomBy: (factor: number) => void
  fitToScreen: () => void
  focusElement: (id: string) => void
  setPointer: (point: Point | null) => void
  setHighlighted: (ids: string[]) => void
  toggleGrid: () => void
  toggleSnap: () => void
  setGridSize: (size: number) => void
  toggleOccupancy: () => void
  markSaving: () => void
  markSaved: (result: { revision: number; layoutVersion: number; savedAt: string }) => void
  markSaveError: (message: string) => void
  markConflict: (message: string) => void
}

export type EditorState = EditorData & EditorActions

const noopStorage: StateStorage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }

const DEFAULT_PREFERENCES: Preferences = { showGrid: true, snapToGrid: true, gridSize: 1, showOccupancy: true }

function applyPatch(element: WarehouseElement, patch: ElementPatch): WarehouseElement {
  return {
    ...element,
    ...patch,
    properties: patch.properties ? { ...element.properties, ...patch.properties } : element.properties,
  } as WarehouseElement
}

const patchChanges = (element: WarehouseElement, patch: GeometryPatch) =>
  (Object.keys(patch) as (keyof GeometryPatch)[]).some((key) => patch[key] !== element[key])

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => {
      /** Replaces the element list and records the previous one in the undo history. */
      const commit = (elements: WarehouseElement[], label: string, coalesceKey?: string) => {
        const state = get()
        set({
          elements,
          history: pushHistory(state.history, state.elements, label, { key: coalesceKey }),
          revision: state.revision + 1,
          saveStatus: nextStatus(state.saveStatus),
        })
      }

      const replaceElement = (id: string, update: (element: WarehouseElement) => WarehouseElement) => {
        const { elements } = get()
        const index = elements.findIndex((element) => element.id === id)
        if (index === -1) return null
        const next = elements.slice()
        next[index] = update(elements[index])
        return { next, previous: elements[index] }
      }

      const placeCopy = (source: WarehouseElement, label: string) => {
        const { elements, floor, gridSize } = get()
        const copy = duplicateElement(source, elements, Math.max(gridSize, 1))
        const placed = { ...copy, ...clampToFloor(copy, floor) }
        commit([...elements, placed], label)
        set({ selectedId: placed.id })
        return placed
      }

      return {
        ...DEFAULT_PREFERENCES,
        warehouseId: null,
        source: null,
        floor: { width: 100, height: 60 },
        elements: [],
        selectedId: null,
        hoveredId: null,
        history: emptyHistory(),
        interactionSnapshot: null,
        revision: 0,
        savedRevision: 0,
        layoutVersion: 0,
        saveStatus: 'saved',
        saveError: null,
        lastSavedAt: null,
        stageSize: { width: 0, height: 0 },
        viewport: { x: 0, y: 0, scale: PIXELS_PER_METER },
        viewportAnimated: false,
        needsFit: true,
        clipboard: null,
        highlightedIds: [],
        pointer: null,

        load: (layout) => {
          const { stageSize } = get()
          const floor = { width: layout.warehouse.width, height: layout.warehouse.height }
          const canFit = stageSize.width > 0 && stageSize.height > 0
          set({
            warehouseId: layout.warehouse.id,
            source: layout,
            floor,
            elements: layout.elements,
            selectedId: null,
            hoveredId: null,
            history: emptyHistory(),
            interactionSnapshot: null,
            revision: 0,
            savedRevision: 0,
            layoutVersion: layout.warehouse.layoutVersion,
            saveStatus: 'saved',
            saveError: null,
            lastSavedAt: layout.warehouse.updatedAt,
            clipboard: null,
            highlightedIds: [],
            pointer: null,
            viewport: canFit ? fitToView(floor, stageSize) : get().viewport,
            viewportAnimated: false,
            needsFit: !canFit,
          })
        },

        setFloor: (floor) => set({ floor }),

        select: (id) => set({ selectedId: id }),

        setHovered: (id) => {
          if (get().hoveredId !== id) set({ hoveredId: id })
        },

        addElement: (type, center) => {
          const { elements, floor, viewport, stageSize, snapToGrid, gridSize } = get()
          const target =
            center ??
            (stageSize.width > 0
              ? toWorld(viewport, { x: stageSize.width / 2, y: stageSize.height / 2 })
              : { x: floor.width / 2, y: floor.height / 2 })

          let element = createElement(type, target, elements)
          if (snapToGrid) element = { ...element, x: snapToStep(element.x, gridSize), y: snapToStep(element.y, gridSize) }
          element = { ...element, ...clampToFloor(element, floor) }

          commit([...elements, element], `Añadir ${element.name}`)
          set({ selectedId: element.id })
          return element
        },

        updateElement: (id, patch, { label, coalesceKey } = {}) => {
          const result = replaceElement(id, (element) => applyPatch(element, patch))
          if (!result) return
          commit(result.next, label ?? `Editar ${result.previous.name}`, coalesceKey)
        },

        beginInteraction: () => {
          if (!get().interactionSnapshot) set({ interactionSnapshot: get().elements })
        },

        updateElementLive: (id, patch) => {
          const current = get().elements.find((element) => element.id === id)
          if (!current || !patchChanges(current, patch)) return
          const result = replaceElement(id, (element) => applyPatch(element, patch))
          if (result) set({ elements: result.next })
        },

        endInteraction: (label) => {
          const { interactionSnapshot, elements, history, revision, saveStatus } = get()
          if (!interactionSnapshot) return
          if (interactionSnapshot === elements) {
            set({ interactionSnapshot: null })
            return
          }
          set({
            interactionSnapshot: null,
            history: pushHistory(history, interactionSnapshot, label),
            revision: revision + 1,
            saveStatus: nextStatus(saveStatus),
          })
        },

        deleteElement: (id) => {
          const { elements, selectedId } = get()
          const element = elements.find((candidate) => candidate.id === id)
          if (!element) return null
          commit(
            elements.filter((candidate) => candidate.id !== id),
            `Eliminar ${element.name}`,
          )
          set({ selectedId: selectedId === id ? null : selectedId, hoveredId: null })
          return element
        },

        duplicateElement: (id) => {
          const source = get().elements.find((element) => element.id === id)
          return source ? placeCopy(source, `Duplicar ${source.name}`) : null
        },

        copySelection: () => {
          const { elements, selectedId } = get()
          const selected = elements.find((element) => element.id === selectedId)
          if (selected) set({ clipboard: selected })
        },

        paste: () => {
          const { clipboard } = get()
          if (!clipboard) return null
          const placed = placeCopy(clipboard, `Pegar ${clipboard.name}`)
          set({ clipboard: placed })
          return placed
        },

        rotateElement: (id, delta) => {
          const element = get().elements.find((candidate) => candidate.id === id)
          if (!element) return
          get().updateElement(id, rotateAroundCenter(element, element.rotation + delta), {
            label: `Rotar ${element.name}`,
          })
        },

        nudgeElement: (id, dx, dy) => {
          const element = get().elements.find((candidate) => candidate.id === id)
          if (!element) return
          get().updateElement(
            id,
            { x: roundTo(element.x + dx), y: roundTo(element.y + dy) },
            { label: `Mover ${element.name}`, coalesceKey: `nudge:${id}` },
          )
        },

        undo: () => {
          const state = get()
          if (state.interactionSnapshot) return null
          const step = undoHistory(state.history, state.elements)
          if (!step) return null
          set({
            elements: step.state,
            history: step.history,
            revision: state.revision + 1,
            saveStatus: nextStatus(state.saveStatus),
            selectedId: step.state.some((element) => element.id === state.selectedId) ? state.selectedId : null,
          })
          return step.label
        },

        redo: () => {
          const state = get()
          if (state.interactionSnapshot) return null
          const step = redoHistory(state.history, state.elements)
          if (!step) return null
          set({
            elements: step.state,
            history: step.history,
            revision: state.revision + 1,
            saveStatus: nextStatus(state.saveStatus),
            selectedId: step.state.some((element) => element.id === state.selectedId) ? state.selectedId : null,
          })
          return step.label
        },

        setStageSize: (size) => {
          const { needsFit, warehouseId, floor } = get()
          if (needsFit && warehouseId && size.width > 0 && size.height > 0) {
            set({ stageSize: size, viewport: fitToView(floor, size), viewportAnimated: false, needsFit: false })
          } else {
            set({ stageSize: size })
          }
        },

        setViewport: (viewport, animated = false) => set({ viewport, viewportAnimated: animated }),

        zoomTo: (scale, anchor, animated = false) => {
          const { viewport, stageSize } = get()
          const point = anchor ?? { x: stageSize.width / 2, y: stageSize.height / 2 }
          set({ viewport: zoomAt(viewport, scale, point), viewportAnimated: animated })
        },

        zoomBy: (factor) => get().zoomTo(get().viewport.scale * factor, undefined, true),

        fitToScreen: () => {
          const { floor, stageSize } = get()
          if (stageSize.width > 0) set({ viewport: fitToView(floor, stageSize), viewportAnimated: true })
        },

        focusElement: (id) => {
          const { elements, stageSize, viewport } = get()
          const element = elements.find((candidate) => candidate.id === id)
          if (!element || stageSize.width === 0) return
          set({ viewport: focusBounds(getBounds(element), stageSize, viewport.scale), viewportAnimated: true })
        },

        setPointer: (pointer) => set({ pointer }),

        setHighlighted: (ids) => {
          const current = get().highlightedIds
          if (ids.length === current.length && ids.every((id, index) => id === current[index])) return
          set({ highlightedIds: ids })
        },

        toggleGrid: () => set({ showGrid: !get().showGrid }),
        toggleSnap: () => set({ snapToGrid: !get().snapToGrid }),
        setGridSize: (gridSize) => set({ gridSize }),
        toggleOccupancy: () => set({ showOccupancy: !get().showOccupancy }),

        markSaving: () => set({ saveStatus: 'saving', saveError: null }),

        markSaved: ({ revision, layoutVersion, savedAt }) => {
          const state = get()
          set({
            savedRevision: revision,
            layoutVersion,
            lastSavedAt: savedAt,
            saveError: null,
            saveStatus: state.saveStatus === 'conflict' ? 'conflict' : state.revision === revision ? 'saved' : 'pending',
          })
        },

        markSaveError: (message) => set({ saveStatus: 'error', saveError: message }),
        markConflict: (message) => set({ saveStatus: 'conflict', saveError: message }),
      }
    },
    {
      name: 'arcadia-dimension:editor-preferences',
      storage: createJSONStorage(() => (typeof localStorage === 'undefined' ? noopStorage : localStorage)),
      partialize: ({ showGrid, snapToGrid, gridSize, showOccupancy }): Preferences => ({
        showGrid,
        snapToGrid,
        gridSize,
        showOccupancy,
      }),
    },
  ),
)

/** A new change keeps "saving" / "conflict" visible; otherwise the layout becomes pending. */
function nextStatus(current: SaveStatus): SaveStatus {
  return current === 'saving' || current === 'conflict' ? current : 'pending'
}

export const selectSelectedElement = (state: EditorState) =>
  state.elements.find((element) => element.id === state.selectedId) ?? null
