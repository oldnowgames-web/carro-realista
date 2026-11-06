// musicUI.js — mini player (anterior / tocar-pausar / próxima / volume) e lista de faixas para a janela de opções.
import { S, setOpt, t } from './settings.js';
import { TRACKS, getState, nextTrack, prevTrack, togglePlay, selectTrack, seek, audioEl } from './music.js';

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  prev: svg('<path d="M6 6h2v12H6zM9.5 12 18 6v12z"/>'),
  next: svg('<path d="M16 6h2v12h-2zM6 18V6l8.5 6z"/>'),
  play: svg('<path d="M8 5v14l11-7z"/>'),
  pause: svg('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'),
  vol: svg('<path d="M3 9v6h4l5 4V5L7 9z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.2 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  mute: svg('<path d="M3 9v6h4l5 4V5L7 9z"/><path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  note: svg('<path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
};
export const titleOf = (i) => (TRACKS[i].title || t('musicTrack', TRACKS[i].n));
const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');

/** mini player: coloque num container vazio. opts.compact = sem barra de volume */
export function mountMiniPlayer(host, opts = {}) {
  host.classList.add('mplayer'); if (opts.compact) host.classList.add('compact');
  host.innerHTML = `
    <button class="mp-btn" data-a="prev" aria-label="${t('prevTrack')}" title="${t('prevTrack')}  ,">${ICON.prev}</button>
    <button class="mp-btn mp-play" data-a="play" aria-label="${t('playPause')}" title="${t('playPause')}  K"></button>
    <button class="mp-btn" data-a="next" aria-label="${t('nextTrack')}" title="${t('nextTrack')}  .">${ICON.next}</button>
    <div class="mp-info"><small class="mp-lab">${ICON.note}<span>${t('nowPlaying')}</span></small><b class="mp-title">—</b><i class="mp-bar"><u></u></i></div>
    <button class="mp-btn" data-a="mute" aria-label="${t('optMuteAll')}" title="${t('optMuteAll')}  M"></button>
    <input class="mp-vol" type="range" min="0" max="1" step="0.05" aria-label="${t('optMusicVol')}">`;
  const $ = (s) => host.querySelector(s), play = $('.mp-play'), mute = $('[data-a=mute]'), vol = $('.mp-vol'), bar = $('.mp-bar u'), ttl = $('.mp-title');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'prev') prevTrack(); else if (a === 'next') nextTrack(); else if (a === 'play') togglePlay(); else if (a === 'mute') setOpt('muteAll', !S.muteAll);
  });
  $('.mp-bar').addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); });
  vol.addEventListener('input', () => { if (S.muteAll) setOpt('muteAll', false); setOpt('music', +vol.value); });
  const sync = () => {
    const st = getState(); play.innerHTML = st.playing && S.musicOn && !st.allFailed ? ICON.pause : ICON.play;
    ttl.textContent = st.allFailed ? t('musicNone') : titleOf(st.cur); ttl.title = st.allFailed ? t('musicHelp') : '';
    host.classList.toggle('missing', st.allFailed);
    mute.innerHTML = S.muteAll ? ICON.mute : ICON.vol; vol.value = S.music; host.classList.toggle('muted', S.muteAll || !S.musicOn);
  };
  const tick = () => { const st = getState(); bar.style.width = st.dur ? (st.time / st.dur) * 100 + '%' : '0%'; };
  addEventListener('musicchange', sync); addEventListener('optionschange', sync); audioEl.addEventListener('timeupdate', tick);
  sync(); tick(); return { sync };
}

/** lista das 5 faixas (janela de opções) */
export function mountTrackList(host) {
  host.classList.add('tracklist');
  const render = () => {
    const st = getState();
    host.innerHTML = TRACKS.map((tr, i) => {
      const bad = st.avail[i] === false, on = i === st.cur;
      return `<button class="tl-row${on ? ' on' : ''}${bad ? ' bad' : ''}" data-i="${i}" ${bad ? 'disabled' : ''}>
        <span class="tl-n">${on && st.playing ? '<i class="eq"><b></b><b></b><b></b></i>' : tr.n}</span><span class="tl-t">${titleOf(i)}</span>
        <small>${bad ? t('musicMissing') : on ? `${fmt(st.time)} / ${fmt(st.dur)}` : ''}</small></button>`;
    }).join('') + `<p class="tl-help">${t('musicHelp')}</p>`;
  };
  host.addEventListener('click', (e) => { const b = e.target.closest('.tl-row'); if (b && !b.disabled) selectTrack(+b.dataset.i); });
  let lastSec = -1;
  audioEl.addEventListener('timeupdate', () => { const s = Math.floor(audioEl.currentTime); if (s !== lastSec && host.offsetParent) { lastSec = s; render(); } });
  addEventListener('musicchange', render); render();
  return { render };
}

/** teclas de música: , anterior · . próxima · K tocar/pausar · (opcional) M silenciar tudo */
export function bindMusicKeys({ mute = true, toast = null } = {}) {
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
    let m = null;
    if (e.code === 'Comma') { prevTrack(); m = 1; } else if (e.code === 'Period') { nextTrack(); m = 1; } else if (e.code === 'KeyK') { togglePlay(); m = 1; }
    else if (mute && e.code === 'KeyM') { setOpt('muteAll', !S.muteAll); if (toast) toast(S.muteAll ? t('tSoundOff') : t('tSoundOn')); return; }
    if (m && toast) setTimeout(() => { const st = getState(); toast('♪ ' + titleOf(st.cur) + (st.playing ? '' : '  ⏸')); }, 60);
  });
}
