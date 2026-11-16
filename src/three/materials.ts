import { Color, MeshPhysicalMaterial, ShaderChunk } from 'three'
import type { GfxTier } from '../lib/device'

export type MatKey = 'obsidian' | 'titanium' | 'bone' | 'core' | 'spark' | 'glass'
export type MaterialSet = Record<MatKey, MeshPhysicalMaterial>

/**
 * Uniforms del "barrido de verificación" (etapa 4 del proceso).
 * Por encima de uScanY la pieza se ve como arcilla sin terminar; por debajo,
 * con su material final. Una banda incandescente marca el frente del barrido.
 */
export const scanUniforms = {
  uScanY: { value: 1e5 },
  uScanBand: { value: 0 },
  uClayColor: { value: new Color('#878ba6') },
}

function withScan(material: MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, scanUniforms)

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vScanWorld;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvScanWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uScanY;
        uniform float uScanBand;
        uniform vec3 uClayColor;
        varying vec3 vScanWorld;
        float clayF = 0.0;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        clayF = smoothstep(uScanY - 0.015, uScanY + 0.015, vScanWorld.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uClayColor, clayF);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.92, clayF);',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.0, clayF);',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance *= (1.0 - clayF);
        totalEmissiveRadiance += vec3(0.62, 1.0, 0.04) * uScanBand * 3.0
          * smoothstep(0.07, 0.0, abs(vScanWorld.y - uScanY));`,
      )
      .replace(
        '#include <transmission_fragment>',
        ShaderChunk.transmission_fragment.replace(
          'material.transmission = transmission;',
          'material.transmission = transmission * (1.0 - clayF);',
        ),
      )
  }
  material.customProgramCacheKey = () => 'scan'
}

function applyGlassQuality(glass: MeshPhysicalMaterial, tier: GfxTier) {
  if (tier === 'high') {
    glass.transmission = 1
    glass.thickness = 0.9
    glass.transparent = false
    glass.opacity = 1
    glass.metalness = 0
  } else {
    // Sin pase de refracción: cristal ahumado translúcido, mucho más barato.
    glass.transmission = 0
    glass.thickness = 0
    glass.transparent = true
    glass.opacity = 0.42
    glass.metalness = 0.25
  }
  glass.needsUpdate = true
}

const sets: MaterialSet[] = []

/**
 * Crea la paleta de materiales del universo visual, derivada del logotipo:
 * obsidiana (metal azul noche pulido), titanio lavanda, cerámica blanca,
 * núcleo (violeta emisivo), chispa (lima emisivo, el punto del logo) y cristal.
 */
export function createMaterials(tier: GfxTier, options: { scan?: boolean } = {}): MaterialSet {
  const set: MaterialSet = {
    obsidian: new MeshPhysicalMaterial({
      color: '#171c38',
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 1.25,
    }),
    titanium: new MeshPhysicalMaterial({
      color: '#8e93b8',
      metalness: 1,
      roughness: 0.34,
      envMapIntensity: 1.1,
    }),
    bone: new MeshPhysicalMaterial({
      color: '#e2e3f0',
      metalness: 0,
      roughness: 0.42,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.55,
    }),
    core: new MeshPhysicalMaterial({
      color: '#2b16b8',
      emissive: '#5a3dff',
      emissiveIntensity: 1,
      metalness: 0,
      roughness: 0.5,
      envMapIntensity: 0.25,
    }),
    spark: new MeshPhysicalMaterial({
      color: '#6f8a00',
      emissive: '#ccff0e',
      emissiveIntensity: 0.85,
      metalness: 0,
      roughness: 0.5,
      envMapIntensity: 0.2,
    }),
    glass: new MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.06,
      ior: 1.48,
      dispersion: 2.5,
      attenuationColor: new Color('#d6d2ff'),
      attenuationDistance: 3.2,
      envMapIntensity: 1.3,
      specularIntensity: 1,
    }),
  }
  applyGlassQuality(set.glass, tier)
  if (options.scan) Object.values(set).forEach(withScan)
  sets.push(set)
  return set
}

/** Degrada el cristal en caliente si el equipo no mantiene el framerate. */
export function downgradeGlass() {
  sets.forEach((set) => applyGlassQuality(set.glass, 'low'))
}

export function disposeMaterials(set: MaterialSet) {
  Object.values(set).forEach((m) => m.dispose())
  const i = sets.indexOf(set)
  if (i >= 0) sets.splice(i, 1)
}
