// paint.js — pintura do carro: cores, acabamentos (verniz, metálico, perolado...) e recoloração de texturas.
//
// Dois modos de pintura:
//  - 'solid': o GLB tem um material só da pintura (ex.: "Orange"). A cor é trocada direto no material.
//  - 'maskmr': igual ao 'mask', mas preserva os mapas de metal/rugosidade do GLB fora da área pintada.
//  - 'mask' : a cor está "assada" numa textura (ex.: Aventador amarelo). Um shader encontra os pixels
//             parecidos com a cor original (ref) e troca por uma cor nova, mantendo luz e sombra da textura.
import * as THREE from 'three';

export const FINISHES = {
  gloss:    { label: 'Brilhante', metal: 0.00, rough: 0.34, cc: 1.00, ccRough: 0.04, flake: 0.00, irid: 0.0, env: 1.0 },
  metallic: { label: 'Metálico',  metal: 0.80, rough: 0.30, cc: 1.00, ccRough: 0.03, flake: 0.20, irid: 0.0, env: 1.25 },
  pearl:    { label: 'Perolado',  metal: 0.38, rough: 0.26, cc: 1.00, ccRough: 0.02, flake: 0.10, irid: 0.9, env: 1.2 },
  satin:    { label: 'Cetim',     metal: 0.28, rough: 0.50, cc: 0.35, ccRough: 0.35, flake: 0.04, irid: 0.0, env: 1.0 },
  matte:    { label: 'Fosco',     metal: 0.05, rough: 0.80, cc: 0.00, ccRough: 0.50, flake: 0.00, irid: 0.0, env: 0.7 },
};

export const COLORS = [
  { name: 'Vermelho rubi',   hex: '#b3121b' },
  { name: 'Laranja fogo',    hex: '#e8590c' },
  { name: 'Amarelo sol',     hex: '#f2b705' },
  { name: 'Verde floresta',  hex: '#1f6b3a' },
  { name: 'Verde limão',     hex: '#7bc618' },
  { name: 'Azul elétrico',   hex: '#1456f0' },
  { name: 'Azul noite',      hex: '#14213d' },
  { name: 'Ciano glacial',   hex: '#2ec4d6' },
  { name: 'Roxo ametista',   hex: '#6a2c9c' },
  { name: 'Rosa choque',     hex: '#e5397a' },
  { name: 'Branco pérola',   hex: '#f3f1ec' },
  { name: 'Prata',           hex: '#b8bcc2' },
  { name: 'Grafite',         hex: '#3a3f46' },
  { name: 'Preto',           hex: '#0a0a0b' },
  { name: 'Bronze',          hex: '#8a5a2b' },
  { name: 'Vinho',           hex: '#5a0f1f' },
];

const GLSL_DECL = /* glsl */`
uniform vec3  uRef;
uniform vec3  uPaint;
uniform float uUseMask;
uniform float uMetal;
uniform float uRough;
uniform float uFlake;
uniform float uFlakeScale;
uniform float uGlow;
`;

const GLSL_MASK = /* glsl */`
float pMask = 1.0;
if (uUseMask > 0.5) {
  vec3 tx = diffuseColor.rgb;
  float mxc = max(tx.r, max(tx.g, tx.b));
  float mnc = min(tx.r, min(tx.g, tx.b));
  vec3 c1 = tx   - vec3((tx.r + tx.g + tx.b) / 3.0);
  vec3 c2 = uRef - vec3((uRef.r + uRef.g + uRef.b) / 3.0);
  float sim = dot(c1, c2) / max(length(c1) * length(c2), 1e-5);
  float chroma = (mxc - mnc) / max(mxc, 1e-4);
  pMask = smoothstep(0.80, 0.95, sim) * smoothstep(0.30, 0.55, chroma);
  float refV = max(uRef.r, max(uRef.g, uRef.b));
  vec3 painted = uPaint * clamp(mxc / refV, 0.0, 1.4);
  diffuseColor.rgb = mix(tx, painted, pMask);
}
`;

const GLSL_MR = /* glsl */`
if (uUseMask > 1.5) {            // 'maskmr': mantém o mapa de metal/rugosidade do modelo fora da tinta
  roughnessFactor = mix(roughnessFactor, uRough, pMask);
  metalnessFactor = mix(metalnessFactor, uMetal, pMask);
} else if (uUseMask > 0.5) {
  roughnessFactor = mix(0.55, uRough, pMask);
  metalnessFactor = mix(0.15, uMetal, pMask);
}
`;

