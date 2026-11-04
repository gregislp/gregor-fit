// Cardio: Aktivitäten auswählen, live tracken oder nachtragen.
import * as store from '../store.js';
import { esc, sheet, toast, uid, todayKey, fmtDate, fmtDuration, fmtNum, weekStart, dateKey, addDays, keepAwake, beep, confirmDialog } from '../util.js';
import { CARDIO, findCardio, cardioKcal, RPE_LABELS } from '../data/cardio.js';
import { topbar } from './components.js';
import { modeTabs } from './training.js';
import { go, rerender } from '../app.js';

let q = '';

function weekCardio(s) {
  const start = weekStart();
  const keys = new Set(Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i))));
  return s.cardio.filter((c) => keys.has(c.date));
}

export default function cardio(el) {
  const s = store.get();
  const goal = s.profile.cardioPerWeek || 0;
  const week = weekCardio(s);
  const recentIds = [...new Set([...s.cardio].reverse().map((c) => c.actId))].slice(0, 4);

  el.innerHTML = `<div data-view>
    ${topbar('Training')}
    ${modeTabs('cardio')}
    <div class="card hero">
      <div class="kicker">Cardio diese Woche</div>
      <div class="row between mt"><h2>${week.length} ${goal ? `von ${goal}` : ''} Einheiten</h2><span class="muted">${fmtNum(week.reduce((a, c) => a + c.minutes, 0))} min · ${fmtNum(week.reduce((a, c) => a + c.kcal, 0))} kcal</span></div>
      ${goal ? `<div class="pbar blue mt"><div style="width:${Math.min(100, (week.length / goal) * 100)}%"></div></div>` : ''}
      <p class="muted mt" style="font-size:14px">${cardioTip(s)}</p>
    </div>
    ${recentIds.length ? `<div class="section-title"><h2>Zuletzt</h2></div><div class="chips">${recentIds.map((id) => findCardio(id)).filter(Boolean).map((a) => `<button class="chip" data-act="${a.id}">${a.icon} ${esc(a.name)}</button>`).join('')}</div>` : ''}
    <div class="section-title"><h2>Aktivität wählen</h2></div>
    <div class="search"><input type="search" placeholder="Aktivität suchen" value="${esc(q)}" data-q></div>
    <div class="list mt" data-list></div>
    <div class="section-title"><h2>Verlauf</h2></div>
    ${s.cardio.length
      ? `<div class="list">${[...s.cardio].reverse().slice(0, 15).map((c) => {
          const a = findCardio(c.actId);
          return `<div class="list-item" data-c="${c.id}"><div class="thumb">${a?.icon || '🏃'}</div><div class="meta"><b>${esc(a?.name || c.actId)}</b><small>${fmtDate(c.date)} · ${c.minutes} min · RPE ${c.rpe} · ${c.kcal} kcal${c.km ? ` · ${fmtNum(c.km, 2)} km` : ''}</small></div><span class="chev">✕</span></div>`;
        }).join('')}</div>`
      : '<div class="empty card">Noch keine Cardio-Einheiten.</div>'}
  </div>`;
  const draw = () => {
    const n = q.toLowerCase();
    el.querySelector('[data-list]').innerHTML = CARDIO.filter((a) => !n || a.name.toLowerCase().includes(n))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map((a) => `<div class="list-item" data-act="${a.id}"><div class="thumb">${a.icon}</div><div class="meta"><b>${esc(a.name)}</b></div><span class="chev">›</span></div>`)
      .join('');
  };
  draw();
  el.querySelector('[data-q]').addEventListener('input', (e) => {
    q = e.target.value;
    draw();
  });
  // Listener am inneren Wrapper, nicht an #app (sonst stapeln sie sich bei jedem Rendern)
  el.querySelector('[data-view]').addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]');
    if (act) return activitySheet(act.dataset.act);
    const c = e.target.closest('[data-c]');
    if (c && (await confirmDialog('Diese Cardio-Einheit löschen?', { ok: 'Löschen', danger: true }))) {
      store.update((st) => (st.cardio = st.cardio.filter((x) => x.id !== c.dataset.c)));
      rerender();
    }
  });
}

function cardioTip(s) {
  const g = s.profile.goal;
  if (g === 'abnehmen') return 'Tipp: Lockeres Cardio (RPE 3–5) an trainingsfreien Tagen unterstützt das Kaloriendefizit, ohne die Erholung zu stören.';
  if (g === 'muskel' || g === 'kraft') return 'Tipp: Cardio möglichst nicht direkt vor dem Beintraining – oder mit einigen Stunden Abstand.';
  return 'Tipp: Mische lockere längere Einheiten mit kurzen intensiven Intervallen.';
}

export function activitySheet(actId) {
  const a = findCardio(actId);
  sheet(
    `<div class="center col"><div style="font-size:48px">${a.icon}</div><h2 class="mt">${esc(a.name)}</h2></div>
     <button class="btn primary block mt" data-live>▶ Jetzt starten (Timer)</button>
     <button class="btn block mt" data-log>✎ Nachtragen</button>`,
    (el, close) => {
      el.querySelector('[data-live]').addEventListener('click', () => {
        close();
        store.update((s) => (s.activeCardio = { actId, start: null, pausedAt: null, paused: 0 }));
        go('cardio-run');
      });
      el.querySelector('[data-log]').addEventListener('click', () => {
        close();
        logSheet(actId);
      });
    }
  );
}

