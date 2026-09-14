import { describe, expect, it } from 'vitest'
import { emptyHistory, pushHistory, redoHistory, undoHistory } from './history'

describe('history', () => {
  it('undoes and redoes a sequence of changes in order', () => {
    let history = emptyHistory<string>()
    history = pushHistory(history, 'initial', 'Mover rack', { now: 0 })
    history = pushHistory(history, 'moved', 'Redimensionar rack', { now: 5_000 })
    history = pushHistory(history, 'resized', 'Rotar rack', { now: 10_000 })
    history = pushHistory(history, 'rotated', 'Eliminar rack', { now: 15_000 })

    let current = 'deleted'
    const undoLabels: string[] = []
    for (let step = undoHistory(history, current); step; step = undoHistory(history, current)) {
      undoLabels.push(step.label)
      history = step.history
      current = step.state
    }
    expect(undoLabels).toEqual(['Eliminar rack', 'Rotar rack', 'Redimensionar rack', 'Mover rack'])
    expect(current).toBe('initial')

    const redo = redoHistory(history, current)
    expect(redo?.label).toBe('Mover rack')
    expect(redo?.state).toBe('moved')

    const redoAll = ['moved', 'resized', 'rotated', 'deleted']
    const states: string[] = []
    for (let step = redoHistory(history, current); step; step = redoHistory(history, current)) {
      states.push(step.state)
      history = step.history
      current = step.state
    }
    expect(states).toEqual(redoAll)
    expect(redoHistory(history, current)).toBeNull()
  })

  it('clears the redo stack when a new change is recorded', () => {
    let history = pushHistory(emptyHistory<number>(), 1, 'A', { now: 0 })
    history = undoHistory(history, 2)!.history
    expect(history.future).toHaveLength(1)

    history = pushHistory(history, 1, 'B', { now: 10_000 })
    expect(history.future).toHaveLength(0)
  })

  it('coalesces consecutive changes with the same key', () => {
    let history = pushHistory(emptyHistory<string>(), 'a', 'Editar ancho', { key: 'w', now: 0 })
    history = pushHistory(history, 'ab', 'Editar ancho', { key: 'w', now: 400 })
    history = pushHistory(history, 'abc', 'Editar ancho', { key: 'w', now: 900 })
    expect(history.past).toHaveLength(1)
    expect(history.past[0].state).toBe('a')

    history = pushHistory(history, 'abcd', 'Editar ancho', { key: 'w', now: 2_500 })
    expect(history.past).toHaveLength(2)
  })

  it('keeps a bounded number of entries', () => {
    let history = emptyHistory<number>()
    for (let index = 0; index < 150; index++) history = pushHistory(history, index, `#${index}`, { now: index * 5_000 })
    expect(history.past).toHaveLength(100)
    expect(history.past[0].state).toBe(50)
  })
})
