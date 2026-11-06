// terrain.js — terreno com relevo, corredor plano ao redor da pista e material com mistura de camadas
// (grama, terra, cascalho, rocha), tudo calculado em tempo de execução.
import * as THREE from 'three';
import { Noise, smooth, lerp, clamp } from './noise.js';
import { HALF } from './trackBuilder.js';
import { FX } from './fxShared.js';

export const CORE = HALF + 6;     // largura (de cada lado do eixo) totalmente plana
export const BLEND = 26;          // até onde o terreno volta ao relevo natural

export class Terrain {
  constructor(track, { cell = 5, margin = 640, seed = 7, theme = null } = {}) {
    this.track = track; this.cell = cell; this.theme = theme;
    // relevo do tema do mapa (themes.js): todos os valores padrão = relevo original do Vale Verde
    this.R = Object.assign({ hill: 1, hillSmall: 1, mount: 1, mountStart: 230, mountEnd: 680, terrace: 0, dune: 0, coast: null }, theme && theme.relief);
    const n = this.noise = new Noise(seed), S = track.S;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const p of S) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
    this.x0 = Math.floor((minX - margin) / cell) * cell; this.z0 = Math.floor((minZ - margin) / cell) * cell;
    this.nx = Math.ceil((maxX + margin - this.x0) / cell); this.nz = Math.ceil((maxZ + margin - this.z0) / cell);
    this.w = this.nx * cell; this.h = this.nz * cell;
    // campo de distância grosso (rápido) para pontos longe da pista
    const cs = 24; this.cs = cs; this.cnx = Math.ceil(this.w / cs) + 2; this.cnz = Math.ceil(this.h / cs) + 2;
    this.coarse = new Float32Array(this.cnx * this.cnz); this.coarseY = new Float32Array(this.cnx * this.cnz);
    for (let j = 0; j < this.cnz; j++) for (let i = 0; i < this.cnx; i++) {
      const q = track.nearest(this.x0 + i * cs, this.z0 + j * cs, 2000); this.coarse[j * this.cnx + i] = q.d; this.coarseY[j * this.cnx + i] = S[q.i].y;
    }
    this._build();
  }
  _coarse(arr, x, z) {
    const fx = (x - this.x0) / this.cs, fz = (z - this.z0) / this.cs, i = clamp(Math.floor(fx), 0, this.cnx - 2), j = clamp(Math.floor(fz), 0, this.cnz - 2), tx = fx - i, tz = fz - j, W = this.cnx;
    return (arr[j * W + i] * (1 - tx) + arr[j * W + i + 1] * tx) * (1 - tz) + (arr[(j + 1) * W + i] * (1 - tx) + arr[(j + 1) * W + i + 1] * tx) * tz;
  }
  /** altura natural + corredor da pista. Retorna [altura, distância até a pista] */
  sample(x, z) {
    const tr = this.track; let d = this._coarse(this.coarse, x, z), ry;
    if (d < 70) { const q = tr.nearest(x, z, 200); d = q.d; ry = tr.S[q.i].y; } else ry = this._coarse(this.coarseY, x, z);
    const n = this.noise;
    const far = smooth(5, 90, d);
    const R = this.R;
    let hills = (14 * R.hill * n.fbm(x / 260, z / 260, 4) + 1.4 * R.hillSmall * n.fbm(x / 38, z / 38, 3)) * lerp(0.35, 1, far);
    if (R.dune) { const dn = 1 - Math.abs(n.fbm(x / 110 + 3, z / 70 - 7, 3)); hills += R.dune * dn * dn * far; }   // dunas
    const ridge = 1 - Math.abs(n.fbm(x / 520 + 9, z / 520 - 4, 4));
    let mount = smooth(R.mountStart, R.mountEnd, d) * (55 + 95 * ridge * ridge) * R.mount;
    if (R.terrace) { const q = mount / R.terrace, f = Math.floor(q); mount = (f + smooth(0.55, 0.9, q - f)) * R.terrace; }   // mesas: degraus de rocha
    let target = hills + mount + ry * (1 - smooth(30, 320, d));
    if (R.coast) target -= R.coast.depth * smooth(R.coast.x0, R.coast.x1, x);                                          // mar: o terreno afunda para um lado
    const y = lerp(ry, target, smooth(CORE, BLEND, d));
    return [y, d];
  }
  _build() {
    const { nx, nz, cell } = this, vx = nx + 1, vz = nz + 1;
    this.H = new Float32Array(vx * vz); this.D = new Float32Array(vx * vz);
    const pos = new Float32Array(vx * vz * 3), dist = new Float32Array(vx * vz);
    for (let j = 0; j < vz; j++) for (let i = 0; i < vx; i++) {
      const x = this.x0 + i * cell, z = this.z0 + j * cell, [y, d] = this.sample(x, z), k = j * vx + i;
      this.H[k] = y; this.D[k] = d; pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; dist[k] = d;
    }
    const idx = new Uint32Array(nx * nz * 6); let q = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * vx + i, b = a + 1, c = a + vx, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
    }
    const g = this.geometry = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRoad', new THREE.BufferAttribute(dist, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    this.vx = vx;
    this._tiles(g, vx);
  }
  /**
   * Divide o terreno em ladrilhos (~400 m): mesmos vértices, mesmos triângulos, mesma ordem — só que cada ladrilho tem o seu próprio
   * índice e esfera de visibilidade. Antes era UMA malha com ~300 mil triângulos que ia inteira para a placa de vídeo a cada quadro
   * (e a cada captura do reflexo), mesmo com 2/3 do terreno atrás da câmera. Agora só os ladrilhos à frente são desenhados.
   */
  _tiles(g, vx) {
    const { nx, nz, cell } = this, tc = Math.max(8, Math.round(400 / cell)), idxAll = g.index.array, pos = g.attributes.position.array;
    this.tiles = [];
    for (let tj = 0; tj < nz; tj += tc) for (let ti = 0; ti < nx; ti += tc) {
      const i1 = Math.min(nx, ti + tc), j1 = Math.min(nz, tj + tc), idx = new Uint32Array((i1 - ti) * (j1 - tj) * 6); let q = 0;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let j = tj; j <= j1; j++) for (let i = ti; i <= i1; i++) {
        const k = (j * vx + i) * 3, x = pos[k], y = pos[k + 1], z = pos[k + 2];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      for (let j = tj; j < j1; j++) for (let i = ti; i < i1; i++) {
        const a = j * vx + i, b = a + 1, c = a + vx, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
      const tg = new THREE.BufferGeometry();
      for (const name in g.attributes) tg.setAttribute(name, g.attributes[name]);   // atributos compartilhados (nada duplicado na memória)
      tg.setIndex(new THREE.BufferAttribute(idx, 1));
      const box = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
      tg.boundingBox = box; tg.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      this.tiles.push(tg);
    }
  }
  /** altura do terreno em (x,z) lendo a própria malha (interpolação nos triângulos) */
  heightAt(x, z) {
    const fx = (x - this.x0) / this.cell, fz = (z - this.z0) / this.cell;
    const i = clamp(Math.floor(fx), 0, this.nx - 1), j = clamp(Math.floor(fz), 0, this.nz - 1), tx = fx - i, tz = fz - j, W = this.vx, H = this.H;
    const a = H[j * W + i], b = H[j * W + i + 1], c = H[(j + 1) * W + i], d = H[(j + 1) * W + i + 1];
    return tx + tz <= 1 ? a + (b - a) * tx + (c - a) * tz : d + (b - d) * (1 - tz) + (c - d) * (1 - tx);
  }
  distAt(x, z) {
    const fx = (x - this.x0) / this.cell, fz = (z - this.z0) / this.cell, i = clamp(Math.floor(fx), 0, this.nx - 1), j = clamp(Math.floor(fz), 0, this.nz - 1), tx = fx - i, tz = fz - j, W = this.vx, D = this.D;
    return (D[j * W + i] * (1 - tx) + D[j * W + i + 1] * tx) * (1 - tz) + (D[(j + 1) * W + i] * (1 - tx) + D[(j + 1) * W + i + 1] * tx) * tz;
  }
  slopeAt(x, z) { const e = 2, hx = this.heightAt(x + e, z) - this.heightAt(x - e, z), hz = this.heightAt(x, z + e) - this.heightAt(x, z - e); return Math.hypot(hx, hz) / (2 * e); }

  mesh(textures) {
    const T = textures;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, envMapIntensity: 0.45 });
    const U = this.uniforms = {
      tGrass: { value: T.grass }, tDirt: { value: T.dirt }, tGravel: { value: T.gravel }, tRock: { value: T.rock }, tNoise: { value: T.noise },
      uWet: { value: 0 }, uHalf: { value: HALF }, uCloud: FX.cloud, uCT: FX.time,
    };
    // cores do tema (1 = textura original)
    const G = Object.assign({ grass: [1, 1, 1], dirt: [1, 1, 1], gravel: [1, 1, 1], rock: [1, 1, 1], sand: 0, sandCol: [0.86, 0.66, 0.42], snow: 0, pave: 0, paveCol: [0.3, 0.3, 0.32], dirtBias: 0 }, this.theme && this.theme.ground);
    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    Object.assign(U, { uTintG: { value: V3(G.grass) }, uTintD: { value: V3(G.dirt) }, uTintGr: { value: V3(G.gravel) }, uTintR: { value: V3(G.rock) }, uSand: { value: G.sand }, uSandCol: { value: V3(G.sandCol) },
      uSnow: { value: G.snow }, uSeaY: { value: (this.theme && this.theme.water) ? this.theme.water.y : -99999 }, uPave: { value: G.pave }, uPaveCol: { value: V3(G.paveCol) }, uDirtB: { value: G.dirtBias } });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aRoad; varying float vRoad; varying vec3 vWPos; varying vec3 vWN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRoad = aRoad; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform sampler2D tGrass; uniform sampler2D tDirt; uniform sampler2D tGravel; uniform sampler2D tRock; uniform sampler2D tNoise;