function logSheet(actId, minutes = 30, done = null) {
  const a = findCardio(actId);
  const s = store.get();
  const kg = s.weights.at(-1)?.kg || s.profile.weight;
  let rpe = 5;
  sheet(
    `<h2>${a.icon} ${esc(a.name)}</h2>
     <label class="field"><span>Dauer (Minuten)</span><input type="number" min="1" max="600" value="${minutes}" name="min" ${done ? 'readonly' : ''}></label>
     ${a.distance ? '<label class="field mt"><span>Distanz in km (optional)</span><input type="number" step="0.01" min="0" name="km" inputmode="decimal"></label>' : ''}
     ${done ? '' : `<label class="field mt"><span>Datum</span><input type="date" name="date" value="${todayKey()}" max="${todayKey()}"></label>`}
     <label class="field mt"><span>Intensität (RPE): <b data-rpe>${rpe} – ${RPE_LABELS[rpe]}</b></span><input type="range" min="1" max="10" value="${rpe}" name="rpe"></label>
     <div class="card tight mt center"><span class="muted">Verbrauch ca.</span> <b data-kcal></b></div>
     <button class="btn primary block mt-l" data-save>Speichern</button>`,
    (el, close) => {
      const calc = () => {
        const m = Number(el.querySelector('[name=min]').value) || 0;
        el.querySelector('[data-kcal]').textContent = `${cardioKcal(a, m, rpe, kg)} kcal`;
      };
      calc();
      el.querySelector('[name=min]').addEventListener('input', calc);
      el.querySelector('[name=rpe]').addEventListener('input', (e) => {
        rpe = Number(e.target.value);
        el.querySelector('[data-rpe]').textContent = `${rpe} – ${RPE_LABELS[rpe]}`;
        calc();
      });
      el.querySelector('[data-save]').addEventListener('click', () => {
        const m = Number(el.querySelector('[name=min]').value);
        if (!m) return toast('Bitte Dauer eingeben');
        const km = Number(el.querySelector('[name=km]')?.value) || null;
        const date = el.querySelector('[name=date]')?.value || todayKey();
        store.update((st) => {
          st.cardio.push({ id: uid(), date, actId, minutes: m, rpe, km, kcal: cardioKcal(a, m, rpe, kg) });
          st.activeCardio = null;
        });
        close();
        toast('Cardio gespeichert 💪');
        go('cardio');
      });
    }
  );
}

// ---------- Live-Timer ----------
export function cardioRun(el) {
  const s = store.get();
  const run = s.activeCardio;
  if (!run) {
    go('cardio');
    return;
  }
  const a = findCardio(run.actId);
  const kg = s.weights.at(-1)?.kg || s.profile.weight;
  keepAwake(true);

  const elapsed = () => {
    if (!run.start) return 0;
    const end = run.pausedAt || Date.now();
    return Math.max(0, (end - run.start - run.paused) / 1000);
  };

  if (!run.start) {
    // Countdown 3-2-1
    let n = 3;
    el.innerHTML = `<div class="countdown" data-n>${n}</div>`;
    const iv = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(iv);
        beep(1);
        store.update(() => (run.start = Date.now()));
        cardioRun(el);
        return;
      }
      el.querySelector('[data-n]').textContent = n;
    }, 1000);
    return () => clearInterval(iv);
  }

  el.innerHTML = `
    <div class="topbar"><h2>${a.icon} ${esc(a.name)}</h2></div>
    <div class="player">
      <div class="kicker">${run.pausedAt ? 'Pausiert' : 'Läuft'}</div>
      <div class="clock" data-clock>${fmtDuration(elapsed())}</div>
      <div class="grid2 mt">
        <div class="card stat center"><b data-kcal>0</b><span>kcal (bei RPE 5)</span></div>
        <div class="card stat center"><b>${a.met}</b><span>MET</span></div>
      </div>
      <div class="row gap mt-l">
        <button class="btn grow" data-pause>${run.pausedAt ? '▶ Weiter' : '⏸ Pause'}</button>
        <button class="btn primary grow" data-stop>■ Beenden</button>
      </div>
      <button class="btn ghost block mt" data-cancel>Abbrechen</button>
    </div>`;

  const tick = () => {
    el.querySelector('[data-clock]').textContent = fmtDuration(elapsed());
    el.querySelector('[data-kcal]').textContent = cardioKcal(a, elapsed() / 60, 5, kg);
  };
  tick();
  const iv = setInterval(tick, 1000);

  el.querySelector('[data-pause]').addEventListener('click', () => {
    store.update(() => {
      if (run.pausedAt) {
        run.paused += Date.now() - run.pausedAt;
        run.pausedAt = null;
      } else run.pausedAt = Date.now();
    });
    rerender();
  });
  el.querySelector('[data-stop]').addEventListener('click', () => {
    const minutes = Math.max(1, Math.round(elapsed() / 60));
    store.update(() => (run.pausedAt = run.pausedAt || Date.now()));
    keepAwake(false);
    logSheet(run.actId, minutes, true);
  });
  el.querySelector('[data-cancel]').addEventListener('click', async () => {
    if (!(await confirmDialog('Einheit abbrechen und nicht speichern?', { ok: 'Abbrechen', cancel: 'Weiter trainieren', danger: true }))) return;
    store.update((st) => (st.activeCardio = null));
    keepAwake(false);
    go('cardio');
  });
  return () => clearInterval(iv);
}
