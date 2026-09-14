import Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Rect } from 'react-konva'
import { SELECTION_COLOR } from '../konva-utils'

const PULSE_DURATION_MS = 3600

/** Glowing outline for search matches; pulses briefly, then stays static. */
export function HighlightRing({ width, height }: { width: number; height: number }) {
  const ringRef = useRef<Konva.Rect>(null)

  useEffect(() => {
    const ring = ringRef.current
    const layer = ring?.getLayer()
    if (!ring || !layer) return

    const animation = new Konva.Animation((frame) => {
      const time = frame?.time ?? 0
      if (time > PULSE_DURATION_MS) {
        ring.opacity(1)
        animation.stop()
        return
      }
      ring.opacity(0.55 + 0.45 * Math.abs(Math.cos((time / 1000) * Math.PI)))
    }, layer)
    animation.start()
    return () => {
      animation.stop()
    }
  }, [])

  return (
    <Rect
      ref={ringRef}
      width={width}
      height={height}
      stroke={SELECTION_COLOR}
      strokeWidth={3}
      strokeScaleEnabled={false}
      shadowColor="#5d63f3"
      shadowBlur={1.2}
      shadowOpacity={0.9}
      listening={false}
    />
  )
}
