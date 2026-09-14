import { Rect, Text } from 'react-konva'
import type { ZoneElement } from '@shared/elements'
import { getElementColor, ZONE_CATEGORY_META } from '../../lib/catalog'
import { clamp } from '../../lib/geometry'
import { CANVAS_FONT, darken, withAlpha } from '../konva-utils'

export function ZoneShape({ element }: { element: ZoneElement }) {
  const { width, height, name } = element
  const color = getElementColor(element)
  const categoryLabel = ZONE_CATEGORY_META[element.properties.category].label
  const fontSize = clamp(Math.min(width, height) * 0.1, 0.5, 1.5)
  const padding = Math.min(fontSize * 0.7, width * 0.08)
  const showCategory = name !== categoryLabel && height > fontSize * 3.4

  return (
    <>
      <Rect
        width={width}
        height={height}
        fill={withAlpha(color, 0.08)}
        stroke={withAlpha(color, 0.8)}
        strokeWidth={1.5}
        dash={[8, 5]}
        strokeScaleEnabled={false}
        cornerRadius={Math.min(0.4, width * 0.05, height * 0.05)}
      />
      <Text
        x={padding}
        y={padding}
        width={Math.max(0, width - padding * 2)}
        text={name}
        fontFamily={CANVAS_FONT}
        fontStyle="600"
        fontSize={fontSize}
        fill={darken(color, 0.25)}
        wrap="none"
        ellipsis
        listening={false}
      />
      {showCategory && (
        <Text
          x={padding}
          y={padding + fontSize * 1.35}
          width={Math.max(0, width - padding * 2)}
          text={categoryLabel}
          fontFamily={CANVAS_FONT}
          fontSize={fontSize * 0.72}
          fill={withAlpha(color, 0.9)}
          wrap="none"
          ellipsis
          listening={false}
        />
      )}
    </>
  )
}