uniform vec3 uTintG, uTintD, uTintGr, uTintR, uSandCol, uPaveCol; uniform float uSand, uSnow, uPave, uDirtB, uSeaY;
uniform float uWet; uniform float uHalf; uniform float uCloud; uniform float uCT; varying float vRoad; varying vec3 vWPos; varying vec3 vWN;`)
        .replace('#include <map_fragment>', `
{
  vec2 p = vWPos.xz; vec2 gx = dFdx(p), gy = dFdy(p); vec3 wx = dFdx(vWPos), wy = dFdy(vWPos);
  float nLo = texture2D(tNoise, p * 0.0021).r, nMid = texture2D(tNoise, p * 0.011).r, nHi = texture2D(tNoise, p * 0.09).r;
  vec3 grass = texture2D(tGrass, p * 0.21).rgb * (0.75 + 0.7 * texture2D(tGrass, p * 0.018).rgb) * uTintG;
  vec3 grassDry = mix(grass, grass * vec3(1.25, 1.05, 0.62), smoothstep(0.45, 0.8, nLo));
  vec3 n = normalize(vWN);
  float slope = 1.0 - n.y;
  float rockW = smoothstep(0.16, 0.34, slope + (nHi - 0.5) * 0.12);
  float gravelW = 1.0 - smoothstep(uHalf + 0.6, uHalf + 7.0, vRoad + (nMid - 0.5) * 3.0);
  float dirtW = max(smoothstep(0.62, 0.8, nMid) * 0.85, (1.0 - smoothstep(uHalf + 5.0, uHalf + 15.0, vRoad + (nHi - 0.5) * 6.0)) * 0.55);
  dirtW = clamp(dirtW + uDirtB, 0.0, 1.0);
  vec3 col = grassDry;
  if (dirtW > 0.01) col = mix(col, textureGrad(tDirt, p * 0.17, gx * 0.17, gy * 0.17).rgb * (0.8 + 0.4 * nMid) * uTintD, clamp(dirtW, 0.0, 1.0));
  if (gravelW > 0.01) col = mix(col, textureGrad(tGravel, p * 0.3, gx * 0.3, gy * 0.3).rgb * uTintGr, gravelW);
  if (rockW > 0.01) {
    vec3 bl = pow(abs(n), vec3(6.0)); bl /= (bl.x + bl.y + bl.z);
    vec3 rock = textureGrad(tRock, vWPos.zy * 0.12, wx.zy * 0.12, wy.zy * 0.12).rgb * bl.x + textureGrad(tRock, vWPos.xz * 0.12, wx.xz * 0.12, wy.xz * 0.12).rgb * bl.y + textureGrad(tRock, vWPos.xy * 0.12, wx.xy * 0.12, wy.xy * 0.12).rgb * bl.z;
    col = mix(col, rock * uTintR, rockW);
  }
  if (uSand > 0.001) col = mix(col, uSandCol * (0.82 + 0.34 * nHi) * (0.9 + 0.2 * nMid), uSand * (1.0 - rockW * 0.8) * (1.0 - gravelW * 0.7));
  if (uSnow > 0.001) {
    float snowW = uSnow * (1.0 - rockW * 0.5) * smoothstep(uHalf + 2.5, uHalf + 10.0, vRoad) * smoothstep(0.45, 0.75, n.y + (nMid - 0.5) * 0.3);
    col = mix(col, vec3(0.9, 0.93, 1.0) * (0.92 + 0.12 * nHi), snowW);
    col = mix(col, vec3(0.78, 0.8, 0.84) * (0.9 + 0.2 * nHi), uSnow * gravelW * 0.5);
  }
  if (uPave > 0.001) col = mix(col, uPaveCol * (0.78 + 0.5 * nHi) * (0.9 + 0.2 * nMid), uPave);
  if (uSeaY > -1000.0) {   // beira do mar: areia molhada e espuma que vai e volta
    float hs = vWPos.y - uSeaY; col *= 1.0 - 0.34 * (1.0 - smoothstep(0.0, 1.5, hs));
    float wv = 0.5 + 0.5 * sin(uCT * 0.9 + vWPos.x * 0.07 + vWPos.z * 0.05);
    col = mix(col, vec3(0.97, 0.99, 1.0), (1.0 - smoothstep(0.0, 0.45 + wv * 0.4, abs(hs - 0.12 - wv * 0.3))) * 0.7);
  }
  col *= 1.0 - uWet * 0.38;
  // variação de cor em escala muito grande (quebra a repetição) + sombras de nuvens passando
  col *= 0.9 + 0.2 * texture2D(tNoise, p * 0.0007 + vec2(0.31, 0.77)).r;
  float csT = texture2D(tNoise, p * 0.0016 + vec2(uCT * 0.012, uCT * 0.005)).r;
  col *= 1.0 - uCloud * 0.32 * smoothstep(0.50, 0.64, csT);
  diffuseColor.rgb *= col;
}`);
    };
    mat.customProgramCacheKey = () => 'terrain-v3';
    const m = new THREE.Group(); m.name = 'terrain';
    for (const tg of this.tiles) { const t = new THREE.Mesh(tg, mat); t.receiveShadow = true; t.name = 'terrain-tile'; t.matrixAutoUpdate = false; m.add(t); }
    this.material = mat;
    return m;
  }
}
