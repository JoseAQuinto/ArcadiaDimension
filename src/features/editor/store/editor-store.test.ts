import { beforeEach, describe, expect, it } from 'vitest'
import type { WarehouseLayout } from '@shared/api'
import type { RackElement } from '@shared/elements'
import { useEditorStore } from './editor-store'

const layout: WarehouseLayout = {
  warehouse: {
    id: 'warehouse-1',
    name: 'Almacén Valencia',
    description: null,
    width: 120,
    height: 80,
    layoutVersion: 4,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  elements: [],
}

const editor = () => useEditorStore.getState()

describe('editor store', () => {
  beforeEach(() => {
    useEditorStore.setState({ snapToGrid: true, gridSize: 1 })
    editor().load(layout)
  })

  it('adds elements snapped to the grid and selects them', () => {
    const rack = editor().addElement('rack', { x: 50.3, y: 30.2 })

    expect(editor().selectedId).toBe(rack.id)
    expect(rack).toMatchObject({ name: 'Rack A', x: 44, y: 29 })
    expect(editor().saveStatus).toBe('pending')
  })

  it('undoes and redoes move, resize, rotate and delete', () => {
    const rack = editor().addElement('rack', { x: 50, y: 30 })

    editor().beginInteraction()
    editor().updateElementLive(rack.id, { x: 20, y: 10 })
    editor().updateElementLive(rack.id, { x: 21, y: 10 })
    editor().endInteraction('Mover Rack A')
    editor().updateElement(rack.id, { width: 15 }, { label: 'Redimensionar Rack A' })
    editor().rotateElement(rack.id, 90)
    editor().deleteElement(rack.id)

    expect(editor().elements).toHaveLength(0)
    expect(editor().undo()).toBe('Eliminar Rack A')
    expect(editor().elements[0].rotation).toBe(90)
    expect(editor().undo()).toBe('Rotar Rack A')
    expect(editor().elements[0].rotation).toBe(0)
    expect(editor().undo()).toBe('Redimensionar Rack A')
    expect(editor().elements[0].width).toBe(12)
    expect(editor().undo()).toBe('Mover Rack A')
    expect(editor().elements[0]).toMatchObject({ x: rack.x, y: rack.y })
    expect(editor().undo()).toBe('Añadir Rack A')
    expect(editor().elements).toHaveLength(0)
    expect(editor().undo()).toBeNull()

    expect(editor().redo()).toBe('Añadir Rack A')
    expect(editor().redo()).toBe('Mover Rack A')
    expect(editor().elements[0]).toMatchObject({ x: 21, y: 10 })
  })

  it('does not record drags that end where they started', () => {
    const rack = editor().addElement('rack', { x: 50, y: 30 })
    const entries = editor().history.past.length

    editor().beginInteraction()
    editor().updateElementLive(rack.id, { x: rack.x, y: rack.y })
    editor().endInteraction('Mover Rack A')

    expect(editor().history.past).toHaveLength(entries)
  })

  it('duplicates racks with a new code and offset', () => {
    const rack = editor().addElement('rack', { x: 50, y: 30 })
    const copy = editor().duplicateElement(rack.id) as RackElement

    expect(copy.properties.code).toBe('B')
    expect(copy.x).toBe(rack.x + 1)
    expect(editor().selectedId).toBe(copy.id)
  })

  it('tracks the save lifecycle', () => {
    editor().addElement('zone', { x: 10, y: 10 })
    const { revision } = editor()

    editor().markSaving()
    editor().addElement('dock', { x: 30, y: 10 })
    expect(editor().saveStatus).toBe('saving')

    editor().markSaved({ revision, layoutVersion: 5, savedAt: '2026-09-01T10:01:00.000Z' })
    expect(editor().saveStatus).toBe('pending')
    expect(editor().layoutVersion).toBe(5)

    editor().markSaved({ revision: editor().revision, layoutVersion: 6, savedAt: '2026-09-01T10:02:00.000Z' })
    expect(editor().saveStatus).toBe('saved')
  })
})
