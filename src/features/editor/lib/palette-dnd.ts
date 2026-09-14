import { ELEMENT_TYPES, type ElementType } from '@shared/elements'

/** DataTransfer type used when dragging an element from the palette onto the canvas. */
export const ELEMENT_DRAG_MIME = 'application/x-arcadia-element'

export function isElementType(value: string): value is ElementType {
  return (ELEMENT_TYPES as readonly string[]).includes(value)
}
