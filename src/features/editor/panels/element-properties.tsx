import { Copy, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import type { RackOccupancy } from '@shared/api'
import {
  DOCK_DIRECTIONS,
  DOOR_KINDS,
  LIMITS,
  OBSTACLE_KINDS,
  ZONE_CATEGORIES,
  type WarehouseElement,
} from '@shared/elements'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  COLOR_SWATCHES,
  DOCK_DIRECTION_LABELS,
  DOOR_KIND_META,
  ELEMENT_META,
  getDefaultColor,
  getElementColor,
  getElementVariant,
  OBSTACLE_KIND_META,
  ZONE_CATEGORY_META,
} from '../lib/catalog'
import { rotateAroundCenter } from '../lib/geometry'
import { deleteElementWithUndo } from '../store/element-commands'
import { useEditorStore, type ElementPatch } from '../store/editor-store'
import { ColorField, NumberField, PanelSection, SelectField, TextField } from './fields'
import { RackSection } from './rack-section'

interface ElementPropertiesProps {
  element: WarehouseElement
  occupancy: RackOccupancy | undefined
  onOpenLocations: (rackId: string) => void
}

export function ElementProperties({ element, occupancy, onOpenLocations }: ElementPropertiesProps) {
  const updateElement = useEditorStore((state) => state.updateElement)
  const rotateElement = useEditorStore((state) => state.rotateElement)
  const duplicateElement = useEditorStore((state) => state.duplicateElement)

  const { label: typeLabel, icon: Icon } = ELEMENT_META[element.type]
  const color = getElementColor(element)

  const update = (field: string, patch: ElementPatch, verb = 'Editar') =>
    updateElement(element.id, patch, { label: `${verb} ${element.name}`, coalesceKey: `${element.id}:${field}` })

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, white)`, color }}
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">{typeLabel}</p>
          <h2 className="truncate text-sm font-semibold text-slate-900">{element.name}</h2>
        </div>
        <Tooltip content="Duplicar" shortcut="Ctrl D">
          <Button variant="ghost" size="icon-sm" onClick={() => duplicateElement(element.id)} aria-label="Duplicar elemento">
            <Copy />
          </Button>
        </Tooltip>
        <Tooltip content="Eliminar" shortcut="Supr">
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:bg-rose-50 hover:text-rose-600"
            onClick={() => deleteElementWithUndo(element.id)}
            aria-label="Eliminar elemento"
          >
            <Trash2 />
          </Button>
        </Tooltip>
      </div>

      <PanelSection title="General">
        <div className="space-y-3">
          <TextField
            label="Nombre"
            value={element.name}
            maxLength={80}
            validate={(value) => (value.trim() ? null : 'El nombre es obligatorio')}
            onCommit={(value) => update('name', { name: value.trim() }, 'Renombrar')}
          />
          <VariantField element={element} onChange={(patch) => update('variant', patch)} />
          {element.type !== 'rack' && (
            <ColorField
              value={element.color}
              defaultColor={getDefaultColor(element.type, getElementVariant(element))}
              swatches={COLOR_SWATCHES}
              onChange={(value) => update('color', { color: value }, 'Cambiar color de')}
            />
          )}
        </div>
      </PanelSection>

      <PanelSection title="Posición y tamaño">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" name="Posición X" value={element.x} step={0.1} suffix="m" onChange={(x) => update('x', { x }, 'Mover')} />
          <NumberField label="Y" name="Posición Y" value={element.y} step={0.1} suffix="m" onChange={(y) => update('y', { y }, 'Mover')} />
          <NumberField
            label="An"
            name="Ancho"
            value={element.width}
            min={LIMITS.elementMinSize}
            max={LIMITS.elementMaxSize}
            step={0.1}
            suffix="m"
            onChange={(width) => update('width', { width }, 'Redimensionar')}
          />
          <NumberField
            label="Al"
            name="Alto"
            value={element.height}
            min={LIMITS.elementMinSize}
            max={LIMITS.elementMaxSize}
            step={0.1}
            suffix="m"
            onChange={(height) => update('height', { height }, 'Redimensionar')}
          />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <NumberField
            label="∠"
            name="Rotación"
            value={element.rotation}
            min={0}
            max={359.99}
            step={1}
            suffix="°"
            className="flex-1"
            onChange={(rotation) => update('rotation', rotateAroundCenter(element, rotation), 'Rotar')}
          />
          <Tooltip content="Girar −90°" shortcut="Shift R">
            <Button variant="secondary" size="icon-sm" onClick={() => rotateElement(element.id, -90)} aria-label="Girar −90 grados">
              <RotateCcw />
            </Button>
          </Tooltip>
          <Tooltip content="Girar 90°" shortcut="R">
            <Button variant="secondary" size="icon-sm" onClick={() => rotateElement(element.id, 90)} aria-label="Girar 90 grados">
              <RotateCw />
            </Button>
          </Tooltip>
        </div>
      </PanelSection>

      {element.type === 'rack' && <RackSection rack={element} occupancy={occupancy} onOpenLocations={onOpenLocations} />}
    </>
  )
}

function VariantField({ element, onChange }: { element: WarehouseElement; onChange: (patch: ElementPatch) => void }) {
  switch (element.type) {
    case 'zone':
      return (
        <SelectField
          label="Tipo de zona"
          value={element.properties.category}
          options={ZONE_CATEGORIES.map((value) => ({ value, label: ZONE_CATEGORY_META[value].label }))}
          onChange={(category) => onChange({ properties: { category } })}
        />
      )
    case 'dock':
      return (
        <SelectField
          label="Sentido"
          value={element.properties.direction}
          options={DOCK_DIRECTIONS.map((value) => ({ value, label: DOCK_DIRECTION_LABELS[value] }))}
          onChange={(direction) => onChange({ properties: { direction } })}
        />
      )
    case 'door':
      return (
        <SelectField
          label="Tipo de puerta"
          value={element.properties.kind}
          options={DOOR_KINDS.map((value) => ({ value, label: DOOR_KIND_META[value].label }))}
          onChange={(kind) => onChange({ properties: { kind } })}
        />
      )
    case 'obstacle':
      return (
        <SelectField
          label="Tipo de obstáculo"
          value={element.properties.kind}
          options={OBSTACLE_KINDS.map((value) => ({ value, label: OBSTACLE_KIND_META[value].label }))}
          onChange={(kind) => onChange({ properties: { kind } })}
        />
      )
    case 'rack':
      return null
  }
}
