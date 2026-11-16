import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../lib/scroll'

/** Devuelve el id de la sección que cruza el centro del viewport. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const triggers = ids.flatMap((id) => {
      const el = document.getElementById(id)
      if (!el) return []
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) setActive(id)
        },
      })
    })
    return () => triggers.forEach((t) => t.kill())
  }, [ids])

  return active
}
