import { useEffect, type RefObject } from 'react'

/** Reports the content size of an element on mount and whenever it changes. */
export function useElementSize(ref: RefObject<HTMLElement | null>, onResize: (size: { width: number; height: number }) => void) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    // ResizeObserver only reports during rendering frames; measure right away as well.
    const { width, height } = element.getBoundingClientRect()
    onResize({ width: Math.floor(width), height: Math.floor(height) })

    const observer = new ResizeObserver(([entry]) => {
      onResize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, onResize])
}
