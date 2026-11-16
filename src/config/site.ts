/**
 * Configuración central de la marca.
 *
 * Todo lo que identifica al negocio vive aquí (y en `.env`). Los campos vacíos
 * NO se muestran en el sitio: no se inventan datos de contacto ni enlaces.
 */

export interface SocialLink {
  label: string
  href: string
}

export interface NavItem {
  id: string
  label: string
}

export interface ContactInfo {
  /** Correo público de contacto. Ej.: 'hola@tudominio.com' */
  email: string
  /** Teléfono en formato legible. Ej.: '+00 000 000 0000' */
  phone: string
  /** Número de WhatsApp solo con dígitos y código de país. Ej.: '5215512345678' */
  whatsapp: string
  /** Ciudad / país o dirección. */
  location: string
  /**
   * Endpoint alternativo para el formulario (POST JSON). Vacío = Netlify Forms,
   * que es el modo de producción. Se define en `.env`.
   */
  formEndpoint: string
}

const env = import.meta.env

const contact: ContactInfo = {
  email: '',
  phone: '',
  whatsapp: '',
  location: '',
  formEndpoint: (env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() ?? '',
}

export const site = {
  /** Nombre comercial. Se define en `.env` → VITE_SITE_NAME. */
  name: (env.VITE_SITE_NAME as string | undefined)?.trim() || 'Vórtice',
  tagline: 'Diseño web, desarrollo y soluciones digitales',
  description: 'Estudio de diseño, desarrollo web y soluciones digitales a la medida.',
  url: (env.VITE_SITE_URL as string | undefined)?.trim() ?? '',

  contact,

  /** Redes sociales. Ej.: { label: 'Instagram', href: 'https://instagram.com/…' } */
  socials: [
    { label: 'Instagram · @vortice.web', href: 'https://www.instagram.com/vortice.web/' },
  ] as SocialLink[],

  legal: {
    /** Fecha de última actualización de los textos legales (AAAA-MM-DD). */
    updatedAt: '2026-11-16',
  },
}

/** Secciones de la página principal, en orden. Alimenta navegación e indicadores. */
export const sections: NavItem[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'estudio', label: 'Estudio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'trabajos', label: 'Trabajos' },
  { id: 'enfoque', label: 'Enfoque' },
  { id: 'contacto', label: 'Contacto' },
]

/** Enlaces del menú principal (sin "Inicio" ni "Contacto", que tienen CTA propio). */
export const mainNav = sections.filter((s) => s.id !== 'inicio' && s.id !== 'contacto')
