// hero.js — carro 3D da tela inicial: um carro de cada vez entra rodando, "posa" girando de leve e sai, dando lugar ao próximo.
import * as THREE from 'three';
import { CAR_LIST } from './carData.js';
import { loadGLB, buildCar } from './carModel.js';
import { buildEnvScene } from './envScene.js';

const COLS = ['#e8590c', '#b3121b', '#1456f0', '#f2b705', '#7bc618', '#2ec4d6', '#e5397a', '#f3f1ec', '#6a2c9c', '#14213d'];
const ease = { out: (p) => 1 - Math.pow(1 - p, 3), in: (p) => p * p * p, io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2) };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a) => a[(Math.random() * a.length) | 0];

export async function startHero(canvas, { onCar } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setClearColor(0x000000, 0); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(buildEnvScene(), 0.02).texture; pm.dispose();

  const key = new THREE.DirectionalLight(0xffe2c2, 2.4); key.position.set(-5, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a3a, 2.2); rim.position.set(6, 3, -6); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x5cc8d8, 1.4); rim2.position.set(-6, 2, -5); scene.add(rim2);
  scene.add(new THREE.HemisphereLight(0x6fa0b0, 0x1a1008, 0.5));

  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 100); cam.position.set(0, 1.25, 13);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
    map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })(),
    transparent: true, depthWrite: false }));
  blob.position.y = 0.01; scene.add(blob);

  const cache = new Map();
  const make = async (cfg) => {
    if (!cache.has(cfg.id)) cache.set(cfg.id, loadGLB(cfg.file, r));
    const car = buildCar(await cache.get(cfg.id), cfg);
    car.setColor(rnd(COLS)); car.setFinish(rnd(['gloss', 'gloss', 'satin']));
    car.beams.forEach((b) => { b.intensity = 0; });                           // sem spots (mais leve); faróis só "acesos" no material
    car.headMats.forEach((m) => { m.emissiveIntensity = 3.2; }); car.tailMats.forEach((m) => { m.emissiveIntensity = 2.2; });
    return car;
  };

  const order = CAR_LIST.map((c) => c).sort(() => Math.random() - 0.5);
  let idx = 0, cur = null, next = null, nextP = null, t = 0, state = 'in', st = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
  const IDLE_X = 1.1, FROM = 9.5, YAW_IDLE = -0.62, YAW_RUN = -1.5708, T_IN = 2.4, T_IDLE = 6.5, T_OUT = 1.7;

  const place = (car, x, yaw, speed, dt) => {
    car.object.position.set(x, 0, 0); car.object.rotation.y = yaw;
    car.update(dt, { speed, steer: 0, pitch: 0, roll: 0, heat: 0 });
    blob.position.x = x; blob.rotation.y = yaw; blob.scale.set(car.dims.width * 2.0, 1, car.dims.length * 1.5);
  };
  const preload = () => { const cfg = order[(idx + 1) % order.length]; nextP = make(cfg).then((c) => { next = { car: c, cfg }; }).catch(() => { next = null; }); };
  const resize = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w / h < 0.9 ? 40 : 24; cam.updateProjectionMatrix();
    cam.position.z = w / h < 0.9 ? 13.5 : 13;
  };
  addEventListener('resize', resize); resize();
  addEventListener('pointermove', (e) => { tmx = (e.clientX / innerWidth) * 2 - 1; tmy = (e.clientY / innerHeight) * 2 - 1; });

  const first = order[0]; const c0 = await make(first); cur = { car: c0, cfg: first }; scene.add(c0.object); onCar && onCar(first, c0); preload();
  const lowW = () => (cam.aspect < 0.9);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now(), run = true;
  const loop = (now) => {
    if (!run) return; requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; st += dt;
    mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
    const xi = lowW() ? 0 : IDLE_X, car = cur.car, rr = car.dims.wheelRadius || 0.34;
    if (state === 'in') {
      const p = clamp(st / T_IN, 0, 1), e = ease.out(p), v = 3 * Math.pow(1 - p, 2) * (FROM / T_IN);       // velocidade (derivada de out-cubic)
      place(car, xi + (1 - e) * FROM, YAW_RUN + (YAW_IDLE - YAW_RUN) * ease.io(clamp((p - 0.25) / 0.75, 0, 1)), v, dt);
      if (p >= 1) { state = 'idle'; st = 0; }
    } else if (state === 'idle') {
      const yaw = YAW_IDLE + Math.sin(t * 0.5) * 0.16 + mx * 0.18;
      place(car, xi + Math.sin(t * 0.35) * 0.15, reduce ? YAW_IDLE : yaw, 0, dt);
      if (st > T_IDLE && next) { state = 'out'; st = 0; }
    } else {
      const p = clamp(st / T_OUT, 0, 1), e = ease.in(p), v = 3 * p * p * ((FROM + xi + 4) / T_OUT);
      place(car, xi - e * (FROM + xi + 4), YAW_IDLE + (YAW_RUN - YAW_IDLE) * ease.io(clamp(p / 0.35, 0, 1)), v, dt);
      if (p >= 1) {
        scene.remove(car.object); idx = (idx + 1) % order.length; cur = next; next = null; scene.add(cur.car.object); state = 'in'; st = 0; onCar && onCar(cur.cfg, cur.car); preload();
      }
    }
    cam.position.x = mx * 0.35; cam.position.y = 1.25 - my * 0.18; cam.lookAt(IDLE_X * 0.35, 1.75, 0);
    r.render(scene, cam);
  };
  requestAnimationFrame(loop);
  return { stop() { run = false; }, leave() { st = 0; state = 'out'; if (!next) next = { car: cur.car, cfg: cur.cfg }; } };
}
