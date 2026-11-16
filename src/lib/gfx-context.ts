import { createContext, useContext } from 'react'
import type { GfxTier } from './device'

/** Nivel gráfico activo. Con 'off' los componentes muestran sus alternativas sin WebGL. */
export const GfxContext = createContext<GfxTier>('high')
export const useGfx = () => useContext(GfxContext)

export type Phase = 'loading' | 'intro' | 'ready'
