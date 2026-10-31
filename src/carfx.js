// carfx.js — efeitos por carro: sombra suave no chão (blob) e brilho dos faróis/lanternas (sprites aditivos, sem sombra).
import * as THREE from 'three';

const tex = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
let blobT, glowT;
const blobTex = () => blobT || (blobT = tex((g) => { const r = g.createRadialGradient(64, 64, 6, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,.85)'); r.addColorStop(0.55, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }));
const glowTex = () => glowT || (glowT = tex((g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }));

export function makeCarFx(scene, car, d) {
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(d.width * 1.55, d.length * 1.3).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  blob.renderOrder = 1; blob.frustumCulled = false; scene.add(blob);
  const mkSp = (x, y, z, size, color) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false, opacity: 0 }));
    s.position.set(x, y, z); s.scale.setScalar(size); car.object.add(s); return s;
  };
  const hx = d.width * 0.32, hy = d.height * 0.36, hz = d.length * 0.5 + 0.12, tx = d.width * 0.34, ty = d.height * 0.42, tz = -d.length * 0.5 - 0.1;
  const head = [mkSp(-hx, hy, hz, 1.5, 0xfff1d0), mkSp(hx, hy, hz, 1.5, 0xfff1d0)], tail = [mkSp(-tx, ty, tz, 0.95, 0xff2a1a), mkSp(tx, ty, tz, 0.95, 0xff2a1a)];
  return {
    blob,
    update(night, braking, dist) {
      const near = dist < 140;
      for (const s of head) s.material.opacity = night && near ? 0.9 : 0;
      for (const s of tail) s.material.opacity = near ? (braking ? 1 : night ? 0.55 : 0) : 0;
    },
  };
}
