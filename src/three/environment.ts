import {
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  type Texture,
  type WebGLRenderer,
} from 'three'

/**
 * Entorno de reflejos procedural (sin descargar HDRIs).
 *
 * Un "estudio fotográfico" de paneles luminosos: una caja de luz blanca arriba,
 * tiras frías a un lado y un panel violeta al otro. Es lo que da a metales y
 * cristales sus brillos alargados.
 */
export function createEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene()
  scene.background = new Color('#03050d')

  const disposables: { dispose(): void }[] = []
  const panel = (
    color: string,
    intensity: number,
    size: [number, number],
    position: [number, number, number],
  ) => {
    const geometry = new PlaneGeometry(size[0], size[1])
    const material = new MeshBasicMaterial({
      color: new Color(color).multiplyScalar(intensity),
      side: DoubleSide,
      toneMapped: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.set(...position)
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
    disposables.push(geometry, material)
  }

  // Suelo y fondo tenues para que los metales no reflejen negro puro.
  const roomGeometry = new BoxGeometry(30, 30, 30)
  const roomMaterial = new MeshBasicMaterial({ color: '#141a36', side: DoubleSide })
  scene.add(new Mesh(roomGeometry, roomMaterial))
  disposables.push(roomGeometry, roomMaterial)

  panel('#f3f1ff', 4.5, [7, 7], [0, 9, 2]) // caja de luz principal
  panel('#dfeaff', 8, [1.2, 10], [9, 2, 3]) // tira fría derecha
  panel('#dfeaff', 5, [1, 8], [7, -3, -6])
  panel('#6a4dff', 7, [1.6, 9], [-9, 1, 2]) // panel violeta izquierdo
  panel('#ffffff', 4, [10, 1], [0, -2, 9]) // línea frontal baja
  panel('#b9a8ff', 3, [5, 5], [-4, -8, -4])
  // Relleno frontal amplio y tenue: las caras que miran a cámara no reflejan negro.
  panel('#e9eef7', 1.1, [16, 9], [0, 3, 12])
  panel('#ffffff', 2.2, [3, 6], [-5, 5, 9])
  panel('#e6e8ff', 1.8, [12, 5], [0, -7, 7]) // rebote inferior: define las caras bajas

  const pmrem = new PMREMGenerator(renderer)
  const target = pmrem.fromScene(scene, 0.035)
  pmrem.dispose()
  disposables.forEach((d) => d.dispose())
  return target.texture
}
