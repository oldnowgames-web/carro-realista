// ai.js — piloto dos bots: segue a pista com "pure pursuit", escolhe a linha pelas curvas, calcula a velocidade
// de cada curva pela aderência DO PRÓPRIO carro e desvia de quem está na frente. Dirige com os mesmos controles do jogador.
import { HALF } from './trackBuilder.js';
import { rng } from './noise.js';

const G = 9.81, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Driver {
  /** style: { aggr 0..1 (agressividade), err (multiplicador de erros) } */
  constructor(skill = 0.95, seed = 1, style = {}) {
    this.skill = skill; this.R = rng(seed); this.aggr = style.aggr != null ? style.aggr : 0.5; this.errK = style.err != null ? style.err : 1;
    this.bias = (this.R() - 0.5) * 2.4;       // preferência de lado
    this.off = 0; this.avoid = 0; this.errT = (12 + this.R() * 30) / this.errK; this.errOff = 0; this.errLeft = 0; this.stuck = 0;
  }
  control(rc, race, dt) {
    const v = rc.veh, tr = race.world.track, u = v.u, spec = v.spec, wet = race.world.wet || 0;
    const s0 = rc.idx * tr.ds;
    // ----- linha: parte de dentro das curvas -----
    const Ld = clamp(7 + 0.9 * Math.max(u, 0), 9, 70);
    const kAhead = tr.at(s0 + Ld * 1.6).k;
    let want = clamp(kAhead * 150, -3.4, 3.4) * this.skill + this.bias * 0.5;
    // ----- erros ocasionais -----
    this.errT -= dt;
    if (this.errT <= 0) { this.errT = (14 + this.R() * 35) / this.errK; this.errLeft = 1.6; this.errOff = (this.R() < 0.5 ? -1 : 1) * (1.5 + this.R() * 2) * (1.02 - this.skill) * 8 * this.errK; }
    if (this.errLeft > 0) { this.errLeft -= dt; want += this.errOff; }
    // ----- desvio de quem está à frente -----
    let avoidT = 0, close = 99, closeU = u;
    for (const o of race.racers) {
      if (o === rc) continue;
      const dxs = o.veh.x - v.x, dzs = o.veh.z - v.z, sn = Math.sin(v.psi), cs = Math.cos(v.psi);
      const df = dxs * sn + dzs * cs, dl = dxs * cs - dzs * sn;
      const reach = 35 - 12 * this.aggr; if (df > 0 && df < reach && Math.abs(dl) < 2.6) { if (df < close) { close = df; closeU = o.veh.u; } avoidT += (dl >= 0 ? -1 : 1) * (3.3 - 1.3 * this.aggr) * (1 - df / reach); }
    }
    this.avoid += (avoidT - this.avoid) * Math.min(1, dt * 2.2);
    want = clamp(want + this.avoid, -(HALF - 1.9), HALF - 1.9);
    this.off += (want - this.off) * Math.min(1, dt * 1.6);
    // ----- direção (erro lateral + erro de rumo + alimentação pela curvatura) -----
    const pc = tr.at(s0 + 0), tx = Math.sin(pc.h), tz = Math.cos(pc.h);
    const along = (v.x - pc.x) * tx + (v.z - pc.z) * tz;
    const pn = tr.at(s0 + along), latErr = (v.x - pn.x) * pn.nx + (v.z - pn.z) * pn.nz - this.off;   // + = carro à esquerda da linha
    let he = pn.h - v.psi; he = Math.atan2(Math.sin(he), Math.cos(he));
    const kff = tr.at(s0 + clamp(0.35 * Math.abs(u) + 4, 6, 40)).k;
    const slipB = Math.atan2(v.v, Math.max(Math.abs(u), 5));
    const dTot = Math.atan(v.L * kff) + 0.9 * he - Math.atan(1.7 * latErr / (Math.abs(u) + 5)) - clamp(0.6 * slipB, -0.15, 0.15);
    let steer = clamp(dTot / v.maxSteer(u), -1, 1);
    this.st = this.st == null ? steer : this.st + (steer - this.st) * Math.min(1, dt * 14); steer = this.st;
    // ----- velocidade alvo -----
    const ag = 0.95 + 0.1 * this.aggr, muE = spec.mu * (1 - 0.28 * wet) * 0.84 * this.skill * ag, aB = spec.brakeG * (1 - 0.25 * wet) * G * 0.68 * this.skill * ag;
    let target = 120;
    for (let d = 0; d <= 340; d += 8) {
      const p = tr.at(s0 + d), kk = Math.abs(p.k), vc = Math.sqrt(muE * G / Math.max(kk, 1e-4) * (1 + 0.0004 * 0)) ;
      target = Math.min(target, Math.sqrt(vc * vc + 2 * aB * d));
    }
    if (close < 14 - 4 * this.aggr) target = Math.min(target, closeU + (close - (6 - 2.5 * this.aggr)) * 0.6);
    if (Math.abs(slipB) > 0.17) target = Math.min(target, Math.abs(u) * 0.75);   // derrapando: tira o pé
    this.tgt = this.tgt == null ? target : this.tgt + (target - this.tgt) * Math.min(1, dt * (target < this.tgt ? 10 : 2.5));
    // ----- pedais (com zona morta para não ficar alternando freio e acelerador) -----
    const err = this.tgt - u; let throttle = 0, brake = 0;
    if (err > -1.2) throttle = clamp(0.22 + err * 0.35, 0, 1); else if (err < -2) brake = clamp((-err - 1.2) * 0.3, 0, 1);
    if (Math.abs(steer) > 0.7 && u > 12) throttle *= 0.65;
    if (Math.abs(slipB) > 0.17) throttle = 0;
    const straight = Math.abs(tr.at(s0 + 60).k) < 0.002 && Math.abs(tr.at(s0 + 140).k) < 0.003;
    const nitro = straight && v.nit > 0.45 && throttle > 0.9 && Math.abs(steer) < 0.1;
    // ----- preso? -----
    if (race.state === 'race') { if (Math.abs(u) < 1.5) this.stuck += dt; else this.stuck = 0; }
    return { steer, throttle, brake, handbrake: 0, nitro, up: false, down: false, stuck: this.stuck };
  }
}
