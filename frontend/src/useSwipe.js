import { useEffect, useRef } from 'react'

const MIN_DISTANCE = 60
const HORIZONTAL_RATIO = 1.5
const MAX_DURATION = 800

export function useHorizontalSwipe({ onSwipeLeft, onSwipeRight } = {}) {
  const handlers = useRef({ onSwipeLeft, onSwipeRight })
  handlers.current = { onSwipeLeft, onSwipeRight }

  useEffect(() => {
    let start = null

    const onStart = (event) => {
      if (event.touches.length !== 1 || event.target?.closest?.('[data-swipe-ignore]')) {
        start = null
        return
      }
      const touch = event.touches[0]
      start = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    }

    const onEnd = (event) => {
      const origin = start
      start = null
      if (!origin || event.changedTouches.length !== 1) {
        return
      }
      if (Date.now() - origin.time > MAX_DURATION) {
        return
      }
      const touch = event.changedTouches[0]
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) {
        return
      }
      const handler = dx < 0 ? handlers.current.onSwipeLeft : handlers.current.onSwipeRight
      handler?.()
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])
}
