// optionsUI.js — janela de opções reutilizável (menu, garagem e pausa do jogo), com abas: Som · Gráficos · Controles · Geral.
import { S, DEFAULTS, setOpt, t, applyI18n } from './settings.js';
import { mountMiniPlayer, mountTrackList } from './musicUI.js';

let dlg = null, tab = 'sound';
const row = (label, ctrl, cls = '') => `<label class="orow ${cls}"><span data-i18n="${label}"></span>${ctrl}</label>`;
const sel = (id, opts) => `<select id="${id}">${opts.map(([v, k]) => `<option value="${v}" data-i18n="${k}"></option>`).join('')}</select>`;
const rng = (id, min, max, step, pct = false) => `<span class="rngw"><input type="range" id="${id}" min="${min}" max="${max}" step="${step}"><output data-for="${id}" ${pct ? 'data-pct' : ''}></output></span>`;
const chk = (id) => `<span class="tgl"><input type="checkbox" id="${id}"><i></i></span>`;
const TABS = [['sound', 'tabSound'], ['graphics', 'tabGraphics'], ['controls', 'tabControls'], ['general', 'tabGeneral']];

function build() {
  dlg = document.createElement('div'); dlg.className = 'optov';
  dlg.innerHTML = `<div class="optcard" role="dialog" aria-modal="true" aria-labelledby="optTitle">
    <header><h2 id="optTitle" data-i18n="options"></h2><button class="x" id="oX" aria-label="Fechar">×</button></header>
    <nav class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" data-i18n="${l}"></button>`).join('')}</nav>
    <div class="panes">
      <section data-pane="sound">
        <h3 data-i18n="optSecVolume"></h3>
        ${row('optMasterVol', rng('oVolume', 0, 1, 0.05, true))}
        ${row('optMusicVol', rng('oMusic', 0, 1, 0.05, true))}
        ${row('optSfx', rng('oSfx', 0, 1, 0.05, true))}
        ${row('optMuteAll', chk('oMuteAll'))}
        <h3 data-i18n="optSecMusic"></h3>
        <div id="oPlayer"></div>
        <div id="oTracks"></div>
        ${row('optMusicOn', chk('oMusicOn'))}
        ${row('optMusicRace', chk('oMusicRace'))}
        ${row('optShuffle', chk('oShuffle'))}
        ${row('optRepeatOne', chk('oRepeat'))}
      </section>
      <section data-pane="graphics">
        <h3 data-i18n="optGraphics"></h3>
        ${row('optQuality', sel('oQuality', [['auto', 'qAuto'], ['low', 'qLow'], ['med', 'qMed'], ['high', 'qHigh']]))}
        ${row('optTrees', rng('oTrees', 0.5, 1.2, 0.05))}
        ${row('optMirror', chk('oMirror'))}
        ${row('optDamage', chk('oDamage'))}
        ${row('optFx', chk('oFx'))}
        ${row('optCycle', sel('oCycle', [['off', 'cycOff'], ['slow', 'cycSlow'], ['fast', 'cycFast']]))}
      </section>
      <section data-pane="controls">
        <h3 data-i18n="optControls"></h3>
        ${row('optSteer', rng('oSteer', 0.6, 1.4, 0.05))}
        ${row('optAuto', chk('oAuto'))}
        ${row('optAbs', chk('oAbs'))}
        ${row('optTc', chk('oTc'))}
        ${row('optStab', sel('oStab', [['0', 'off'], ['0.3', 'normal'], ['0.6', 'hard']]))}
        ${row('optArcade', chk('oArcade'))}
        ${row('optCorner', chk('oCorner'))}
        <details><summary data-i18n="keysTitle"></summary><p class="keys2" id="oKeys"></p></details>
      </section>
      <section data-pane="general">
        <h3 data-i18n="tabGeneral"></h3>
        ${row('optUnits', sel('oUnits', [['kmh', 'normal'], ['mph', 'normal']]))}
        ${row('optLang', `<select id="oLang"><option value="pt">Português</option><option value="en">English</option></select>`)}
        <div class="orow"><span></span><button class="ghost" id="oReset" data-i18n="resetOpts"></button></div>
      </section>
    </div>
    <footer><button class="pri" id="oClose" data-i18n="close"></button></footer>
  </div>`;
  document.body.appendChild(dlg);
  const $ = (id) => dlg.querySelector('#' + id);
  const bind = (id, key, get) => { const el = $(id); el.addEventListener('input', () => setOpt(key, get(el))); return el; };
  bind('oQuality', 'quality', (e) => e.value); bind('oTrees', 'treeRange', (e) => +e.value); bind('oMirror', 'mirror', (e) => e.checked); bind('oDamage', 'damageHud', (e) => e.checked); bind('oFx', 'fx', (e) => e.checked);
  bind('oCycle', 'cycle', (e) => e.value); bind('oVolume', 'volume', (e) => +e.value); bind('oMusic', 'music', (e) => +e.value); bind('oSfx', 'sfx', (e) => +e.value); bind('oSteer', 'steerSens', (e) => +e.value);
  bind('oMuteAll', 'muteAll', (e) => e.checked); bind('oMusicOn', 'musicOn', (e) => e.checked); bind('oMusicRace', 'musicRace', (e) => e.checked); bind('oShuffle', 'shuffle', (e) => e.checked); bind('oRepeat', 'repeatOne', (e) => e.checked);
  bind('oAuto', 'autoGear', (e) => e.checked); bind('oAbs', 'abs', (e) => e.checked); bind('oTc', 'tc', (e) => e.checked); bind('oStab', 'stab', (e) => +e.value); bind('oCorner', 'cornerAssist', (e) => e.checked); bind('oArcade', 'arcade', (e) => e.checked);
  bind('oUnits', 'units', (e) => e.value); bind('oLang', 'lang', (e) => e.value);
  mountMiniPlayer($('oPlayer')); mountTrackList($('oTracks'));
  $('oClose').onclick = closeOptions; $('oX').onclick = closeOptions;
  $('oReset').onclick = () => { for (const k of Object.keys(DEFAULTS)) if (k !== 'lang') setOpt(k, DEFAULTS[k]); sync(); };
  dlg.addEventListener('mousedown', (e) => { if (e.target === dlg) closeOptions(); });
  dlg.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
  dlg.querySelector('.tabs').addEventListener('keydown', (e) => { if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const i = TABS.findIndex(([k]) => k === tab), n = TABS[(i + (e.code === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0]; setTab(n); dlg.querySelector(`[data-tab=${n}]`).focus(); e.preventDefault(); } });
  addEventListener('keydown', (e) => { if (e.code === 'Escape' && dlg.classList.contains('on')) { e.stopPropagation(); closeOptions(); } }, true);
  addEventListener('optionschange', (e) => { if (e.detail === 'lang') { $('oKeys').textContent = t('keysList'); fixLabels(); } if (dlg.classList.contains('on')) outputs(); });
}
function setTab(k) { tab = k; dlg.querySelectorAll('[data-tab]').forEach((b) => { const on = b.dataset.tab === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); dlg.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== k; }); }
function outputs() { dlg.querySelectorAll('output').forEach((o) => { const el = dlg.querySelector('#' + o.dataset.for), v = +el.value; o.textContent = 'pct' in o.dataset ? Math.round(v * 100) + '%' : v.toFixed(2).replace(/0$/, ''); el.style.setProperty('--p', ((v - el.min) / (el.max - el.min)) * 100 + '%'); }); }
function sync() {
  const $ = (id) => dlg.querySelector('#' + id);
  $('oQuality').value = S.quality; $('oTrees').value = S.treeRange; $('oMirror').checked = S.mirror; $('oDamage').checked = S.damageHud; $('oFx').checked = S.fx; $('oCycle').value = S.cycle;
  $('oVolume').value = S.volume; $('oMusic').value = S.music; $('oSfx').value = S.sfx; $('oMuteAll').checked = S.muteAll; $('oMusicOn').checked = S.musicOn; $('oMusicRace').checked = S.musicRace; $('oShuffle').checked = S.shuffle; $('oRepeat').checked = S.repeatOne;
  $('oSteer').value = S.steerSens; $('oAuto').checked = S.autoGear; $('oAbs').checked = S.abs; $('oTc').checked = S.tc;
  $('oStab').value = String(S.stab); $('oCorner').checked = S.cornerAssist; $('oArcade').checked = S.arcade; $('oUnits').value = S.units; $('oLang').value = S.lang; $('oKeys').textContent = t('keysList'); outputs();
}
function fixLabels() { const $ = (id) => dlg.querySelector('#' + id); ['0', '0.3', '0.6'].forEach((v, i) => { $('oStab').options[i].textContent = v; }); $('oUnits').options[0].textContent = 'km/h'; $('oUnits').options[1].textContent = 'mph'; }
export function openOptions(startTab) { if (!dlg) build(); applyI18n(dlg); fixLabels(); sync(); setTab(typeof startTab === 'string' ? startTab : tab); dlg.classList.add('on'); dlg.querySelector('[aria-selected=true]').focus(); }
export function closeOptions() { if (dlg) dlg.classList.remove('on'); }
export const optionsOpen = () => !!dlg && dlg.classList.contains('on');
