import { ArrowUpRight, Columns3, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type RefObject } from 'react'
import type { LocationSearchResult } from '@shared/api'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/cn'
import { formatInteger } from '@/lib/format'
import { useLocationSearch } from '../api'
import { useEditorStore } from '../store/editor-store'

interface SearchBoxProps {
  warehouseId: string
  inputRef: RefObject<HTMLInputElement | null>
  onOpenLocation: (rackId: string, locationId: string) => void
}

interface ResultGroup {
  elementId: string
  elementName: string
  results: LocationSearchResult[]
}

function groupByRack(results: LocationSearchResult[]): ResultGroup[] {
  const groups = new Map<string, ResultGroup>()
  for (const result of results) {
    const group = groups.get(result.elementId) ?? { elementId: result.elementId, elementName: result.elementName, results: [] }
    group.results.push(result)
    groups.set(result.elementId, group)
  }
  return [...groups.values()]
}

/** Finds locations by article, description, lot or code and highlights the matching racks. */
export function SearchBox({ warehouseId, inputRef, onOpenLocation }: SearchBoxProps) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const term = useDebouncedValue(query.trim(), 250)
  const enabled = term.length >= 2
  const search = useLocationSearch(warehouseId, term)

  const results = useMemo(() => (enabled ? (search.data ?? []) : []), [enabled, search.data])
  const groups = useMemo(() => groupByRack(results), [results])
  const indexByLocation = useMemo(() => new Map(results.map((result, index) => [result.locationId, index])), [results])
  const setHighlighted = useEditorStore((state) => state.setHighlighted)

  useEffect(() => {
    setHighlighted(groups.map((group) => group.elementId))
  }, [groups, setHighlighted])

  useEffect(() => () => useEditorStore.getState().setHighlighted([]), [])

  const goTo = (result: LocationSearchResult) => {
    const editor = useEditorStore.getState()
    editor.select(result.elementId)
    editor.focusElement(result.elementId)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (results.length ? (index + delta + results.length) % results.length : 0))
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      goTo(results[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      if (open && query) setOpen(false)
      else if (query) setQuery('')
      else event.currentTarget.blur()
    }
  }

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open && enabled}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label="Buscar en el almacén"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar artículo, lote o ubicación…"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-16 pl-9 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5">
        {enabled && search.isFetching && <Spinner className="size-3.5 text-slate-400" />}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="rounded p-0.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Kbd>Ctrl F</Kbd>
        )}
      </div>

      {open && enabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-2 max-h-[26rem] animate-fade-in overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-float scrollbar-thin"
        >
          {results.length > 0 && (
            <p className="px-2 pt-1 pb-1.5 text-xs text-slate-500">
              {formatInteger(results.length)} {results.length === 1 ? 'ubicación' : 'ubicaciones'} en{' '}
              {formatInteger(groups.length)} {groups.length === 1 ? 'rack' : 'racks'}
            </p>
          )}

          {groups.map((group) => (
            <div key={group.elementId} className="pb-1">
              <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <Columns3 className="size-3.5" />
                {group.elementName}
              </p>
              {group.results.map((result) => {
                const active = indexByLocation.get(result.locationId) === activeIndex
                return (
                  <div
                    key={result.locationId}
                    role="option"
                    aria-selected={active}
                    className={cn('group flex items-center gap-1 rounded-lg pr-1', active ? 'bg-brand-50' : 'hover:bg-slate-50')}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goTo(result)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5 text-left"
                    >
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700 group-hover:bg-white">
                        {result.locationCode}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{result.content.articleCode}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {result.content.description ?? 'Sin descripción'}
                          {result.content.lot ? ` · Lote ${result.content.lot}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-slate-600 tabular-nums">
                        {formatInteger(result.content.quantity)} uds
                      </span>
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setOpen(false)
                        onOpenLocation(result.elementId, result.locationId)
                      }}
                      title="Abrir ubicación"
                      aria-label={`Abrir ubicación ${result.locationCode}`}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-brand-600"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          ))}

          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              {search.isFetching ? 'Buscando…' : `Sin resultados para «${term}»`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
