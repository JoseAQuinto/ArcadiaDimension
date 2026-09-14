import type { RackOccupancy } from '@shared/api'
import type { WarehouseElement } from '@shared/elements'
import { DockShape } from './dock-shape'
import { DoorShape } from './door-shape'
import { ObstacleShape } from './obstacle-shape'
import { RackShape } from './rack-shape'
import { ZoneShape } from './zone-shape'

interface ElementShapeProps {
  element: WarehouseElement
  occupancy: RackOccupancy | undefined
  showOccupancy: boolean
}

export function ElementShape({ element, occupancy, showOccupancy }: ElementShapeProps) {
  switch (element.type) {
    case 'zone':
      return <ZoneShape element={element} />
    case 'rack':
      return <RackShape element={element} occupancy={occupancy} showOccupancy={showOccupancy} />
    case 'dock':
      return <DockShape element={element} />
    case 'door':
      return <DoorShape element={element} />
    case 'obstacle':
      return <ObstacleShape element={element} />
  }
}
