export interface ProcessStep {
  id: string
  short: string
  title: string
  description: string
  /** Estado de la pieza 3D en esta etapa. */
  state: string
}

/**
 * Cada etapa corresponde a un estado material de la misma pieza 3D:
 * partículas → trazos → volumen → verificación → pieza terminada.
 */
export const processSteps: ProcessStep[] = [
  {
    id: 'descubrimiento',
    short: 'Descubrimiento',
    title: 'Descubrimiento y planificación',
    description:
      'Entendemos tu negocio, tus objetivos y a tus usuarios. Definimos alcance, prioridades y un plan de trabajo claro.',
    state: 'Partículas — la idea, aún dispersa, empieza a ordenarse.',
  },
  {
    id: 'diseno',
    short: 'Diseño',
    title: 'Diseño y conceptualización',
    description:
      'Convertimos el plan en estructura, interfaz e identidad visual. Lo validamos contigo antes de construir.',
    state: 'Trazos — la estructura se dibuja antes de existir.',
  },
  {
    id: 'desarrollo',
    short: 'Desarrollo',
    title: 'Desarrollo e implementación',
    description:
      'Construimos pieza por pieza, con avances que puedes revisar mientras el proyecto toma forma.',
    state: 'Volumen — cada módulo ocupa su lugar.',
  },
  {
    id: 'pruebas',
    short: 'Pruebas',
    title: 'Pruebas y optimización',
    description:
      'Probamos en dispositivos y navegadores reales. Ajustamos rendimiento, accesibilidad y detalles hasta que todo responde como debe.',
    state: 'Verificación — un barrido revisa y pule cada superficie.',
  },
  {
    id: 'lanzamiento',
    short: 'Lanzamiento',
    title: 'Lanzamiento y entrega',
    description:
      'Publicamos, te entregamos el proyecto y te acompañamos en su puesta en marcha.',
    state: 'Encendido — la pieza terminada, en funcionamiento.',
  },
]
