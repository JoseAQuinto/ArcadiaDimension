import { LayoutGrid } from 'lucide-react'
import type { RackOccupancy } from '@shared/api'
import { LIMITS, RACK_CODE_PATTERN, type RackElement } from '@shared/elements'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { formatInteger, formatPercent } from '@/lib/format'
import { getOccupancyLevel, OCCUPANCY_PALETTE, occupancyRatio } from '../lib/occupancy'
import { useEditorStore } from '../store/editor-store'
import { NumberField, PanelSection, TextField } from './fields'

interface RackSectionProps {
  rack: RackElement
  occupancy: RackOccupancy | undefined
  onOpenLocations: (rackId: string) => void
}

export function RackSection({ rack, occupancy, onOpenLocations }: RackSectionProps) {
  const elements = useEditorStore((state) => state.elements)
  const updateElement = useEditorStore((state) => state.updateElement)
  const { code, rows, columns } = rack.properties

  const total = rows * columns
  const occupied = Math.min(occupancy?.occupied ?? 0, total)
  const ratio = occupancyRatio(occupied, total)
  const palette = OCCUPANCY_PALETTE[getOccupancyLevel(ratio)]
  const minRows = Math.max(1, occupancy?.maxOccupiedRow ?? 0)
  const minColumns = Math.max(1, occupancy?.maxOccupiedColumn ?? 0)

  const validateCode = (value: string) => {
    if (!RACK_CODE_PATTERN.test(value)) return 'De 1 a 6 letras mayúsculas o números'
    const taken = elements.some(
      (element) => element.type === 'rack' && element.id !== rack.id && element.properties.code === value,
    )
    return taken ? 'Ya existe un rack con este código' : null
  }

  const commitCode = (value: string) => {
    const nameFollowsCode = rack.name === `Rack ${code}`
    updateElement(
      rack.id,
      { properties: { code: value }, ...(nameFollowsCode ? { name: `Rack ${value}` } : {}) },
      { label: `Cambiar código de ${rack.name}`, coalesceKey: `${rack.id}:code` },
    )
  }

  const updateGrid = (patch: { rows?: number; columns?: number }) =>
    updateElement(
      rack.id,
      { properties: patch },
      { label: `Cambiar ubicaciones de ${rack.name}`, coalesceKey: `${rack.id}:grid` },
    )

  return (
    <PanelSection title="Ubicaciones">
      <div className="space-y-3">
        <TextField
          label="Código del rack"
          value={code}
          maxLength={6}
          mono
          transform={(value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '')}
          validate={validateCode}
          onCommit={commitCode}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Filas</p>
            <NumberField
              label="F"
              name="Filas (niveles)"
              value={rows}
              integer
              min={minRows}
              max={LIMITS.rackMaxRows}
              onChange={(value) => updateGrid({ rows: value })}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Columnas</p>
            <NumberField
              label="C"
              name="Columnas (huecos)"
              value={columns}
              integer
              min={minColumns}
              max={LIMITS.rackMaxColumns}
              onChange={(value) => updateGrid({ columns: value })}
            />
          </div>
        </div>
        {(minRows > 1 || minColumns > 1) && (
          <p className="text-[11px] leading-relaxed text-slate-500">
            Hay stock hasta la fila {minRows} y la columna {minColumns}: no se puede reducir por debajo.
          </p>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500">
              {formatInteger(occupied)} de {formatInteger(total)} ocupadas
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: palette.text }}>
              {formatPercent(ratio)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
            <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, backgroundColor: palette.solid }} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-400">
            {code}-01-01 … {code}-{String(rows).padStart(2, '0')}-{String(columns).padStart(2, '0')}
          </p>
        </div>

        <Button variant="primary" className="w-full" onClick={() => onOpenLocations(rack.id)}>
          <LayoutGrid />
          Ver ubicaciones
          <Kbd tone="dark">Enter</Kbd>
        </Button>
      </div>
    </PanelSection>
  )
}
