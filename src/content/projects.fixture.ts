import type { Project } from './projects'

/**
 * Proyectos DE MUESTRA — solo para revisar el diseño del portafolio en desarrollo
 * (`npm run dev` + `?demo` en la URL). No se incluyen en el build de producción.
 */
const shot = (hue: number, label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
      <rect width="1600" height="1000" fill="hsl(${hue} 12% 12%)"/>
      <rect x="80" y="80" width="520" height="34" fill="hsl(${hue} 14% 30%)"/>
      <rect x="80" y="220" width="900" height="120" fill="hsl(${hue} 10% 82%)"/>
      <rect x="80" y="370" width="640" height="120" fill="hsl(${hue} 10% 82%)"/>
      <rect x="80" y="560" width="260" height="70" fill="#5b4dfd"/>
      <rect x="1080" y="220" width="440" height="560" fill="hsl(${hue} 14% 22%)"/>
      <text x="80" y="900" font-family="monospace" font-size="34" fill="hsl(${hue} 10% 55%)">${label}</text>
    </svg>`,
  )}`

export const fixtureProjects: Project[] = [
  {
    id: 'muestra-1',
    name: 'Proyecto de muestra A',
    category: 'Sitio web',
    description: 'Entrada ficticia para revisar composición, perspectiva y tipografía de la tarjeta.',
    image: { src: shot(24, 'CAPTURA DE MUESTRA'), alt: 'Captura de muestra', width: 1600, height: 1000 },
    stack: ['React', 'TypeScript', 'Three.js'],
    url: 'https://example.com',
    year: '0000',
  },
  {
    id: 'muestra-2',
    name: 'Proyecto de muestra B',
    category: 'Tienda en línea',
    description: 'Segunda entrada ficticia, con la composición invertida.',
    image: { src: shot(210, 'CAPTURA DE MUESTRA'), alt: 'Captura de muestra', width: 1600, height: 1000 },
    stack: ['Node.js', 'PostgreSQL'],
  },
]
