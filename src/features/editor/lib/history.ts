export interface HistoryEntry<T> {
  state: T
  label: string
  /** Consecutive changes with the same key are merged into one entry. */
  key?: string
  at: number
}

export interface History<T> {
  past: HistoryEntry<T>[]
  future: HistoryEntry<T>[]
}

export const HISTORY_LIMIT = 100
export const COALESCE_WINDOW_MS = 1000

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] })

interface PushOptions {
  key?: string
  now?: number
  limit?: number
}

/** Records `previous` as the state to return to when undoing the change described by `label`. */
export function pushHistory<T>(history: History<T>, previous: T, label: string, options: PushOptions = {}): History<T> {
  const { key, now = Date.now(), limit = HISTORY_LIMIT } = options
  const last = history.past.at(-1)

  if (key && last?.key === key && now - last.at <= COALESCE_WINDOW_MS) {
    return { past: [...history.past.slice(0, -1), { ...last, at: now }], future: [] }
  }

  const past = [...history.past, { state: previous, label, key, at: now }]
  return { past: past.slice(-limit), future: [] }
}

export interface HistoryStep<T> {
  history: History<T>
  state: T
  label: string
}

export function undoHistory<T>(history: History<T>, current: T): HistoryStep<T> | null {
  const entry = history.past.at(-1)
  if (!entry) return null
  return {
    state: entry.state,
    label: entry.label,
    history: {
      past: history.past.slice(0, -1),
      future: [{ state: current, label: entry.label, at: entry.at }, ...history.future],
    },
  }
}

export function redoHistory<T>(history: History<T>, current: T): HistoryStep<T> | null {
  const [entry, ...future] = history.future
  if (!entry) return null
  return {
    state: entry.state,
    label: entry.label,
    history: {
      past: [...history.past, { state: current, label: entry.label, at: entry.at }],
      future,
    },
  }
}
