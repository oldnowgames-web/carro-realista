// carMods.js — "mudadinha" visual em cada carro: peças extras (aerofólio, spoiler, saias, lip frontal, barra de luz),
// listras de corrida que acompanham a carroceria, aros coloridos, vidro mais escuro e carroceria um pouco mais larga.
//
// As peças são medidas no próprio modelo (raios lançados na carroceria), então se encaixam em qualquer carro.
// Cada carro escolhe o que usa na propriedade `mods` do carData.js:
//   widen: 1.04                      largura extra (1 = original)
//   rimColor: '#d4af37'              cor dos aros (só onde o aro é um material separado)
//   tint: 0.96                       opacidade do vidro (menor = mais escuro)
//   lip: {color:'#111'|'body'}       lip/splitter na frente
//   skirts: {color}                  saias laterais entre as rodas
//   wing: {style:'gt'|'duck'|'twin', color}   aerofólio / spoiler traseiro
//   stripes: {color, x:[..], hw}     listras longitudinais (capô, teto, porta-malas) — pulam os vidros
//   bar: {z, color}                  barra de luz no teto (z = fração do comprimento, +frente)
import * as THREE from 'three';

const carbon = () => new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.42, metalness: 0.35 });

export function applyMods(ctx) {
  const { cfg, src, chassis, dims, wheels, paint, glassMats } = ctx, m = cfg.mods;
  if (!m) return;
  const L = dims.length, W = dims.width, H = dims.height;
  const ray = new THREE.Raycaster(), V = new THREE.Vector3(), D = new THREE.Vector3();
  chassis.updateMatrixWorld(true);
  const wheelObjs = new Set(); wheels.forEach((w) => w.pivot.traverse((o) => wheelObjs.add(o)));

  // ---- medições na carroceria ----
  const cast = (ox, oy, oz, dx, dy, dz) => {
    ray.set(V.set(ox, oy, oz), D.set(dx, dy, dz)); ray.far = 20;
    for (const h of ray.intersectObject(src, true)) if (!wheelObjs.has(h.object) && !h.object.userData.mod) return h;
    return null;
  };
  const isGlass = (h) => { const mm = h.object.material; const mat = Array.isArray(mm) ? mm[h.face.materialIndex] : mm; return glassMats.includes(mat); };
  const topY = (x, z) => { const h = cast(x, H + 2, z, 0, -1, 0); return h ? h.point.y : null; };
  const noseZ = (y, x = 0) => { const h = cast(x, y, L, 0, 0, -1); return h ? h.point.z : L / 2; };
  const tailZ = (y, x = 0) => { const h = cast(x, y, -L, 0, 0, 1); return h ? h.point.z : -L / 2; };
  const sideX = (y, z) => { const h = cast(W, y, z, -1, 0, 0); return h ? h.point.x : W / 2; };

  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
    o.castShadow = true; o.userData.mod = true; chassis.add(o); return o;
  };
  const bodyMat = () => { const mt = new THREE.MeshPhysicalMaterial({ color: 0xffffff }); paint.add(mt); return mt; };
  const matFor = (c) => (c === 'body' ? bodyMat() : (() => { const mt = carbon(); if (c && c !== 'carbon') mt.color.set(c); return mt; })());
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // ---- aros e vidro ----
  if (m.rimColor) for (const mt of ctx.rimMats) { mt.color.set(m.rimColor); mt.metalness = 0.95; mt.roughness = 0.22; }
  if (m.tint != null) for (const mt of glassMats) { mt.opacity = m.tint; mt.color.set(0x020406); }

  // ---- lip frontal ----
  if (m.lip) {
    const mt = matFor(m.lip.color); let zn = L / 2 - 0.1, ly = 0.12;
    for (let y = 0.06; y < 1.0; y += 0.04) { const h = cast(0, y, L, 0, 0, -1); if (h && h.point.z > L * 0.5 - 0.4) { ly = y; zn = h.point.z; break; } }
    const wn = sideX(ly + 0.12, zn - 0.3) * 2, wd = Math.min(W * 0.92, wn * 0.98);
    add(box(wd, 0.03, 0.3), mt, 0, ly - 0.01, zn + 0.03, -0.05);
    for (const sx of [-1, 1]) add(box(0.03, 0.08, 0.3), mt, sx * (wd / 2 - 0.015), ly + 0.02, zn + 0.03);
  }
  // ---- saias laterais ----
  if (m.skirts) {
    const mt = matFor(m.skirts.color), fw = wheels.filter((w) => w.front), rw = wheels.filter((w) => !w.front);
    if (fw.length && rw.length) {
      const r = ctx.wheelR, zf = fw[0].mz - r * 1.05, zr = rw[0].mz + r * 1.05, len = zf - zr, zc = (zf + zr) / 2;
      let y0 = 0.2;
      for (let y = 0.06; y < 0.8; y += 0.03) { const h = cast(W, y, zc, -1, 0, 0); if (h) { y0 = y; break; } }
      for (const sx of [-1, 1]) { const x = sideX(y0 + 0.05, zc) * sx; add(box(0.07, 0.11, len), mt, x - sx * 0.01, y0 + 0.03, zc); }
    }
  }
  // ---- aerofólio ----
  if (m.wing) {
    const w = m.wing, mt = matFor(w.color), zt = Math.max(-L / 2 + 0.2, -L * 0.36), yt = topY(0, zt) ?? H * 0.7, yEdge = topY(0, tailZ(yt - 0.08) + 0.12) ?? yt;
    const ze = tailZ(yt - 0.08), ww = (sideX(yt - 0.12, ze + 0.25) * 2) * 0.86;
    if (w.style === 'duck') {
      add(box(ww * 0.92, 0.035, 0.2), mt, 0, yEdge + 0.05, ze + 0.12, 0.28);
      for (const sx of [-1, 1]) add(box(0.03, 0.09, 0.2), mt, sx * ww * 0.46, yEdge + 0.08, ze + 0.12);
    } else {
      const hgt = w.style === 'twin' ? 0.3 : 0.36, zc = ze + 0.1, yw = yEdge + hgt;
      add(box(ww, 0.04, 0.3), mt, 0, yw, zc, 0.1);
      if (w.style === 'twin') add(box(ww, 0.03, 0.2), mt, 0, yw + 0.12, zc - 0.03, 0.2);
      for (const sx of [-1, 1]) {
        add(box(0.04, 0.2 + (w.style === 'twin' ? 0.1 : 0), 0.38), mt, sx * ww / 2, yw + 0.03, zc);
        add(box(0.05, hgt, 0.07), mt, sx * ww * 0.3, yEdge + hgt / 2 - 0.02, zc);
      }
    }
  }
  // ---- barra de luz no teto ----
  if (m.bar) {
    const z = L * (m.bar.z ?? 0.12), y = (topY(0, z) ?? H) + 0.045, wd = W * 0.56;
    const mt = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5, metalness: 0.4 });
    add(box(wd, 0.07, 0.1), mt, 0, y, z);
    const led = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 3.6), toneMapped: false });
    add(box(wd * 0.96, 0.045, 0.012), led, 0, y, z + 0.054);
    ctx.glowMats.push(led);
  }
  // ---- listras de corrida ----
  if (m.stripes && glassMats.length) {
    const s = m.stripes, mt = new THREE.MeshStandardMaterial({ color: s.color || '#f2f2f2', roughness: 0.4, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const hw = s.hw ?? 0.1, step = 0.07, z0 = L * 0.5, z1 = -L * 0.5, pos = [], idx = [];
    for (const x0 of s.x || [0]) {
      let prev = null;
      for (let z = z0; z >= z1; z -= step) {
        const a = cast(x0 - hw, H + 2, z, 0, -1, 0), b = cast(x0 + hw, H + 2, z, 0, -1, 0);
        const ok = a && b && !isGlass(a) && !isGlass(b) && a.point.y > H * 0.3 && b.point.y > H * 0.3 && a.face.normal.y > 0.2 && b.face.normal.y > 0.2;
        const cur = ok ? [a.point, b.point] : null;
        if (cur && prev && Math.abs(cur[0].y - prev[0].y) < 0.16 && Math.abs(cur[1].y - prev[1].y) < 0.16) {
          const base = pos.length / 3;
          for (const p of [prev[0], prev[1], cur[0], cur[1]]) pos.push(p.x, p.y + 0.006, p.z);
          idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        }
        prev = cur;
      }
    }
    if (pos.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      for (let i = 0; i < g.attributes.normal.count; i++) if (g.attributes.normal.getY(i) < 0) g.attributes.normal.setXYZ(i, -g.attributes.normal.getX(i), -g.attributes.normal.getY(i), -g.attributes.normal.getZ(i));
      const o = add(g, mt, 0, 0, 0); o.castShadow = false; mt.side = THREE.DoubleSide;
    }
  }
}
