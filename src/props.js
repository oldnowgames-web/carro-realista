// props.js — objetos de cenário de cada mapa, todos criados em código (sem arquivos): palmeiras, cactos, arbustos, prédios com janelas
// acesas, postes de luz, casas, celeiros, cercas, postes de energia, fardos de feno e o mar.
// planProps() só decide ONDE cada coisa fica (sem 3D, dá para testar em Node); buildProps() cria os InstancedMesh.
// Quais objetos aparecem em cada mapa vem de THEMES[...].props (themes.js): { palm: 1, cactus: 1, ... } (o número é a quantidade relativa).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, smooth } from './noise.js';
import { HALF } from './trackBuilder.js';

// ---------------------------------------------------------------- geometrias
const tint = (geo, hex, jitter = 0, R = null) => {
  const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 1 + (R ? (R() - 0.5) * jitter : 0); a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
};
const flat = (g) => { const x = g.index ? g.toNonIndexed() : g; if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); return x; };
const merge = (parts) => mergeGeometries(parts.map(flat), false);

/** tronco curvo e fino (anéis ligados) */
function tube(pts, radii, sides, hex, R) {
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2; pos.push(pts[i].x + Math.cos(a) * radii[i], pts[i].y, pts[i].z + Math.sin(a) * radii[i]); }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) { const a = i * sides + k, b = i * sides + (k + 1) % sides, c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.position.count, col = new Float32Array(n * 3), c0 = new THREE.Color(hex);
  for (let i = 0; i < n; i++) { const ring = Math.floor(i / sides), k = ring % 2 ? 0.8 : 1.05; col[i * 3] = c0.r * k; col[i * 3 + 1] = c0.g * k; col[i * 3 + 2] = c0.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
/** quadrilátero solto (folhas) a partir de 4 pontos */
function quads(list) {
  const pos = [], col = [];
  for (const { p, c } of list) { const [a, b, d, e] = p; pos.push(...a, ...b, ...d, ...a, ...d, ...e); for (let i = 0; i < 6; i++) col.push(c.r, c.g, c.b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}

export function palmGeometry(seed = 1) {
  const R = rng(seed), H = 8.5 + R() * 3, bend = (R() - 0.5) * 3.4, seg = 9, pts = [], rad = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg; pts.push(new THREE.Vector3(bend * t * t, H * t, 0)); rad.push(0.34 - 0.17 * t + (i === 0 ? 0.06 : 0)); }
  const trunk = tube(pts, rad, 7, 0x8a6a45, R), top = pts[seg], leaves = [], N = 11;
  for (let f = 0; f < N; f++) {
    const a = (f / N) * Math.PI * 2 + R() * 0.4, ca = Math.cos(a), sa = Math.sin(a), L = 4.2 + R() * 1.3, lift = 1.2 + R() * 0.9, hue = 0.92 + R() * 0.2;
    const at = (s) => new THREE.Vector3(top.x + ca * s * L, top.y + lift * s * 1.6 - 2.5 * s * s * lift * 0.9, top.z + sa * s * L);
    const col = (s) => new THREE.Color().setRGB((0.16 + 0.1 * s) * hue, (0.36 + 0.14 * s) * hue, (0.1 + 0.04 * s) * hue);
    for (let j = 1; j <= 13; j++) {
      const s = j / 14, c = at(s), t = at(s + 0.04).sub(c).normalize(), side = new THREE.Vector3(-sa, 0, ca), ll = 1.5 * Math.sin(Math.PI * (0.12 + 0.88 * s)) + 0.25;
      for (const sg of [-1, 1]) {
        const dir = side.clone().multiplyScalar(sg).addScaledVector(t, 0.55).addScaledVector(new THREE.Vector3(0, -1, 0), 0.5).normalize();
        const tip = c.clone().addScaledVector(dir, ll), w = t.clone().multiplyScalar(0.2);
        leaves.push({ p: [c.clone().sub(w).toArray(), c.clone().add(w).toArray(), tip.clone().add(w.clone().multiplyScalar(0.3)).toArray(), tip.clone().sub(w.clone().multiplyScalar(0.3)).toArray()], c: col(s) });
      }
    }
  }
  return merge([trunk, quads(leaves)]);
}

export function cactusGeometry(seed = 1) {
  const R = rng(seed), H = 4.6 + R() * 2.6, r = 0.42 + R() * 0.15, green = 0x4c7a45, parts = [];
  const cyl = (rt, rb, h, x, y, z, rz = 0) => { const g = new THREE.CylinderGeometry(rt, rb, h, 9, 1); if (rz) g.rotateZ(rz); g.translate(x, y, z); return tint(g, green, 0.2, R); };
  parts.push(cyl(r, r * 1.08, H, 0, H / 2, 0));
  const cap = new THREE.SphereGeometry(r, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2); cap.translate(0, H, 0); parts.push(tint(cap, green, 0.2, R));
  const arms = 1 + ((R() * 2.4) | 0);
  for (let a = 0; a < arms; a++) {
    const sg = a % 2 ? -1 : 1, y0 = H * (0.38 + R() * 0.22), out = 0.9 + R() * 0.7, up = 1.4 + R() * 1.6, ar = r * 0.62;
    const h = new THREE.CylinderGeometry(ar, ar, out, 8, 1); h.rotateZ(Math.PI / 2); h.translate(sg * out / 2, y0, 0); parts.push(tint(h, green, 0.2, R));
    const v = new THREE.CylinderGeometry(ar * 0.92, ar, up, 8, 1); v.translate(sg * out, y0 + up / 2, 0); parts.push(tint(v, green, 0.2, R));
    const c2 = new THREE.SphereGeometry(ar * 0.92, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2); c2.translate(sg * out, y0 + up, 0); parts.push(tint(c2, green, 0.2, R));
  }
  return merge(parts);
}

export function shrubGeometry(seed = 1) {
  const R = rng(seed), parts = [], hex = [0x8a7a4a, 0x7a6a3c, 0x9a8a58][seed % 3];
  for (let i = 0; i < 3; i++) { const g = new THREE.IcosahedronGeometry(0.45 + R() * 0.35, 0); g.scale(1, 0.62, 1); g.translate((R() - 0.5) * 0.9, 0.22, (R() - 0.5) * 0.9); parts.push(tint(g, hex, 0.35, R)); }
  return merge(parts);
}

/** caixa com UV de fachada (janelas) — largura w, altura h, profundidade d; u0/v0 deslocam o padrão de janelas */
export function boxGeo(w, h, d, u0 = 0, v0 = 0, mx = 3.6, my = 3.4) {
  const P = [], N = [], U = [], I = [];
  const face = (a, b, c, e, n, uw, uh) => { const o = P.length / 3; P.push(...a, ...b, ...c, ...e); for (let i = 0; i < 4; i++) N.push(...n);
    U.push(u0, v0, u0 + uw / (8 * mx), v0, u0 + uw / (8 * mx), v0 + uh / (8 * my), u0, v0 + uh / (8 * my)); I.push(o, o + 1, o + 2, o, o + 2, o + 3); };
  const x = w / 2, z = d / 2;
  face([-x, 0, z], [x, 0, z], [x, h, z], [-x, h, z], [0, 0, 1], w, h);
  face([x, 0, -z], [-x, 0, -z], [-x, h, -z], [x, h, -z], [0, 0, -1], w, h);
  face([x, 0, z], [x, 0, -z], [x, h, -z], [x, h, z], [1, 0, 0], d, h);
  face([-x, 0, -z], [-x, 0, z], [-x, h, z], [-x, h, -z], [-1, 0, 0], d, h);
  const o = P.length / 3; P.push(-x, h, z, x, h, z, x, h, -z, -x, h, -z); for (let i = 0; i < 4; i++) { N.push(0, 1, 0); U.push(0.01, 0.01); } I.push(o, o + 1, o + 2, o, o + 2, o + 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); return g;
}

/** casa/celeiro: paredes + telhado de duas águas (cores por vértice) */
export function houseGeometry(w, d, h, wall, roof, rh = 0.55) {
  const body = new THREE.BoxGeometry(w, h, d); body.translate(0, h / 2, 0);
  const rf = new THREE.BufferGeometry(), x = w / 2 + 0.4, z = d / 2 + 0.3, y1 = h, y2 = h + Math.min(w, d) * rh;
  const v = [[-x, y1, z], [x, y1, z], [x, y2, 0], [-x, y2, 0], [-x, y1, -z], [x, y1, -z]];
  const P = [...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[3], ...v[5], ...v[4], ...v[3], ...v[5], ...v[3], ...v[2], ...v[1], ...v[5], ...v[2], ...v[4], ...v[0], ...v[3]];
  rf.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); rf.computeVertexNormals();
  const door = new THREE.BoxGeometry(1.1, 2, 0.15); door.translate(0, 1, d / 2 + 0.05);
  const win = new THREE.BoxGeometry(1.2, 1.0, 0.15); win.translate(w * 0.28, h * 0.58, d / 2 + 0.05);
  return merge([tint(body, wall), tint(rf, roof), tint(door, 0x4a3426), tint(win, 0x39506a)]);
}

// ---------------------------------------------------------------- texturas de prédio (janelas)
export function windowTextures(seed = 5) {
  const R = rng(seed), S = 512, C = 8, cs = S / C;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const a = mk(), b = mk(), ga = a.getContext('2d'), gb = b.getContext('2d');
  ga.fillStyle = '#d4d6da'; ga.fillRect(0, 0, S, S); gb.fillStyle = '#000'; gb.fillRect(0, 0, S, S);
  const lit = ['#ffd9a0', '#ffe9c8', '#d6e6ff', '#ffc27a', '#fff3da'];
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
    const x = i * cs + 11, y = j * cs + 12, w = cs - 22, h = cs - 24, on = R() < 0.42;
    ga.fillStyle = '#9ba0aa'; ga.fillRect(x - 2, y - 2, w + 4, h + 4);
    ga.fillStyle = on ? '#e8e4d8' : '#222a38'; ga.fillRect(x, y, w, h);
    if (on) { gb.fillStyle = lit[(R() * lit.length) | 0]; gb.fillRect(x, y, w, h); }
  }
  const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: T(a, true), emissive: T(b, true) };
}

