import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

function resetWindowScroll() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    resetWindowScroll()

    const animationFrame = window.requestAnimationFrame(resetWindowScroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.history.scrollRestoration = previousRestoration
    }
  }, [pathname, search])

  return null
}
