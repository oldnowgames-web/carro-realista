// music.js — lista de músicas do jogo (sounds/music1 … music7) com troca de faixa, volume, aleatório e "continua de onde parou"
// ao trocar de página (menu → garagem → corrida).
//
// Coloque os arquivos na pasta sounds/ com os nomes music1.mp3, music2.mp3 … music7.mp3
// (também funcionam .ogg, .wav e .m4a). Para mudar o nome mostrado de cada música, edite TRACKS abaixo.
import { S, setOpt } from './settings.js';

export const TRACKS = [
  { n: 1, base: 'sounds/music1', title: 'Música 1' },
  { n: 2, base: 'sounds/music2', title: 'Música 2' },
  { n: 3, base: 'sounds/music3', title: 'Música 3' },
  { n: 4, base: 'sounds/music4', title: 'Música 4' },
  { n: 5, base: 'sounds/music5', title: 'Música 5' },
  { n: 6, base: 'sounds/music6', title: 'Música 6' },
  { n: 7, base: 'sounds/music7', title: 'Música 7' },
];
const EXTS = [['mp3', 'audio/mpeg'], ['ogg', 'audio/ogg'], ['wav', 'audio/wav'], ['m4a', 'audio/mp4']];
const KEY = 'music_v1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const audioEl = document.createElement('audio');
audioEl.preload = 'auto'; audioEl.volume = 0;
const avail = TRACKS.map(() => undefined);            // undefined = ainda não sabe · true = toca · false = arquivo não existe
let cur = 0, ctxName = 'menu', wantPlay = true, started = false, fade = 0, inited = false;
const emit = () => dispatchEvent(new CustomEvent('musicchange', { detail: getState() }));

export function getState() {
  return { cur, track: TRACKS[cur], playing: !audioEl.paused && !audioEl.ended, wantPlay, avail: avail.slice(), allFailed: avail.every((a) => a === false), time: audioEl.currentTime || 0, dur: audioEl.duration || 0 };
}
const ctxFactor = () => (ctxName === 'race' ? (S.musicRace ? 0.55 : 0) : 1);
const target = () => (S.muteAll || !S.musicOn ? 0 : clamp(S.volume * S.music * ctxFactor(), 0, 1));

function save() { try { localStorage.setItem(KEY, JSON.stringify({ cur, t: audioEl.currentTime || 0, play: wantPlay, ts: Date.now() })); } catch {} }

function load(i, t = 0) {
  cur = (i + TRACKS.length) % TRACKS.length;
  audioEl.pause(); audioEl.innerHTML = ''; audioEl.removeAttribute('src'); audioEl.loop = !!S.repeatOne;
  const tr = TRACKS[cur];
  EXTS.forEach(([ext, type], k) => {
    const so = document.createElement('source'); so.src = `${tr.base}.${ext}`; so.type = type;
    if (k === EXTS.length - 1) so.addEventListener('error', () => { avail[cur] = false; emit(); if (wantPlay && !avail.every((a) => a === false)) step(1, true); });
    audioEl.appendChild(so);
  });
  const onMeta = () => { avail[cur] = true; if (t > 0 && isFinite(audioEl.duration) && t < audioEl.duration - 1) { try { audioEl.currentTime = t; } catch {} } emit(); };
  audioEl.addEventListener('loadedmetadata', onMeta, { once: true });
  audioEl.load(); emit();
}
function tryPlay() {
  if (!wantPlay || target() <= 0 && ctxName === 'race' && !S.musicRace) return;
  const p = audioEl.play(); if (p && p.catch) p.catch(() => {});
}
/** próxima faixa que existe (ou aleatória). dir = +1 / -1 */
function step(dir = 1, auto = false) {
  const n = TRACKS.length; let i = cur;
  const ok = (k) => avail[k] !== false;
  if (S.shuffle && dir > 0) { const c = TRACKS.map((_, k) => k).filter((k) => k !== cur && ok(k)); if (c.length) i = c[(Math.random() * c.length) | 0]; else i = cur; }
  else for (let k = 1; k <= n; k++) { const j = (cur + dir * k + n * 8) % n; if (ok(j)) { i = j; break; } }
  load(i, 0); if (wantPlay || auto) { wantPlay = true; tryPlay(); }
}

export const nextTrack = () => { wantPlay = true; step(1); save(); };
export const prevTrack = () => { if (audioEl.currentTime > 4) { audioEl.currentTime = 0; return; } wantPlay = true; step(-1); save(); };
export function selectTrack(i) { wantPlay = true; if (i === cur && !audioEl.paused) { audioEl.currentTime = 0; return; } load(i, 0); tryPlay(); save(); }
export function togglePlay() {
  if (audioEl.paused) { wantPlay = true; if (!S.musicOn) setOpt('musicOn', true); if (avail[cur] === false) step(1, true); else tryPlay(); }
  else { wantPlay = false; audioEl.pause(); }
  emit(); save();
}
export function seek(frac) { if (isFinite(audioEl.duration)) audioEl.currentTime = clamp(frac, 0, 1) * audioEl.duration; }
export function setContext(name) { if (name === ctxName) return; ctxName = name; apply(); if (target() > 0 && wantPlay) tryPlay(); }

let cv = 0;                                           // volume atual (sobe/desce suave)
function apply() {
  if (!S.musicOn) { if (!audioEl.paused) audioEl.pause(); emit(); return; }
  if (wantPlay && audioEl.paused && started) tryPlay();
  audioEl.loop = !!S.repeatOne;
}
setInterval(() => {                                    // suaviza o volume (fade) e guarda a posição
  const tg = target(); cv += (tg - cv) * 0.18; if (Math.abs(tg - cv) < 0.002) cv = tg;
  audioEl.volume = clamp(Math.pow(cv, 1.35), 0, 1);
  if (ctxName === 'race' && !S.musicRace && !audioEl.paused) audioEl.pause();
  if (!audioEl.paused && ++fade % 20 === 0) save();
}, 50);

export function initMusic(context = 'menu') {
  ctxName = context;
  if (inited) { apply(); return; } inited = true;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const fresh = saved && Date.now() - saved.ts < 120000;            // veio de outra página do jogo há pouco: continua de onde parou
  wantPlay = fresh ? saved.play !== false : true;
  load(saved && Number.isInteger(saved.cur) ? saved.cur : 0, fresh ? saved.t : 0);
  cv = 0;
  // navegadores só deixam tocar depois de um clique/tecla: tenta já, e tenta de novo no primeiro gesto
  const go = () => { started = true; if (wantPlay && S.musicOn && audioEl.paused) tryPlay(); };
  audioEl.addEventListener('playing', () => { started = true; emit(); });
  audioEl.addEventListener('pause', emit);
  audioEl.addEventListener('ended', () => { if (!audioEl.loop) step(1, true); });
  started = true; tryPlay();
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, go, { passive: true });
  addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  addEventListener('optionschange', (e) => { if (['volume', 'music', 'muteAll', 'musicOn', 'musicRace', 'repeatOne', 'shuffle'].includes(e.detail)) { apply(); if (e.detail === 'musicOn' && S.musicOn && wantPlay) tryPlay(); } });
}