// ---------------------------------------------------------------- planejamento (sem 3D)
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

export function planProps(track, terrain, theme, seed = 23) {
  const P = (theme && theme.props) || {}, R = rng(seed), S = track.S, N = track.N, out = { colliders: [] };
  const seaY = theme && theme.water ? theme.water.y : -1e9;
  const col = (x, z, r) => out.colliders.push({ x, z, r });
  const free = (x, z, dmin, dmax, maxSlope = 0.35) => { const d = terrain.distAt(x, z); return d >= dmin && d <= dmax && terrain.heightAt(x, z) > seaY + 0.7 && terrain.slopeAt(x, z) < maxSlope; };
  const rand = (n, fn) => { for (let k = 0; k < n; k++) { const x = terrain.x0 + R() * terrain.w, z = terrain.z0 + R() * terrain.h; fn(x, z); } };
  const spots = []; const apart = (x, z, r) => { for (const s of spots) if ((s.x - x) ** 2 + (s.z - z) ** 2 < (s.r + r) ** 2) return false; spots.push({ x, z, r }); return true; };

  if (P.palm) {
    out.palm = []; const pos = (x, z, rot, sc) => out.palm.push({ x, y: terrain.heightAt(x, z), z, rot, sc, v: (R() * 3) | 0 });
    for (let i = 0; i < N; i += Math.max(1, Math.round((18 + R() * 26) / track.ds / P.palm))) for (const side of [-1, 1]) {   // fileira ao lado da pista
      if (R() < 0.35) continue; const p = S[i], o = side * (HALF + 5 + R() * 20), x = p.x + p.nx * o, z = p.z + p.nz * o;
      if (free(x, z, HALF + 4, 90, 0.3)) pos(x, z, R() * 6.283, 0.85 + R() * 0.5);
    }
    rand(Math.round(2600 * P.palm), (x, z) => { if (out.palm.length < 240 * P.palm && free(x, z, 12, 170, 0.3) && R() < 0.5) pos(x, z, R() * 6.283, 0.8 + R() * 0.6); });
    for (const q of out.palm) col(q.x, q.z, 0.45);
  }
  if (P.cactus) {
    out.cactus = []; rand(Math.round(9000 * P.cactus), (x, z) => { if (out.cactus.length < 230 * P.cactus && free(x, z, 13, 260, 0.28) && R() < 0.6) out.cactus.push({ x, y: terrain.heightAt(x, z), z, rot: R() * 6.283, sc: 0.7 + R() * 0.8, v: (R() * 3) | 0 }); });
    for (const q of out.cactus) col(q.x, q.z, 0.5 * q.sc);
  }
  if (P.shrub) { out.shrub = []; rand(Math.round(9000 * P.shrub), (x, z) => { if (out.shrub.length < 900 * P.shrub && free(x, z, 9, 230, 0.4) && R() < 0.7) out.shrub.push({ x, y: terrain.heightAt(x, z), z, rot: R() * 6.283, sc: 0.7 + R() * 1.1, v: (R() * 3) | 0 }); }); }

  if (P.building) {   // quarteirões: grade de 36 m, alinhada às ruas; mais altos perto do centro
    out.building = []; let cx = 0, cz = 0; for (const p of S) { cx += p.x; cz += p.z; } cx /= N; cz /= N;
    const step = 36, H = [14, 22, 32, 46, 62, 84];
    for (let z = terrain.z0 + 60; z < terrain.z0 + terrain.h - 60; z += step) for (let x = terrain.x0 + 60; x < terrain.x0 + terrain.w - 60; x += step) {
      const px = x + (R() - 0.5) * 4, pz = z + (R() - 0.5) * 4, d = terrain.distAt(px, pz), w = 18 + R() * 11, dp = 18 + R() * 11, hd = Math.hypot(w, dp) / 2 + HALF + 7;
      if (d < hd || d > 330 || R() > 0.93) continue;
      const dc = Math.hypot(px - cx, pz - cz), core = Math.exp(-((dc / 300) ** 2)), hv = Math.min(5, Math.floor((0.1 + core * (0.55 + R() * 0.7) + R() * 0.25) * 6));
      out.building.push({ x: px, y: terrain.heightAt(px, pz), z: pz, w, d: dp, hv, sy: 0.9 + R() * 0.25, tint: 0.7 + R() * 0.5 });
      if (d < 75) { const n = Math.max(1, Math.round(Math.max(w, dp) / Math.min(w, dp))), r = Math.min(w, dp) * 0.5; for (let k = 0; k < n; k++) { const t = n === 1 ? 0 : (k / (n - 1) - 0.5) * (Math.max(w, dp) - 2 * r); col(w > dp ? px + t : px, w > dp ? pz : pz + t, r * 0.95); } }
    }
    for (let k = 0; k < 40; k++) {   // torres distantes (silhueta no horizonte)
      const a = R() * 6.283, rr = 380 + R() * 320, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      out.building.push({ x, y: terrain.heightAt(x, z), z, w: 30 + R() * 20, d: 30 + R() * 20, hv: 5, sy: 1.1 + R() * 0.9, tint: 0.7 + R() * 0.5 });
    }
  }
  if (P.lamp) {
    out.lamp = []; const every = Math.round(40 / track.ds);
    for (let i = 0, k = 0; i < N; i += every, k++) { const side = k % 2 ? 1 : -1, p = S[i], o = side * (HALF + 3.4), x = p.x + p.nx * o, z = p.z + p.nz * o;
      if (track.nearest(x, z).d < HALF + 2.5) continue;
      out.lamp.push({ x, y: p.y, z, rot: Math.atan2(side * p.nz, -side * p.nx), px: p.x + p.nx * side * (HALF - 1.6), pz: p.z + p.nz * side * (HALF - 1.6), py: p.y }); col(x, z, 0.25); }
  }
  if (P.house) {
    out.house = []; const target = Math.round(16 * P.house);
    rand(6000, (x, z) => { if (out.house.length < target && free(x, z, 32, 130, 0.12) && apart(x, z, 22)) { out.house.push({ x, y: terrain.heightAt(x, z), z, rot: R() * 6.283, v: (R() * 3) | 0, sc: 0.9 + R() * 0.4 }); col(x, z, 3.4 * 1); } });
  }
  if (P.barn) {
    out.barn = []; const target = Math.max(2, Math.round(track.length / 700 * P.barn));
    rand(8000, (x, z) => { if (out.barn.length < target && free(x, z, 40, 140, 0.1) && apart(x, z, 28)) { const rot = R() * 6.283; out.barn.push({ x, y: terrain.heightAt(x, z), z, rot, sc: 0.9 + R() * 0.3 });
      for (const t of [-3, 0, 3]) col(x + Math.sin(rot) * t, z + Math.cos(rot) * t, 4); col(x + Math.cos(rot) * 11, z - Math.sin(rot) * 11, 2.4); } });
  }
  if (P.hay) {
    out.hay = []; const target = Math.round(60 * P.hay);
    rand(6000, (x, z) => { if (out.hay.length < target && free(x, z, 16, 110, 0.12)) { const n = 1 + ((R() * 3) | 0), rot = R() * 6.283; for (let k = 0; k < n; k++) { const hx = x + k * 2.4 * Math.cos(rot), hz = z - k * 2.4 * Math.sin(rot); out.hay.push({ x: hx, y: terrain.heightAt(hx, hz), z: hz, rot }); col(hx, hz, 1.15); } } });
  }
  if (P.fence) {   // cerca de arame nos dois lados da pista
    out.fence = { posts: [], wires: [] }; const sp = 5, every = Math.max(1, Math.round(sp / track.ds));
    for (const side of [-1, 1]) { let prev = null;
      for (let i = 0; i < N; i += every) { const p = S[i], o = side * (HALF + 15), x = p.x + p.nx * o, z = p.z + p.nz * o;
        const ok = track.nearest(x, z).d > HALF + 12 && terrain.slopeAt(x, z) < 0.55;
        if (!ok) { prev = null; continue; }
        const q = { x, y: terrain.heightAt(x, z), z }; out.fence.posts.push({ ...q, rot: Math.atan2(p.tx, p.tz) });
        if (prev && dist2(prev, q) < 49) for (const h of [0.45, 0.85, 1.25]) out.fence.wires.push(prev.x, prev.y + h, prev.z, q.x, q.y + h, q.z);
        prev = q; } }
  }
  if (P.pole) {   // postes de energia de um lado, com fios
    out.pole = { poles: [], wires: [] }; const every = Math.round(48 / track.ds), side = -1; let prev = null;
    for (let i = 0; i < N; i += every) { const p = S[i], o = side * (HALF + 8), x = p.x + p.nx * o, z = p.z + p.nz * o;
      if (track.nearest(x, z).d < HALF + 6 || terrain.slopeAt(x, z) > 0.6) { prev = null; continue; }
      const y = terrain.heightAt(x, z), rot = Math.atan2(p.tx, p.tz), q = { x, y, z, rot }; out.pole.poles.push(q); col(x, z, 0.25);
      if (prev && dist2(prev, q) < 90 * 90) for (const off of [-0.9, 0, 0.9]) {
        const a = { x: prev.x + Math.cos(prev.rot) * off, z: prev.z - Math.sin(prev.rot) * off, y: prev.y + 8.3 }, b = { x: x + Math.cos(rot) * off, z: z - Math.sin(rot) * off, y: y + 8.3 };
        for (let s = 0; s < 6; s++) { const t0 = s / 6, t1 = (s + 1) / 6, sag = (t) => 4 * t * (1 - t) * 0.9;
          out.pole.wires.push(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0 - sag(t0), a.z + (b.z - a.z) * t0, a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1 - sag(t1), a.z + (b.z - a.z) * t1); } }
      prev = q; }
  }
  return out;
}

