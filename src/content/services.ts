export type EmblemKind = 'web' | 'commerce' | 'platform' | 'automation' | 'custom' | 'optimize'

export interface Service {
  id: string
  emblem: EmblemKind
  /** Nombre corto, protagonista tipográfico. */
  name: string
  /** Nombre completo del servicio. */
  title: string
  description: string
  /** Qué obtiene el cliente. */
  benefit: string
  /** Qué representa el objeto 3D (leyenda técnica bajo la escena). */
  figure: string
}

export const services: Service[] = [
  {
    id: 'sitios-web',
    emblem: 'web',
    name: 'Sitios web',
    title: 'Diseño y desarrollo de páginas web',
    description:
      'Sitios corporativos, landing pages y sitios de contenido diseñados desde cero y desarrollados con código propio.',
    benefit:
      'Una presencia digital que explica con claridad quién eres y convierte visitas en contactos.',
    figure: 'Una interfaz en capas: estructura, contenido y detalle.',
  },
  {
    id: 'tiendas-en-linea',
    emblem: 'commerce',
    name: 'Tiendas en línea',
    title: 'Tiendas virtuales y comercio electrónico',
    description:
      'Catálogo, carrito, pagos y gestión de pedidos integrados en una experiencia de compra fluida.',
    benefit:
      'Vender en línea con un proceso de compra sencillo para tus clientes y fácil de administrar para ti.',
    figure: 'El producto y su valor, siempre en órbita.',
  },
  {
    id: 'plataformas',
    emblem: 'platform',
    name: 'Plataformas',
    title: 'Aplicaciones y plataformas web',
    description:
      'Paneles, portales de clientes, sistemas internos y productos web con lógica de negocio a medida.',
    benefit:
      'Una herramienta que se adapta a tu operación, en lugar de adaptar tu operación a la herramienta.',
    figure: 'Interfaz, lógica y datos: tres capas, un sistema.',
  },
  {
    id: 'automatizacion',
    emblem: 'automation',
    name: 'Automatización',
    title: 'Automatización de procesos empresariales',
    description:
      'Conectamos tus herramientas y automatizamos tareas repetitivas: formularios, reportes, notificaciones y flujos de datos.',
    benefit: 'Menos trabajo manual y menos errores; más tiempo para lo que sí requiere criterio.',
    figure: 'Engranajes que trabajan solos, sincronizados.',
  },
  {
    id: 'soluciones-a-medida',
    emblem: 'custom',
    name: 'Soluciones a medida',
    title: 'Soluciones digitales personalizadas',
    description:
      'Cuando ninguna herramienta existente encaja, diseñamos y construimos la que tu negocio necesita.',
    benefit: 'Tecnología que encaja con exactitud en tu forma de trabajar.',
    figure: 'La pieza que faltaba, cortada a la medida.',
  },
  {
    id: 'optimizacion',
    emblem: 'optimize',
    name: 'Optimización',
    title: 'Optimización de experiencias digitales',
    description:
      'Auditamos y mejoramos sitios y plataformas existentes: velocidad, usabilidad, accesibilidad y conversión.',
    benefit: 'Lo que ya tienes, funcionando mejor: más rápido, más claro y más fácil de usar.',
    figure: 'Un indicador que sube: medir, ajustar, mejorar.',
  },
]
