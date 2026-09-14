import type { RackOccupancy, Warehouse } from '@shared/api'
import { selectSelectedElement, useEditorStore } from '../store/editor-store'
import { ElementProperties } from './element-properties'
import { LayoutOverview } from './layout-overview'

interface PropertiesPanelProps {
  warehouse: Warehouse
  occupancy: Map<string, RackOccupancy>
  onOpenLocations: (rackId: string) => void
  onEditWarehouse: () => void
}

export function PropertiesPanel({ warehouse, occupancy, onOpenLocations, onEditWarehouse }: PropertiesPanelProps) {
  const selected = useEditorStore(selectSelectedElement)

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white scrollbar-thin" aria-label="Propiedades">
      {selected ? (
        <ElementProperties
          key={selected.id}
          element={selected}
          occupancy={occupancy.get(selected.id)}
          onOpenLocations={onOpenLocations}
        />
      ) : (
        <LayoutOverview warehouse={warehouse} occupancy={occupancy} onEditWarehouse={onEditWarehouse} />
      )}
    </aside>
  )
}