// ---------------------------------------------------------------- criação 3D
const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), E4 = new THREE.Euler(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
function inst(parent, geo, mat, list, place, { cast = false, color = null } = {}) {
  if (!list || !list.length) return null;
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((it, i) => { place(it); m.setMatrixAt(i, M4); if (color) m.setColorAt(i, color(it)); });
  m.instanceMatrix.setUsage(THREE.StaticDrawUsage); m.castShadow = cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.computeBoundingSphere(); parent.add(m); return m;
}
const put = (x, y, z, rot, sx, sy = sx, sz = sx, tx = 0, tz = 0) => { E4.set(tx, rot, tz, 'YXZ'); Q4.setFromEuler(E4); M4.compose(V3.set(x, y, z), Q4, S3.set(sx, sy, sz)); };

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildProps(scene, track, terrain, theme) {
  const root = new THREE.Group(); root.name = 'props'; scene.add(root);
  const plan = planProps(track, terrain, theme), P = (theme && theme.props) || {};
  const std = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, envMapIntensity: 0.5, ...o });

  if (plan.palm) { const mat = std({ side: THREE.DoubleSide, roughness: 0.75 }), geos = [1, 2, 3].map((s) => palmGeometry(s * 17));
    for (let v = 0; v < 3; v++) inst(root, geos[v], mat, plan.palm.filter((q) => q.v === v), (q) => put(q.x, q.y - 0.2, q.z, q.rot, q.sc, q.sc, q.sc, (Math.sin(q.rot * 3) * 0.05), 0), { cast: true }); }
  if (plan.cactus) { const mat = std({ roughness: 0.8 }); for (let v = 0; v < 3; v++) inst(root, cactusGeometry(v * 13 + 3), mat, plan.cactus.filter((q) => q.v === v), (q) => put(q.x, q.y - 0.1, q.z, q.rot, q.sc), { cast: true }); }
  if (plan.shrub) { const mat = std({ roughness: 0.95 }); for (let v = 0; v < 3; v++) inst(root, shrubGeometry(v), mat, plan.shrub.filter((q) => q.v === v), (q) => put(q.x, q.y, q.z, q.rot, q.sc)); }

  if (plan.building) {
    const wt = windowTextures(), mat = new THREE.MeshStandardMaterial({ map: wt.map, emissiveMap: wt.emissive, emissive: 0xffffff, emissiveIntensity: 1.9, roughness: 0.7, metalness: 0.15, envMapIntensity: 0.6 });
    const H = [14, 22, 32, 46, 62, 84], tc = (q) => new THREE.Color().setScalar(q.tint).multiply(new THREE.Color(0.95 + q.tint * 0.05, 1, 1.03));
    for (let v = 0; v < 6; v++) {   // 6 classes de altura; o padrão de janelas muda de uma para outra
      inst(root, boxGeo(24, H[v], 24, (v * 0.37) % 1, (v * 0.61) % 1), mat, plan.building.filter((q) => q.hv === v), (q) => put(q.x, q.y - 0.3, q.z, 0, q.w / 24, q.sy, q.d / 24), { cast: true, color: tc });
    }
  }
  if (plan.lamp) {
    const pole = merge([tint(new THREE.CylinderGeometry(0.1, 0.16, 9, 6).translate(0, 4.5, 0), 0x3d4148), tint(new THREE.BoxGeometry(2.6, 0.12, 0.12).translate(1.3, 9, 0), 0x3d4148)]);
    inst(root, pole, std({ roughness: 0.6, metalness: 0.4 }), plan.lamp, (q) => put(q.x, q.y, q.z, q.rot), { cast: true });
    const head = new THREE.BoxGeometry(1.0, 0.16, 0.42).translate(2.5, 8.9, 0), hm = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 3.2, 2.0), toneMapped: false });
    inst(root, head, hm, plan.lamp, (q) => put(q.x, q.y, q.z, q.rot));
    // manchas de luz no asfalto + brilho (glow) das lâmpadas
    const glow = glowTexture(), pool = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const pm = new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(1.0, 0.78, 0.45), transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: true });
    inst(root, pool, pm, plan.lamp, (q) => put(q.px, q.py + 0.05, q.pz, 0, 18, 1, 18));
    // o braço aponta para +X local rodado por rot: posição da lâmpada = pé + (cos rot, -sin rot) * 2.5
    const pos = new Float32Array(plan.lamp.length * 3); plan.lamp.forEach((q, i) => { pos[i * 3] = q.x + Math.cos(q.rot) * 2.5; pos[i * 3 + 1] = q.y + 8.9; pos[i * 3 + 2] = q.z - Math.sin(q.rot) * 2.5; });
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const gm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { tG: { value: glow }, uPR: { value: 1 } },
      vertexShader: 'uniform float uPR; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(300.0 * uPR / max(-mv.z, 1.0), 2.0, 90.0); }',
      fragmentShader: 'uniform sampler2D tG; void main(){ vec4 c = texture2D(tG, gl_PointCoord); gl_FragColor = vec4(vec3(1.0, 0.78, 0.45) * c.a * 0.9, c.a * 0.9); }' });
    const pts = new THREE.Points(gg, gm); pts.frustumCulled = false; root.add(pts); plan.glowMat = gm;
  }
  if (plan.house) {
    const pal = (theme && theme.sky === 'neve')
      ? [[0x7a5236, 0xf2f5fa], [0x8a6240, 0xe9eef6], [0x6c4a30, 0xf5f8fc]]
      : [[0xf1ede4, 0xb5543a], [0xf2e0b4, 0x2f6f95], [0xe9c46a, 0xa84a2a]];
    for (let v = 0; v < 3; v++) inst(root, houseGeometry(9, 7, 3.4, pal[v][0], pal[v][1]), std({ roughness: 0.8 }), plan.house.filter((q) => q.v === v), (q) => put(q.x, q.y - 0.2, q.z, q.rot, q.sc), { cast: true });
  }
  if (plan.barn) {
    const m = std({ roughness: 0.85 }), barn = houseGeometry(14, 10, 5, 0xa33a2a, 0x555a60, 0.5);
    const silo = merge([tint(new THREE.CylinderGeometry(2.1, 2.2, 10, 12).translate(11, 5, 0), 0xd8d8d2), tint(new THREE.SphereGeometry(2.1, 12, 6, 0, 6.2832, 0, Math.PI / 2).translate(11, 10, 0), 0x9aa0a6)]);
    inst(root, merge([barn, silo]), m, plan.barn, (q) => put(q.x, q.y - 0.2, q.z, q.rot, q.sc), { cast: true });
  }
  if (plan.hay) {
    const g = merge([tint(new THREE.CylinderGeometry(1.0, 1.0, 1.3, 14).rotateZ(Math.PI / 2).translate(0, 1.0, 0), 0xcdb45e, 0.25, rng(4))]);
    inst(root, g, std({ roughness: 0.95 }), plan.hay, (q) => put(q.x, q.y, q.z, q.rot, 1), { cast: true });
  }
  if (plan.fence) {
    inst(root, tint(new THREE.BoxGeometry(0.14, 1.4, 0.14).translate(0, 0.7, 0), 0x6b5035), std({ roughness: 0.9 }), plan.fence.posts, (q) => put(q.x, q.y, q.z, q.rot));
    if (plan.fence.wires.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(plan.fence.wires, 3)); root.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x8a8a8a }))); }
  }
  if (plan.pole) {
    const g = merge([tint(new THREE.CylinderGeometry(0.13, 0.19, 9.2, 6).translate(0, 4.6, 0), 0x5a4632), tint(new THREE.BoxGeometry(2.4, 0.14, 0.14).translate(0, 8.3, 0), 0x5a4632)]);
    inst(root, g, std({ roughness: 0.9 }), plan.pole.poles, (q) => put(q.x, q.y, q.z, q.rot), { cast: true });
    if (plan.pole.wires.length) { const w = new THREE.BufferGeometry(); w.setAttribute('position', new THREE.Float32BufferAttribute(plan.pole.wires, 3)); root.add(new THREE.LineSegments(w, new THREE.LineBasicMaterial({ color: 0x222222 }))); }
  }
  const update = (pr = 1) => { if (plan.glowMat) plan.glowMat.uniforms.uPR.value = pr; };
  return { root, plan, colliders: plan.colliders, update };
}

