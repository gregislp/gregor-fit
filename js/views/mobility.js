// Mobility: Routinen mit geführtem Timer und Beweglichkeits-Selbsttests.
import * as store from '../store.js';
import { esc, sheet, toast, uid, todayKey, fmtDate, fmtDuration, fmtNum, beep, keepAwake, lineChart, confirmDialog } from '../util.js';
import { ROUTINES, findRoutine, findMobility, routineSeconds, TESTS } from '../data/mobility.js';
import { topbar } from './components.js';
import { modeTabs } from './training.js';
import { go, rerender } from '../app.js';

export function recommendedRoutine(s) {
  const p = s.profile;
  if (p.work === 'sitzend') return findRoutine('schreibtisch');
  if ((p.pain || []).includes('lowback')) return findRoutine('ruecken');
  if ((p.pain || []).includes('schulter')) return findRoutine('schulter');
  if ((p.pain || []).includes('huefte')) return findRoutine('huefte');
  return findRoutine('morgen');
}

export default function mobility(el) {
  const s = store.get();
  const rec = recommendedRoutine(s);
  el.innerHTML = `
    ${topbar('Training')}
    ${modeTabs('mobility')}
    <div class="card hero click" data-r="${rec.id}">
      <div class="kicker">Empfohlen für dich</div>
      <h2 class="mt">${rec.icon} ${esc(rec.name)}</h2>
      <p class="muted mt">${esc(rec.desc)} · ${Math.round(routineSeconds(rec) / 60)} min</p>
      <button class="btn primary small mt">▶ Starten</button>
    </div>
    <div class="section-title"><h2>Routinen</h2></div>
    <div class="list">${ROUTINES.map((r) => `<div class="list-item" data-r="${r.id}"><div class="thumb">${r.icon}</div><div class="meta"><b>${esc(r.name)}</b><small>${esc(r.desc)} · ${Math.round(routineSeconds(r) / 60)} min</small></div><span class="chev">›</span></div>`).join('')}</div>

    <div class="section-title"><h2>Beweglichkeits-Tests</h2></div>
    <p class="muted" style="margin:-4px 0 10px;font-size:14px">Miss regelmäßig nach und sieh deinen Fortschritt.</p>
    <div class="list">${TESTS.map((t) => {
      const last = s.mobilityTests.filter((x) => x.test === t.id).at(-1);
      return `<div class="list-item" data-t="${t.id}"><div class="thumb">📏</div><div class="meta"><b>${esc(t.name)}</b><small>${last ? `Zuletzt: ${fmtNum(last.value, 1)} ${t.unit} (${fmtDate(last.date)})` : 'Noch nicht gemessen'}</small></div><span class="chev">›</span></div>`;
    }).join('')}</div>

    <div class="section-title"><h2>Verlauf</h2></div>
    ${s.mobility.length
      ? `<div class="list">${[...s.mobility].reverse().slice(0, 10).map((m) => `<div class="list-item"><div class="thumb">${findRoutine(m.routineId)?.icon || '🧘'}</div><div class="meta"><b>${esc(findRoutine(m.routineId)?.name || 'Mobility')}</b><small>${fmtDate(m.date)} · ${m.minutes} min</small></div></div>`).join('')}</div>`
      : '<div class="empty card">Noch keine Mobility-Einheiten.</div>'}
  `;
  el.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => routineSheet(b.dataset.r)));
  el.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => testSheet(b.dataset.t)));
}

function routineSheet(id) {
  const r = findRoutine(id);
  sheet(
    `<h2>${r.icon} ${esc(r.name)}</h2>
     <p class="muted" style="margin-top:-8px">${esc(r.desc)} · ${Math.round(routineSeconds(r) / 60)} min</p>
     <div class="list mt">${r.items.map((mid) => {
       const m = findMobility(mid);
       return `<div class="list-item"><div class="thumb">${m.icon}</div><div class="meta"><b>${esc(m.name)}</b><small>${m.sec} s${m.side ? ' pro Seite' : ''}</small></div></div>`;
     }).join('')}</div>
     <button class="btn primary block mt-l" data-go>▶ Routine starten</button>`,
    (el, close) => {
      el.querySelector('[data-go]').addEventListener('click', () => {
        close();
        go('mobility-run/' + id);
      });
    },
    { tall: true }
  );
}

