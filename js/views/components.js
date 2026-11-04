// Wiederverwendbare UI-Bausteine.
import { esc } from '../util.js';
import { MUSCLES, MUSCLE_ICON, EQUIPMENT, findExercise } from '../data/exercises.js';

// Stilisierte Körperkarte (vorne/hinten). on: Set der aktiven Muskeln
export function bodyMap(on = new Set(), cls = 'on') {
  const m = (id, shape) => shape.replace(/^<(\w+)/, `<$1 data-m="${id}" class="m ${on.has(id) ? cls : ''}"`);
  const front = `
  <svg viewBox="0 0 120 240" aria-label="Vorderseite">
    <circle cx="60" cy="20" r="14" class="head"/>
    ${m('schultern', '<ellipse cx="34" cy="52" rx="11" ry="9"/>')}
    ${m('schultern', '<ellipse cx="86" cy="52" rx="11" ry="9"/>')}
    ${m('brust', '<rect x="40" y="46" width="40" height="24" rx="8"/>')}
    ${m('bizeps', '<rect x="20" y="62" width="12" height="30" rx="6"/>')}
    ${m('bizeps', '<rect x="88" y="62" width="12" height="30" rx="6"/>')}
    ${m('bauch', '<rect x="44" y="73" width="32" height="40" rx="7"/>')}
    <rect x="16" y="95" width="10" height="30" rx="5" class="head"/>
    <rect x="94" y="95" width="10" height="30" rx="5" class="head"/>
    ${m('quads', '<rect x="40" y="118" width="18" height="54" rx="8"/>')}
    ${m('quads', '<rect x="62" y="118" width="18" height="54" rx="8"/>')}
    ${m('waden', '<rect x="42" y="178" width="14" height="44" rx="7"/>')}
    ${m('waden', '<rect x="64" y="178" width="14" height="44" rx="7"/>')}
  </svg>`;
  const back = `
  <svg viewBox="0 0 120 240" aria-label="Rückseite">
    <circle cx="60" cy="20" r="14" class="head"/>
    ${m('schultern', '<ellipse cx="34" cy="52" rx="11" ry="9"/>')}
    ${m('schultern', '<ellipse cx="86" cy="52" rx="11" ry="9"/>')}
    ${m('ruecken', '<path d="M40 44 L80 44 L76 86 L44 86 Z"/>')}
    ${m('trizeps', '<rect x="20" y="62" width="12" height="30" rx="6"/>')}
    ${m('trizeps', '<rect x="88" y="62" width="12" height="30" rx="6"/>')}
    ${m('lowback', '<rect x="46" y="89" width="28" height="20" rx="6"/>')}
    <rect x="16" y="95" width="10" height="30" rx="5" class="head"/>
    <rect x="94" y="95" width="10" height="30" rx="5" class="head"/>
    ${m('gluteus', '<rect x="40" y="111" width="40" height="24" rx="10"/>')}
    ${m('hamstrings', '<rect x="40" y="138" width="18" height="36" rx="8"/>')}
    ${m('hamstrings', '<rect x="62" y="138" width="18" height="36" rx="8"/>')}
    ${m('waden', '<rect x="42" y="178" width="14" height="44" rx="7"/>')}
    ${m('waden', '<rect x="64" y="178" width="14" height="44" rx="7"/>')}
  </svg>`;
  return `<div class="bodymap">${front}${back}</div>`;
}

export function exThumb(ex) {
  return `<div class="thumb">${MUSCLE_ICON[ex?.muscle] || '🏋'}</div>`;
}

export function exMeta(ex) {
  if (!ex) return '';
  return `${MUSCLES[ex.muscle] || ''} · ${ex.equip.map((e) => EQUIPMENT[e]).join(', ')}`;
}

export function exName(id, custom) {
  return findExercise(id, custom)?.name || 'Unbekannte Übung';
}

export function topbar(title, { back = null, right = '' } = {}) {
  return `<div class="topbar">
    ${back ? `<a class="icon-btn" href="${esc(back)}" aria-label="Zurück">‹</a>` : ''}
    <h1 style="${back ? 'font-size:22px' : ''}">${esc(title)}</h1>
    ${right}
  </div>`;
}

export function option({ value, label, sub = '', emo = '', on = false, tag = '', attr = 'data-v' }) {
  return `<button class="opt ${on ? 'on' : ''}" ${attr}="${esc(value)}">
    ${emo ? `<span class="emo">${emo}</span>` : ''}
    <span><b>${esc(label)}</b>${sub ? `<small class="muted">${esc(sub)}</small>` : ''}</span>
    ${tag ? `<span class="badge accent tag">${esc(tag)}</span>` : ''}
  </button>`;
}

export function toggle(name, checked) {
  return `<label class="toggle"><input type="checkbox" name="${esc(name)}" ${checked ? 'checked' : ''}><span></span></label>`;
}
