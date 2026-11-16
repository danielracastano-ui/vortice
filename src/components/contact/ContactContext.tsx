import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface ContactContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const ContactContext = createContext<ContactContextValue | null>(null)

/** Estado global del panel de contacto: cualquier CTA del sitio puede abrirlo. */
export function ContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])
  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>
}

export function useContact(): ContactContextValue {
  const context = useContext(ContactContext)
  if (!context) throw new Error('useContact debe usarse dentro de <ContactProvider>')
  return context
}
