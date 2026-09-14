import { GripVertical, Search } from 'lucide-react'
import { useMemo, useState, type DragEvent } from 'react'
import type { ElementType } from '@shared/elements'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'
import { ELEMENT_LAYER, ELEMENT_META, ELEMENT_TYPE_ORDER, getElementColor } from '../lib/catalog'
import { ELEMENT_DRAG_MIME } from '../lib/palette-dnd'
import { useEditorStore } from '../store/editor-store'

const PALETTE_ACCENTS: Record<ElementType, string> = {
  zone: '#3b82f6',
  rack: '#475569',
  dock: '#d97706',
  door: '#0f766e',
  obstacle: '#78716c',
}

const sectionTitle = 'text-[11px] font-semibold tracking-wider text-slate-400 uppercase'

export function ElementPalette() {
  const addElement = useEditorStore((state) => state.addElement)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white" aria-label="Elementos y capas">
      <div className="px-3 pt-4 pb-3">
        <h2 className={cn(sectionTitle, 'px-1')}>Elementos</h2>
        <ul className="mt-2 space-y-0.5">
          {ELEMENT_TYPE_ORDER.map((type) => (
            <PaletteItem key={type} type={type} onAdd={() => addElement(type)} />
          ))}
        </ul>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-slate-400">
          Arrastra al plano o haz clic para añadirlo en el centro de la vista.
        </p>
      </div>
      <LayerList />
    </aside>
  )
}

function PaletteItem({ type, onAdd }: { type: ElementType; onAdd: () => void }) {
  const { label, description, icon: Icon } = ELEMENT_META[type]

  const handleDragStart = (event: DragEvent) => {
    event.dataTransfer.setData(ELEMENT_DRAG_MIME, type)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <li>
      <Tooltip content={description} side="right">
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onClick={onAdd}
          className="group flex w-full cursor-grab items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none active:cursor-grabbing"
        >
          <span
            className="flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white shadow-panel transition group-hover:border-slate-300 group-hover:shadow-sm"
            style={{ color: PALETTE_ACCENTS[type] }}
          >
            <Icon className="size-4" />
          </span>
          <span className="flex-1 text-[13px] font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
          <GripVertical className="size-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100" />
        </button>
      </Tooltip>
    </li>
  )
}

function LayerList() {
  const elements = useEditorStore((state) => state.elements)
  const selectedId = useEditorStore((state) => state.selectedId)
  const [filter, setFilter] = useState('')

  const layers = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase('es')
    return elements
      .filter((element) => !term || element.name.toLocaleLowerCase('es').includes(term))
      .sort(
        (a, b) =>
          ELEMENT_LAYER[b.type] - ELEMENT_LAYER[a.type] || a.name.localeCompare(b.name, 'es', { numeric: true }),
      )
  }, [elements, filter])

  const selectLayer = (id: string) => {
    const editor = useEditorStore.getState()
    editor.select(id)
    editor.focusElement(id)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className={sectionTitle}>Capas</h2>
        <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500 tabular-nums">
          {elements.length}
        </span>
      </div>

      {elements.length > 8 && (
        <div className="relative px-3 pb-2">
          <Search className="pointer-events-none absolute top-1/2 left-5.5 size-3.5 -translate-y-[calc(50%+4px)] text-slate-400" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar capas…"
            aria-label="Filtrar capas"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pr-2 pl-7.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
          />
        </div>
      )}

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
        {layers.map((element) => {
          const selected = element.id === selectedId
          return (
            <li key={element.id}>
              <button
                type="button"
                onClick={() => selectLayer(element.id)}
                aria-current={selected || undefined}
                aria-label={`${element.name} (${ELEMENT_META[element.type].label})`}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:outline-none',
                  selected ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: getElementColor(element) }} />
                <span className="min-w-0 flex-1 truncate">{element.name}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{ELEMENT_META[element.type].label}</span>
              </button>
            </li>
          )
        })}
        {elements.length === 0 && <li className="px-2 py-8 text-center text-xs text-slate-400">El plano está vacío</li>}
        {elements.length > 0 && layers.length === 0 && (
          <li className="px-2 py-8 text-center text-xs text-slate-400">Ninguna capa coincide</li>
        )}
      </ul>
    </div>
  )
}