const GLSL_FLAKE = /* glsl */`
if (uFlake > 0.001) {
  vec3 cell = floor(vViewPosition * uFlakeScale);
  vec3 h = fract(sin(vec3(dot(cell, vec3(12.9898, 78.233, 37.719)),
                          dot(cell, vec3(39.346, 11.135, 83.155)),
                          dot(cell, vec3(73.156, 52.235, 9.151)))) * 43758.5453) - 0.5;
  normal = normalize(normal + h * uFlake * pMask);
}
`;

const GLSL_CC = /* glsl */`
#ifdef USE_CLEARCOAT
  material.clearcoat *= pMask;
#endif
`;

function patch(mat, U) {
  mat.onBeforeCompile = (sh) => {
    for (const k in U) sh.uniforms[k] = U[k];
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_DECL)
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + GLSL_MASK)
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + GLSL_MR)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  if (uUseMask > 0.5) totalEmissiveRadiance += diffuseColor.rgb * uGlow * pMask;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_FLAKE)
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n' + GLSL_CC);
  };
  mat.customProgramCacheKey = () => 'carpaint-v1';
  mat.needsUpdate = true;
}

export class Paint {
  /**
   * @param {Array<{mat:THREE.MeshPhysicalMaterial, mode:'solid'|'mask', k?:number}>} entries
   * @param {string} refHex cor original da textura (só no modo 'mask')
   */
  constructor(entries, refHex = '#ffffff') {
    this.entries = entries;
    this.shared = {
      uRef: { value: new THREE.Color(refHex) },
      uPaint: { value: new THREE.Color('#ffffff') },
      uMetal: { value: 0.5 },
      uRough: { value: 0.3 },
      uFlake: { value: 0 },
      uFlakeScale: { value: 140 },
      uGlow: { value: 0 },
    };
    this.hex = '#ffffff';
    this.finish = 'gloss'; this.glow = 0; this.envK = 1;
    for (const e of entries) {
      e.U = { ...this.shared, uUseMask: { value: e.mode === 'maskmr' ? 2 : e.mode === 'mask' ? 1 : 0 } };
      if (e.mode === 'mask') { e.mat.metalnessMap = null; e.mat.roughnessMap = null; e.mat.metalness = 1; e.mat.roughness = 1; }
      patch(e.mat, e.U);
    }
  }

  /** peça extra (aerofólio, saia...) que segue a cor e o acabamento da carroceria */
  add(mat, k = 1) {
    const e = { mat, mode: 'solid', k }; e.U = { ...this.shared, uUseMask: { value: 0 } }; patch(mat, e.U); this.entries.push(e);
    this.setColor(this.hex); this.setFinish(this.finish);
  }

  /** cor mais viva em cenas muito iluminadas (corrida): luz própria da cor + menos reflexo do céu */
  setVivid(glow, envK) { this.glow = glow; this.envK = envK; this.shared.uGlow.value = glow; this.setColor(this.hex); this.setFinish(this.finish); }

  setColor(hex) {
    this.hex = hex;
    const vc = new THREE.Color(hex);
    if (this.glow > 0) { const h = {}; vc.getHSL(h); vc.setHSL(h.h, Math.min(1, h.s * 1.3), h.l); }   // corrida: cor mais saturada
    this.shared.uPaint.value.copy(vc);
    for (const e of this.entries) {
      if (e.mode === 'solid') { e.mat.color.copy(vc); if (e.k && e.k !== 1) e.mat.color.multiplyScalar(e.k); e.mat.emissive.copy(e.mat.color).multiplyScalar(this.glow); }
    }
  }

  setFinish(key) {
    const f = FINISHES[key] || FINISHES.gloss;
    this.finish = key;
    const vv = this.glow > 0;                           // corrida: sem glitter, sem efeito perolado, pouco metal (metal cinzento a cor)
    const fm = vv ? Math.min(f.metal, 0.2) : f.metal, ff = vv ? 0 : f.flake, fi = vv ? 0 : f.irid;
    this.shared.uMetal.value = fm;
    this.shared.uRough.value = f.rough;
    this.shared.uFlake.value = ff;
    for (const e of this.entries) {
      const m = e.mat;
      if (e.mode === 'solid') { m.metalness = fm; m.roughness = f.rough; }
      m.clearcoat = f.cc;
      m.clearcoatRoughness = f.ccRough;
      m.iridescence = fi;
      m.iridescenceIOR = 1.5;
      m.iridescenceThicknessRange = [180, 520];
      m.envMapIntensity = f.env * this.envK;
    }
  }
}