/** mar: plano grande com ondulação no brilho/normal (usa o tempo do jogo) */
export function buildWater(scene, water, timeUniform) {
  const g = new THREE.PlaneGeometry(16000, 16000, 1, 1).rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: water.color, roughness: 0.14, metalness: 0.0, envMapIntensity: 0.75, transparent: true, opacity: 0.97 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uT = timeUniform;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT; varying vec3 vWp;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      { vec2 q = vWp.xz; float t = uT;
        vec2 w = vec2(sin(q.x * 0.21 + t * 1.1) + sin(q.y * 0.17 - t * 0.9) + 0.5 * sin((q.x + q.y) * 0.5 + t * 1.7) + 0.35 * sin(q.x * 1.3 + t * 2.3),
                      cos(q.x * 0.19 - t * 0.8) + cos(q.y * 0.23 + t * 1.2) + 0.5 * cos((q.x - q.y) * 0.6 - t * 1.4) + 0.35 * cos(q.y * 1.1 - t * 2.1));
        normal = normalize(normal + (viewMatrix * vec4(w.x, 0.0, w.y, 0.0)).xyz * 0.03); }`);
  };
  m.customProgramCacheKey = () => 'water-v1';
  const mesh = new THREE.Mesh(g, m); mesh.position.y = water.y; mesh.name = 'mar'; mesh.receiveShadow = false; mesh.renderOrder = 1; scene.add(mesh); return mesh;
}
