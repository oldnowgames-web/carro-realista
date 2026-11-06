// preview.js — mostra o mundo de um mapa SEM carros: usado no quadro do mapa na tela de modos (modo.html).
//   preview.html?pista=ID            → voo suave pela pista (mapa "ao vivo")
//   preview.html?pista=ID&cap=1      → tira uma foto do mapa e envia ao menu (postMessage) / baixa o arquivo (se estiver sozinha)
// Parâmetros: ui=0 (sem texto), lite=1 (terreno e mata mais leves), w/h (tamanho da foto), u (posição na pista 0..1)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './worldBuilder.js';
import { TRACKS } from './trackBuilder.js';
import { FX } from './fxShared.js';
import { clamp } from './noise.js';

const Q = new URLSearchParams(location.search), CAP = Q.get('cap') === '1', LITE = Q.get('lite') === '1';
const id = TRACKS.some((t) => t.id === Q.get('pista')) ? Q.get('pista') : TRACKS[0].id, msg = document.getElementById('msg');
const post = (o) => { try { parent !== window && parent.postMessage({ ...o, id }, '*'); } catch {} };
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: CAP, powerPreference: 'high-performance' });
const PR = CAP ? 1 : Math.min(devicePixelRatio || 1, LITE ? 1 : 1.5);
renderer.setPixelRatio(PR); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(CAP ? 58 : 62, 1, 0.25, 6000); scene.add(camera);
const CW = CAP ? +Q.get('w') || 960 : innerWidth, CH = CAP ? +Q.get('h') || 540 : innerHeight;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: CAP ? 4 : 0 });
const composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(4, 4), 0.1, 0.35, 1.5)); composer.addPass(new OutputPass());
function resize() { const w = CAP ? CW : innerWidth, h = CAP ? CH : innerHeight; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const W = await buildWorld({ scene, renderer, camera, density: LITE ? 0.4 : 0.8, trackId: id, lite: LITE, say: async (t) => { if (msg) msg.textContent = t; } });
const { track, veg, sw, theme } = W, S = track.S, N = track.N;
Object.assign(veg, { range: 300, farRange: 520, rockRange: 520, pebbleRange: 90, grassRange: LITE ? 0 : 70, grassOn: !LITE }); veg._last.t = -1;
sw.themeExp = theme.expose || 1; sw.setPreset(theme.sky || 'manha');
if (theme.weather && theme.weather.rain) sw.setRain(true);
if (theme.weather && theme.weather.snow) sw.setSnow(theme.weather.snow);
sw.rain = sw.rainTarget; sw.wet = sw.rainTarget; sw.snow = sw.snowTarget; sw.cycPaused = true;   // já começa chovendo/nevando
W.applyWet(sw.wet);

// câmera: ponto da pista (u), lateral (side), altura (h), olhando `look` metros à frente
const shot = Object.assign({ u: 0.04, side: 0, h: 2.2, look: 80, aimSide: 0 }, theme.shot, Q.get('u') ? { u: +Q.get('u') } : {});
const _p = new THREE.Vector3(), _l = new THREE.Vector3();
function aim(u, time) {
  const f = ((u % 1) + 1) % 1 * N, i0 = Math.floor(f) % N, t = f - Math.floor(f), a = S[i0], b = S[(i0 + 1) % N];
  const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = a.y + (b.y - a.y) * t, k = Math.round(shot.look / track.ds), c = S[(i0 + k) % N];
  const side = shot.side + (time ? Math.sin(time * 0.35) * 2.2 : 0), h = shot.h + (time ? 1.3 + Math.sin(time * 0.5) * 1.1 : 0);
  _p.set(x + a.nx * side, y + h, z + a.nz * side); camera.position.copy(_p);
  _l.set(c.x + c.nx * (shot.aimSide - side * 0.2), c.y + 1.4, c.z + c.nz * (shot.aimSide - side * 0.2)); camera.lookAt(_l);
}
let time = 0, frame = 0, ready = false, last = performance.now(), u = shot.u;
function draw(dt) {
  time += dt; FX.time.value = time; FX.cloud.value = clamp(sw.P.sunI / 2.8, 0, 1) * (1 - sw.rain) * 0.9;
  sw.update(dt, time); aim(u, CAP ? 0 : time); sw.follow(camera.position); W.props.update(renderer.getPixelRatio()); veg.update(camera, time, sw.wind);
  composer.render(dt);
}
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!CAP) { u += dt * 26 / track.length; }
  draw(dt); frame++;
  if (!ready && frame >= 3) { ready = true; if (msg) msg.textContent = ''; post({ type: 'preview-ready' }); }
  if (CAP) {
    if (frame < 6) return requestAnimationFrame(loop);
    const data = canvas.toDataURL('image/jpeg', 0.86); window.__shot = data; post({ type: 'preview-shot', data });
    if (parent === window && Q.get('save') !== '0') { const a = document.createElement('a'); a.href = data; a.download = id + '.jpg'; a.click(); }
    return;
  }
  requestAnimationFrame(loop);
}
addEventListener('message', (e) => { if (e.data && e.data.type === 'stop') renderer.setAnimationLoop(null); });
requestAnimationFrame(loop);
