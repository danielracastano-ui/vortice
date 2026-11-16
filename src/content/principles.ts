export interface Principle {
  title: string
  description: string
}

/**
 * Diferenciadores expresados como principios de trabajo, no como cifras ni
 * superlativos: describen cómo se hace el trabajo, no resultados prometidos.
 */
export const principles: Principle[] = [
  {
    title: 'A medida, no de plantilla',
    description:
      'Cada proyecto parte de tus objetivos. Diseñamos y programamos la solución que necesitas, no la que ya estaba hecha.',
  },
  {
    title: 'Diseño y código, un solo equipo',
    description:
      'Quien diseña y quien desarrolla trabajan juntos de principio a fin. Sin traducciones ni piezas que no encajan.',
  },
  {
    title: 'El rendimiento es parte del diseño',
    description:
      'Velocidad, accesibilidad y buen funcionamiento en cualquier dispositivo se planifican desde el inicio.',
  },
  {
    title: 'Un proceso visible',
    description:
      'Sabes en qué etapa está tu proyecto, qué sigue y qué necesitamos de ti en cada momento.',
  },
  {
    title: 'Construido para evolucionar',
    description:
      'Código ordenado y mantenible, para que tu proyecto pueda crecer cuando tu negocio lo haga.',
  },
  {
    title: 'Tecnología con propósito',
    description:
      'Recomendamos lo que resuelve tu problema, no lo que está de moda.',
  },
]
