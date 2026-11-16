export interface ProjectImage {
  /** Ruta de la captura (colócala en /public/proyectos/ o impórtala como asset). */
  src: string
  /** Texto alternativo descriptivo. */
  alt: string
  width: number
  height: number
  /** Opcional: variantes responsivas, p. ej. "/proyectos/x-800.webp 800w, /proyectos/x-1600.webp 1600w". */
  srcSet?: string
}

export interface Project {
  id: string
  name: string
  /** Categoría visible, p. ej. "Tienda en línea". */
  category: string
  description: string
  image: ProjectImage
  /** Tecnologías utilizadas (opcional). */
  stack?: string[]
  /** Enlace público al proyecto (opcional). */
  url?: string
  year?: string
}

/**
 * PORTAFOLIO
 * ----------
 * Proyectos reales del estudio. Si la lista queda vacía, la sección muestra
 * un estado "en preparación" (no se inventan proyectos).
 *
 * Ejemplo de entrada:
 *
 * {
 *   id: 'nombre-del-proyecto',
 *   name: 'Nombre del proyecto',
 *   category: 'Tienda en línea',
 *   description: 'Qué se hizo y para quién, en una o dos frases.',
 *   image: { src: '/proyectos/nombre.webp', alt: 'Página de inicio de …', width: 1600, height: 1000 },
 *   stack: ['React', 'Node.js'],
 *   url: 'https://…',
 *   year: '2026',
 * },
 */
export const projects: Project[] = [
  {
    id: 'quiere-cacao',
    name: 'Quiere Cacao',
    category: 'Tienda en línea',
    description:
      'Sitio y tienda en línea para una marca de cacao orgánico con especias de Cali: presentación del producto, compra en línea y contacto directo por WhatsApp.',
    image: {
      src: '/proyectos/quiere-cacao.webp',
      srcSet: '/proyectos/quiere-cacao-960.webp 960w, /proyectos/quiere-cacao.webp 1901w',
      alt: 'Página de inicio de Quiere Cacao: el titular «Cacao puro, alma de especias» junto a una bolsa dorada de cacao orgánico rodeada de granos de cacao.',
      width: 1901,
      height: 863,
    },
  },
]
