import Konva from 'konva'
import { useEffect, type RefObject } from 'react'
import type { Viewport } from '../lib/geometry'
import { useEditorStore } from '../store/editor-store'

const ANIMATION_SECONDS = 0.32

/**
 * The stage transform is driven imperatively from the store so programmatic
 * moves (fit, focus, zoom buttons) can be animated with a tween.
 */
export function useViewportSync(stageRef: RefObject<Konva.Stage | null>, ready: boolean) {
  useEffect(() => {
    const stage = stageRef.current
    if (!ready || !stage) return

    let tween: Konva.Tween | null = null

    const apply = ({ x, y, scale }: Viewport, animated: boolean) => {
      tween?.destroy()
      tween = null
      if (animated) {
        tween = new Konva.Tween({
          node: stage,
          duration: ANIMATION_SECONDS,
          easing: Konva.Easings.EaseInOut,
          x,
          y,
          scaleX: scale,
          scaleY: scale,
        })
        tween.play()
      } else {
        stage.setAttrs({ x, y, scaleX: scale, scaleY: scale })
        stage.batchDraw()
      }
    }

    apply(useEditorStore.getState().viewport, false)
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.viewport !== previous.viewport) apply(state.viewport, state.viewportAnimated)
    })

    return () => {
      unsubscribe()
      tween?.destroy()
    }
  }, [ready, stageRef])
}
