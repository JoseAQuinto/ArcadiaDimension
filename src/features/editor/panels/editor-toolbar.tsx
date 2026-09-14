import { ChevronUp, Gauge, Grid3x3, Magnet, Maximize, Redo2, Scan, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/cn'
import { formatInteger, formatNumber } from '@/lib/format'
import { GRID_SIZES, MAX_SCALE, MIN_SCALE, PIXELS_PER_METER } from '../lib/geometry'
import { useEditorStore } from '../store/editor-store'
import { SaveStatus } from './save-status'
import { ToolbarButton, ToolbarDivider } from './toolbar-button'

const ZOOM_PRESETS = [0.5, 1, 2, 4]

const menuTriggerClass =
  'inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-slate-700 tabular-nums transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/30 data-[state=open]:bg-slate-100'

interface EditorToolbarProps {
  onRetrySave: () => void
  onReload: () => void
}

export function EditorToolbar({ onRetrySave, onReload }: EditorToolbarProps) {
  const scale = useEditorStore((state) => state.viewport.scale)
  const showGrid = useEditorStore((state) => state.showGrid)
  const snapToGrid = useEditorStore((state) => state.snapToGrid)
  const gridSize = useEditorStore((state) => state.gridSize)
  const showOccupancy = useEditorStore((state) => state.showOccupancy)
  const undoLabel = useEditorStore((state) => state.history.past.at(-1)?.label)
  const redoLabel = useEditorStore((state) => state.history.future[0]?.label)
  const elementCount = useEditorStore((state) => state.elements.length)

  const { zoomBy, zoomTo, fitToScreen, toggleGrid, toggleSnap, setGridSize, toggleOccupancy, undo, redo } =
    useEditorStore.getState()

  return (
    <footer className="relative z-10 flex h-11 shrink-0 items-center border-t border-slate-200 bg-white px-2" aria-label="Barra de herramientas">
      <ToolbarButton label="Alejar" shortcut="Ctrl −" onClick={() => zoomBy(0.8)} disabled={scale <= MIN_SCALE}>
        <ZoomOut />
      </ToolbarButton>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(menuTriggerClass, 'w-[4.5rem] justify-center')} aria-label="Nivel de zoom">
          {formatInteger(Math.round((scale / PIXELS_PER_METER) * 100))}%
          <ChevronUp className="size-3 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="min-w-44">
          {ZOOM_PRESETS.map((preset) => (
            <DropdownMenuItem key={preset} onSelect={() => zoomTo(preset * PIXELS_PER_METER, undefined, true)}>
              {preset * 100}%
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={<Maximize />} onSelect={fitToScreen}>
            Ajustar a pantalla
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarButton label="Acercar" shortcut="Ctrl +" onClick={() => zoomBy(1.25)} disabled={scale >= MAX_SCALE}>
        <ZoomIn />
      </ToolbarButton>
      <ToolbarButton label="Ajustar a pantalla" shortcut="Ctrl 0" onClick={fitToScreen}>
        <Scan />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="Mostrar cuadrícula" shortcut="G" pressed={showGrid} onClick={toggleGrid}>
        <Grid3x3 />
      </ToolbarButton>
      <ToolbarButton label="Ajustar a la cuadrícula" shortcut="S" pressed={snapToGrid} onClick={toggleSnap}>
        <Magnet />
      </ToolbarButton>
      <DropdownMenu>
        <DropdownMenuTrigger className={menuTriggerClass} aria-label="Tamaño de la cuadrícula">
          {formatNumber(gridSize)} m
          <ChevronUp className="size-3 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="min-w-40">
          {GRID_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onSelect={() => setGridSize(size)}
              className={cn(size === gridSize && 'font-semibold text-brand-700')}
            >
              Celda de {formatNumber(size)} m
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarButton label="Mapa de ocupación" shortcut="O" pressed={showOccupancy} onClick={toggleOccupancy}>
        <Gauge />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label={undoLabel ? `Deshacer: ${undoLabel}` : 'Deshacer'} shortcut="Ctrl Z" onClick={undo} disabled={!undoLabel}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label={redoLabel ? `Rehacer: ${redoLabel}` : 'Rehacer'} shortcut="Ctrl Y" onClick={redo} disabled={!redoLabel}>
        <Redo2 />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-5 pr-2">
        <PointerReadout />
        <span className="hidden text-xs text-slate-400 tabular-nums xl:inline">
          {formatInteger(elementCount)} {elementCount === 1 ? 'elemento' : 'elementos'}
        </span>
        <SaveStatus onRetry={onRetrySave} onReload={onReload} />
      </div>
    </footer>
  )
}

const coordinate = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function PointerReadout() {
  const pointer = useEditorStore((state) => state.pointer)
  return (
    <span className="hidden w-40 text-right font-mono text-[11px] text-slate-400 tabular-nums lg:inline">
      {pointer ? `X ${coordinate.format(pointer.x)}  Y ${coordinate.format(pointer.y)} m` : ''}
    </span>
  )
}
