// collide.js — colisões: carro x obstáculo fixo (árvore, pedra) e carro x carro. Círculos + impulso com giro.
const sinc = (v) => [Math.sin(v.psi), Math.cos(v.psi)];

// os 3 círculos do carro ficam guardados no próprio veículo e são reescritos (antes: 4 objetos novos por chamada, ~2000x por segundo)
export function circlesOf(v, len, wid) {
  const r = wid * 0.48, sn = Math.sin(v.psi), cs = Math.cos(v.psi), h = len / 2 - r;
  const c = v._cc || (v._cc = [{ x: 0, z: 0, r: 0 }, { x: 0, z: 0, r: 0 }, { x: 0, z: 0, r: 0 }]);
  let o = c[0]; o.x = v.x + sn * h; o.z = v.z + cs * h; o.r = r;
  o = c[1]; o.x = v.x + sn * 0; o.z = v.z + cs * 0; o.r = r;
  o = c[2]; o.x = v.x + sn * -h; o.z = v.z + cs * -h; o.r = r;
  return c;
}
export function pointVel(v, px, pz) {
  const [sn, cs] = sinc(v), rx = px - v.x, rz = pz - v.z, rf = rx * sn + rz * cs, rl = rx * cs - rz * sn;
  const uf = v.u - v.r * rl, vl = v.v + v.r * rf;
  return { x: uf * sn + vl * cs, z: uf * cs - vl * sn, rf, rl };
}
export function applyImpulse(v, px, pz, jx, jz) {
  const [sn, cs] = sinc(v), rx = px - v.x, rz = pz - v.z, rf = rx * sn + rz * cs, rl = rx * cs - rz * sn;
  const Jf = jx * sn + jz * cs, Jl = jx * cs - jz * sn;
  v.u += Jf / v.m; v.v += Jl / v.m; v.r += (rf * Jl - rl * Jf) / v.Iz;
}
const invEff = (v, px, pz, nx, nz) => {
  const [sn, cs] = sinc(v), rx = px - v.x, rz = pz - v.z, rf = rx * sn + rz * cs, rl = rx * cs - rz * sn, nf = nx * sn + nz * cs, nl = nx * cs - nz * sn;
  const arm = rf * nl - rl * nf; return 1 / v.m + (arm * arm) / v.Iz;
};

/** colisão com obstáculos circulares fixos. Retorna a intensidade do impacto (m/s) ou 0 */
export function hitStatic(v, len, wid, obstacles) {
  let worst = 0;
  for (const c of circlesOf(v, len, wid)) for (const o of obstacles(c.x, c.z)) {
    const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz), pen = c.r + o.r - d;
    if (!(pen > 0) || !(d >= 1e-4) || !Number.isFinite(pen)) continue;   // NaN/Infinity (obstáculo inválido) não entra na conta
    const nx = dx / d, nz = dz / d, px = c.x - nx * c.r, pz = c.z - nz * c.r, vp = pointVel(v, px, pz), vn = vp.x * nx + vp.z * nz;
    v.x += nx * pen; v.z += nz * pen;
    if (vn < 0) { const J = -(1.12) * vn / invEff(v, px, pz, nx, nz); applyImpulse(v, px, pz, nx * J, nz * J); v.u *= 0.97; worst = Math.max(worst, -vn); }
  }
  return worst;
}
/** colisão entre dois carros. Retorna a intensidade do impacto ou 0 */
export function hitCars(a, b, len, wid) {
  const ca = circlesOf(a, len, wid), cb = circlesOf(b, len, wid); let worst = 0;
  for (const p of ca) for (const q of cb) {
    const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz), pen = p.r + q.r - d;
    if (!(pen > 0) || !(d >= 1e-4) || !Number.isFinite(pen)) continue;
    const nx = dx / d, nz = dz / d, px = (p.x + q.x) / 2, pz = (p.z + q.z) / 2;
    const va = pointVel(a, px, pz), vb = pointVel(b, px, pz), vn = (va.x - vb.x) * nx + (va.z - vb.z) * nz;
    const wa = 1 / a.m, wb = 1 / b.m, sa = wa / (wa + wb);
    a.x += nx * pen * sa; a.z += nz * pen * sa; b.x -= nx * pen * (1 - sa); b.z -= nz * pen * (1 - sa);
    if (vn < 0) {
      const J = -(1.15) * vn / (invEff(a, px, pz, nx, nz) + invEff(b, px, pz, nx, nz));
      applyImpulse(a, px, pz, nx * J, nz * J); applyImpulse(b, px, pz, -nx * J, -nz * J); worst = Math.max(worst, -vn);
    }
  }
  return worst;
}
