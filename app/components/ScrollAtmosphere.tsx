'use client'

import { useEffect, useRef } from 'react'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

/**
 * Scroll-driven atmosphere for the home hero. The original logo image is never
 * redrawn: only its enclosing layer is moved, tilted and softly revealed.
 *
 * No continuous animation loop: one passive scroll listener + a single
 * requestAnimationFrame per frame, with no React re-renders while scrolling.
 */
export default function ScrollAtmosphere() {
  const atmosphereRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const atmosphere = atmosphereRef.current
    const hero = atmosphere?.parentElement
    if (!atmosphere || !hero) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const update = () => {
      frame = 0

      if (reducedMotion.matches) {
        atmosphere.style.removeProperty('--hero-drift-x')
        atmosphere.style.removeProperty('--hero-drift-y')
        atmosphere.style.removeProperty('--hero-turn')
        atmosphere.style.removeProperty('--hero-tilt')
        atmosphere.style.removeProperty('--hero-scale')
        atmosphere.style.removeProperty('--hero-presence')
        atmosphere.style.removeProperty('--hero-light-x')
        atmosphere.style.removeProperty('--hero-light-presence')
        atmosphere.style.removeProperty('--hero-ring-y')
        return
      }

      const rect = hero.getBoundingClientRect()
      // Animation is driven solely by the actual scroll position and
      // reverses identically when scrolling back up.
      const heroStart = rect.top + window.scrollY
      const progress = clamp01((window.scrollY - Math.max(0, heroStart - 180)) / Math.max(rect.height * 0.78, 440))
      const travel = progress * (2 - progress) // gently ease out
      const mobile = window.innerWidth < 768

      const x = (mobile ? -15 : -46) * travel
      const y = (mobile ? 32 : 85) * travel
      const turn = (mobile ? 5 : 12) * travel
      const tilt = (mobile ? 0 : -5) * travel
      const scale = 1 + (mobile ? 0.035 : 0.095) * travel
      // Keep the mark visible through the first part of the scroll;
      // let it dissolve naturally before the next section.
      const fade = 1 - 0.78 * Math.pow(progress, 1.6)

      atmosphere.style.setProperty('--hero-drift-x', `${x.toFixed(2)}px`)
      atmosphere.style.setProperty('--hero-drift-y', `${y.toFixed(2)}px`)
      atmosphere.style.setProperty('--hero-turn', `${turn.toFixed(2)}deg`)
      atmosphere.style.setProperty('--hero-tilt', `${tilt.toFixed(2)}deg`)
      atmosphere.style.setProperty('--hero-scale', scale.toFixed(4))
      atmosphere.style.setProperty('--hero-presence', fade.toFixed(4))
      atmosphere.style.setProperty('--hero-light-x', `${(mobile ? 75 : 230) * travel}px`)
      atmosphere.style.setProperty('--hero-light-presence', (1 - 0.38 * progress).toFixed(4))
      atmosphere.style.setProperty('--hero-ring-y', `${(mobile ? 14 : 35) * travel}px`)
    }

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    reducedMotion.addEventListener('change', schedule)
    schedule()

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      reducedMotion.removeEventListener('change', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="home-hero-atmosphere" ref={atmosphereRef} aria-hidden="true">
      <span className="atmosphere-form" />
      <span className="atmosphere-light" />
      <span className="atmosphere-line atmosphere-line--one" />
      <span className="atmosphere-line atmosphere-line--two" />
    </div>
  )
}