function testSheet(id) {
  const t = TESTS.find((x) => x.id === id);
  const s = store.get();
  const hist = s.mobilityTests.filter((x) => x.test === id);
  sheet(
    `<h2>${esc(t.name)}</h2>
     <div class="card tight"><p class="muted" style="font-size:14px">${esc(t.how)}</p></div>
     <div class="card mt">${lineChart(hist.map((h) => ({ label: fmtDate(h.date).split(', ')[1], value: h.value })), { unit: ' ' + t.unit })}</div>
     <label class="field mt"><span>Neuer Messwert (${t.unit})</span><input type="number" step="0.5" inputmode="decimal" name="v"></label>
     <p class="muted mt" style="font-size:13px">Richtwert: ${t.better === 'lower' ? '≤' : '≥'} ${t.goal} ${t.unit}</p>
     <button class="btn primary block mt" data-save>Speichern</button>`,
    (el, close) => {
      el.querySelector('[data-save]').addEventListener('click', () => {
        const v = el.querySelector('[name=v]').value;
        if (v === '') return toast('Bitte Wert eingeben');
        store.update((st) => st.mobilityTests.push({ date: todayKey(), test: id, value: Number(v.replace(',', '.')) }));
        close();
        toast('Messung gespeichert');
        rerender();
      });
    }
  );
}

// ---------- Geführte Routine ----------
let player = null;

export function mobilityRun(el, [id]) {
  const r = findRoutine(id);
  if (!r) {
    go('mobility');
    return;
  }
  if (!player || player.id !== id) {
    // Abfolge inkl. Seitenwechsel aufbauen
    const queue = [];
    r.items.forEach((mid) => {
      const m = findMobility(mid);
      if (m.side) {
        queue.push({ m, label: 'Links' });
        queue.push({ m, label: 'Rechts' });
      } else queue.push({ m, label: '' });
    });
    player = { id, queue, idx: 0, left: queue[0].m.sec, paused: true, startedAt: Date.now() };
  }
  keepAwake(true);
  const p = player;
  const cur = p.queue[p.idx];
  const next = p.queue[p.idx + 1];

  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" data-x aria-label="Schließen">✕</button><h2>${esc(r.name)}</h2><span class="muted">${p.idx + 1}/${p.queue.length}</span></div>
    <div class="pbar"><div style="width:${(p.idx / p.queue.length) * 100}%"></div></div>
    <div class="player mt-l">
      <div class="figure" style="font-size:90px">${cur.m.icon}</div>
      <h2 class="mt">${esc(cur.m.name)}</h2>
      ${cur.label ? `<span class="badge accent mt">${cur.label}</span>` : ''}
      <div class="clock" data-clock>${fmtDuration(p.left)}</div>
      <ol class="howto" style="text-align:left">${cur.m.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="row gap mt">
        <button class="btn grow" data-prev ${p.idx ? '' : 'disabled'}>⏮</button>
        <button class="btn primary grow" data-play style="flex:2">${p.paused ? '▶ Start' : '⏸ Pause'}</button>
        <button class="btn grow" data-next>⏭</button>
      </div>
      ${next ? `<p class="muted mt">Als Nächstes: ${esc(next.m.name)}${next.label ? ` (${next.label})` : ''}</p>` : ''}
    </div>`;

  const advance = (dir = 1) => {
    p.idx += dir;
    if (p.idx >= p.queue.length) {
      clearInterval(iv);
      return complete(el, r);
    }
    p.idx = Math.max(0, p.idx);
    p.left = p.queue[p.idx].m.sec;
    rerender();
  };
  const iv = setInterval(() => {
    if (p.paused) return;
    p.left--;
    if (p.left <= 3 && p.left > 0) navigator.vibrate?.(50);
    if (p.left <= 0) {
      beep(1);
      advance(1);
      return;
    }
    const c = el.querySelector('[data-clock]');
    if (c) c.textContent = fmtDuration(p.left);
  }, 1000);

  el.querySelector('[data-play]').addEventListener('click', () => {
    p.paused = !p.paused;
    rerender();
  });
  el.querySelector('[data-next]').addEventListener('click', () => advance(1));
  el.querySelector('[data-prev]').addEventListener('click', () => advance(-1));
  el.querySelector('[data-x]').addEventListener('click', async () => {
    p.paused = true;
    if (await confirmDialog('Routine beenden?', { ok: 'Beenden' })) {
      const done = p.idx > 0;
      if (done) save(r, p);
      player = null;
      keepAwake(false);
      go('mobility');
    }
  });
  return () => clearInterval(iv);
}

function save(r, p) {
  const minutes = Math.max(1, Math.round((Date.now() - p.startedAt) / 60000));
  store.update((s) => s.mobility.push({ id: uid(), date: todayKey(), routineId: r.id, minutes }));
}

function complete(el, r) {
  save(r, player);
  player = null;
  keepAwake(false);
  el.innerHTML = `<div class="splash"><div style="font-size:72px">🧘</div><h1>Geschafft!</h1><p class="muted">${esc(r.name)} abgeschlossen.</p>
    <button class="btn primary" data-ok style="min-width:200px">Fertig</button></div>`;
  el.querySelector('[data-ok]').addEventListener('click', () => go('mobility'));
}
