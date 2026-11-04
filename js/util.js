// Kleine Helfer: Escaping, Datum, Formatierung, Overlays, Diagramme, Ton.

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const round = (v, step = 1) => Math.round(v / step) * step;

// ---------- Datum ----------
export const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export function dateKey(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export const todayKey = () => dateKey(new Date());

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Montag der Woche, in der d liegt
export function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7;
  return addDays(x, -diff);
}

export function fmtDate(key) {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`;
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtNum(v, digits = 0) {
  return Number(v || 0).toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function age(birthday) {
  if (!birthday) return 30;
  const b = new Date(birthday);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

// ---------- Overlays ----------
const root = () => document.getElementById('overlay-root');

// Öffnet ein Bottom-Sheet. mount(el, close) bindet Events. Gibt close() zurück.
export function sheet(html, mount, { tall = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-backdrop';
  wrap.innerHTML = `<div class="sheet ${tall ? 'tall' : ''}" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  root().appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 220);
  };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) close();
    if (e.target.closest('[data-close]')) close();
  });
  mount?.(wrap.querySelector('.sheet'), close);
  return close;
}

export function confirmDialog(text, { ok = 'Ja', cancel = 'Abbrechen', danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const close = sheet(
      `<p class="dialog-text">${esc(text)}</p>
       <div class="row gap">
         <button class="btn ghost grow" data-a="no">${esc(cancel)}</button>
         <button class="btn ${danger ? 'danger' : 'primary'} grow" data-a="yes">${esc(ok)}</button>
       </div>`,
      (el, close) => {
        el.addEventListener('click', (e) => {
          const a = e.target.closest('[data-a]')?.dataset.a;
          if (!a) return;
          answered = true;
          resolve(a === 'yes');
          close();
        });
      }
    );
    // Schließen über Backdrop = Nein
    setTimeout(() => {
      const bd = root().lastElementChild;
      bd?.addEventListener('click', (e) => {
        if (e.target === bd && !answered) resolve(false);
      });
    });
    return close;
  });
}

export function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  root().appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

// ---------- Ton ----------
let audioCtx;
export function beep(times = 1) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 880;
      o.connect(g);
      g.connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      o.start(t0);
      o.stop(t0 + 0.3);
    }
  } catch {
    /* Audio nicht verfügbar */
  }
  navigator.vibrate?.(200);
}

// iOS erlaubt Audio erst nach einer Nutzeraktion – einmal entsperren.
export function unlockAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* ignorieren */
  }
}

// ---------- Bildschirm wach halten ----------
let wakeLock = null;
export async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => (wakeLock = null));
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    /* nicht unterstützt */
  }
}

// ---------- Diagramme (SVG) ----------
// points: [{ label, value }]
export function lineChart(points, { height = 160, unit = '', goal = null, digits = 1 } = {}) {
  const pts = points.filter((p) => p.value != null && !Number.isNaN(p.value));
  if (pts.length < 2) return `<div class="chart-empty">Noch zu wenige Daten für ein Diagramm.</div>`;
  const W = 320, H = height, P = 26;
  const vals = pts.map((p) => p.value).concat(goal != null ? [goal] : []);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;
  const x = (i) => P + (i * (W - P * 1.5)) / (pts.length - 1);
  const y = (v) => H - P - ((v - min) / (max - min)) * (H - P * 1.8);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${d} L${x(pts.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const step = Math.ceil(pts.length / 6);
  const labels = pts
    .map((p, i) => (i % step === 0 || i === pts.length - 1 ? `<text x="${x(i)}" y="${H - 6}" class="ax" text-anchor="middle">${esc(p.label)}</text>` : ''))
    .join('');
  const last = pts[pts.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">
    <text x="4" y="${y(max - pad) + 4}" class="ax">${fmtNum(max - pad, digits)}</text>
    <text x="4" y="${y(min + pad) + 4}" class="ax">${fmtNum(min + pad, digits)}</text>
    ${goal != null ? `<line x1="${P}" x2="${W - 6}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/>` : ''}
    <path d="${area}" class="area"/>
    <path d="${d}" class="line"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="2.6" class="dot"/>`).join('')}
    <text x="${x(pts.length - 1)}" y="${y(last.value) - 8}" class="val" text-anchor="end">${fmtNum(last.value, digits)}${esc(unit)}</text>
    ${labels}
  </svg>`;
}

export function barChart(points, { height = 160, goal = null, unit = '' } = {}) {
  if (!points.length) return `<div class="chart-empty">Noch keine Daten.</div>`;
  const W = 320, H = height, P = 22;
  const max = Math.max(1, ...points.map((p) => p.value || 0), goal || 0) * 1.1;
  const bw = (W - P) / points.length;
  const y = (v) => H - P - (v / max) * (H - P * 1.6);
  const bars = points
    .map((p, i) => {
      const h = H - P - y(p.value || 0);
      const over = goal != null && p.value > goal;
      return `<rect x="${P / 2 + i * bw + bw * 0.18}" y="${y(p.value || 0)}" width="${bw * 0.64}" height="${Math.max(0, h)}" rx="4" class="bar ${over ? 'over' : ''}"><title>${fmtNum(p.value)}${esc(unit)}</title></rect>
      <text x="${P / 2 + i * bw + bw / 2}" y="${H - 6}" class="ax" text-anchor="middle">${esc(p.label)}</text>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">
    ${goal != null ? `<line x1="4" x2="${W - 4}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/><text x="${W - 4}" y="${y(goal) - 4}" class="ax" text-anchor="end">Ziel ${fmtNum(goal)}</text>` : ''}
    ${bars}
  </svg>`;
}

// Fortschrittsring
export function ring(value, max, { size = 120, label = '', sub = '' } = {}) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const pct = clamp(max ? value / max : 0, 0, 1);
  const over = max && value > max;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="ring">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg ${over ? 'over' : ''}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="48%" text-anchor="middle" class="ring-val">${esc(label)}</text>
    <text x="50%" y="64%" text-anchor="middle" class="ring-sub">${esc(sub)}</text>
  </svg>`;
}

export function bar(value, max, cls = '') {
  const pct = clamp(max ? (value / max) * 100 : 0, 0, 100);
  return `<div class="pbar ${cls}"><div style="width:${pct}%"></div></div>`;
}
