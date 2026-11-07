// Laufendes Krafttraining: Sätze erfassen, Pausentimer, Supersätze, Abschluss mit Progression.
import * as store from '../store.js';
import { esc, sheet, confirmDialog, toast, fmtDuration, fmtNum, beep, keepAwake, todayKey, uid } from '../util.js';
import { findExercise, MUSCLES, TIMED, isBodyweight } from '../data/exercises.js';
import { lastPerformance, applyProgression, workoutVolume, weekStreak, alternatives, equipmentFor, prescription, e1rm } from '../logic/planner.js';
import { bodyMap, exName } from './components.js';
import { pickExercise } from './training.js';
import { animSvg, startAnimations } from './anim.js';
import { go, rerender } from '../app.js';

let summary = null;

const sess = () => store.get().activeSession;
// Speichert ohne neu zu zeichnen (Eingaben bleiben fokussiert)
const persist = () => store.save();

export default function session(el) {
  const s = store.get();
  if (!s.activeSession) {
    if (summary) return renderSummary(el);
    go('home');
    return;
  }
  keepAwake(true);
  const a = s.activeSession;

  el.innerHTML = `
    <div class="session-head">
      <div class="row gap">
        <button class="icon-btn" data-menu aria-label="Menü">⋯</button>
        <div class="grow"><div class="kicker">${esc(a.name)}</div><div class="timer-big" data-elapsed>${fmtDuration((Date.now() - a.startedAt) / 1000)}</div></div>
        <button class="btn primary small" data-finish>Beenden</button>
      </div>
      <div class="pbar mt" style="margin-top:10px"><div data-prog style="width:${progress(a)}%"></div></div>
    </div>
    ${a.notes?.length ? `<div class="card warn" style="margin-bottom:12px">${a.notes.map((n) => `<p style="font-size:14px">💡 ${esc(n)}</p>`).join('')}</div>` : ''}
    ${a.exercises.length ? '' : '<div class="empty card"><div class="big">🏋</div>Füge deine erste Übung hinzu.</div>'}
    ${a.exercises.map((e, i) => exerciseCard(e, i, a, s)).join('')}
    <button class="btn ghost block" data-add>＋ Übung hinzufügen</button>
    <div style="height:110px"></div>
    <div data-rest></div>
  `;

  bind(el);
  drawRest(el);
  const tick = setInterval(() => {
    const cur = sess();
    if (!cur) return;
    const t = el.querySelector('[data-elapsed]');
    if (t) t.textContent = fmtDuration((Date.now() - cur.startedAt) / 1000);
    drawRest(el);
  }, 1000);
  return () => clearInterval(tick);
}

function progress(a) {
  const all = a.exercises.flatMap((e) => e.sets);
  return all.length ? Math.round((all.filter((x) => x.done).length / all.length) * 100) : 0;
}

function exerciseCard(e, i, a, s) {
  const ex = findExercise(e.exId, s.customExercises);
  const prev = lastPerformance(s.workouts, e.exId) || [];
  const timed = TIMED.has(e.exId);
  const bw = isBodyweight(ex);
  const allDone = e.sets.length && e.sets.every((x) => x.done);
  const inSS = e.superset && (a.exercises[i - 1]?.superset === e.superset || a.exercises[i + 1]?.superset === e.superset);
  return `<div class="ex-card ${allDone ? 'done' : ''} ${inSS ? 'ss' : ''}" data-ex="${i}">
    ${inSS && a.exercises[i - 1]?.superset !== e.superset ? '<div class="kicker" style="color:var(--accent2);margin-bottom:6px">Supersatz – ohne Pause abwechseln</div>' : ''}
    <div class="ex-head">
      <div class="grow" data-info="${i}" style="cursor:pointer"><b>${esc(ex?.name || 'Übung')}</b>
        <div class="muted" style="font-size:13px">${esc(MUSCLES[ex?.muscle] || '')} · Ziel ${e.repMin}–${e.repMax}${timed ? ' s' : ' Wdh.'} · Pause ${e.rest}s</div></div>
      <button class="icon-btn" data-exmenu="${i}" aria-label="Optionen">⋯</button>
    </div>
    <table class="sets">
      <tr><th>Satz</th><th>Vorher</th><th>${bw ? '+kg' : 'kg'}</th><th>${timed ? 'Sek' : 'Wdh'}</th><th>RIR</th><th></th></tr>
      ${e.sets
        .map((x, j) => {
          const p = prev[j];
          const prevTxt = p ? (p.w ? `${fmtNum(p.w, 2)}×${p.r}` : `${p.r}`) : '–';
          return `<tr class="${x.done ? 'done' : ''}">
            <td class="num">${j + 1}</td>
            <td class="prev">${prevTxt}</td>
            <td><input type="number" inputmode="decimal" step="0.5" min="0" value="${x.w ?? ''}" placeholder="${bw ? '0' : '–'}" data-w="${i}:${j}"></td>
            <td><input type="number" inputmode="numeric" min="0" value="${x.r ?? ''}" data-r="${i}:${j}"></td>
            <td><select data-rir="${i}:${j}" style="padding:10px 2px;text-align:center">${['', 0, 1, 2, 3, 4].map((v) => `<option value="${v}" ${x.rir === v || (v === '' && x.rir == null) ? 'selected' : ''}>${v === '' ? '–' : v === 4 ? '4+' : v}</option>`).join('')}</select></td>
            <td><button class="check" data-done="${i}:${j}" aria-label="Satz abhaken">✓</button></td>
          </tr>`;
        })
        .join('')}
    </table>
    <div class="row gap mt"><button class="btn small ghost" data-addset="${i}">＋ Satz</button>${e.sets.length > 1 ? `<button class="btn small ghost" data-rmset="${i}">− Satz</button>` : ''}</div>
  </div>`;
}

function bind(el) {
  const at = (v) => v.split(':').map(Number);
  const setOf = (v) => {
    const [i, j] = at(v);
    return sess().exercises[i].sets[j];
  };

  el.querySelectorAll('[data-w]').forEach((inp) =>
    inp.addEventListener('input', () => {
      setOf(inp.dataset.w).w = inp.value === '' ? null : Number(inp.value.replace(',', '.'));
      persist();
    })
  );
  el.querySelectorAll('[data-r]').forEach((inp) =>
    inp.addEventListener('input', () => {
      setOf(inp.dataset.r).r = inp.value === '' ? null : Number(inp.value);
      persist();
    })
  );
  el.querySelectorAll('[data-rir]').forEach((inp) =>
    inp.addEventListener('change', () => {
      setOf(inp.dataset.rir).rir = inp.value === '' ? null : Number(inp.value);
      persist();
    })
  );
  el.querySelectorAll('[data-done]').forEach((b) =>
    b.addEventListener('click', () => {
      const [i, j] = at(b.dataset.done);
      const a = sess();
      const e = a.exercises[i];
      const x = e.sets[j];
      x.done = !x.done;
      if (x.done) {
        // Gewicht in folgende leere Sätze übernehmen
        e.sets.slice(j + 1).forEach((n) => {
          if (n.w == null && x.w != null) n.w = x.w;
          if (n.r == null && x.r != null) n.r = x.r;
        });
        const next = a.exercises[i + 1];
        const supersetContinues = e.superset && next?.superset === e.superset;
        if (!supersetContinues) a.restEnd = Date.now() + e.rest * 1000;
        a.restTotal = e.rest;
      }
      persist();
      rerender();
    })
  );
  el.querySelectorAll('[data-addset]').forEach((b) =>
    b.addEventListener('click', () => {
      const e = sess().exercises[Number(b.dataset.addset)];
      const last = e.sets[e.sets.length - 1];
      e.sets.push({ w: last?.w ?? null, r: last?.r ?? e.repMin, rir: null, done: false });
      persist();
      rerender();
    })
  );
  el.querySelectorAll('[data-rmset]').forEach((b) =>
    b.addEventListener('click', () => {
      sess().exercises[Number(b.dataset.rmset)].sets.pop();
      persist();
      rerender();
    })
  );
  el.querySelectorAll('[data-info]').forEach((b) => b.addEventListener('click', () => infoSheet(sess().exercises[Number(b.dataset.info)].exId)));
  el.querySelectorAll('[data-exmenu]').forEach((b) => b.addEventListener('click', () => exMenu(Number(b.dataset.exmenu))));
  el.querySelector('[data-add]').addEventListener('click', () => pickExercise(addExercise));
  el.querySelector('[data-finish]').addEventListener('click', finish);
  el.querySelector('[data-menu]').addEventListener('click', sessionMenu);
}

function addExercise(id) {
  const s = store.get();
  const ex = findExercise(id, s.customExercises);
  const rx = prescription(s.profile, ex);
  const st = s.exerciseState[id] || {};
  sess().exercises.push({
    exId: id, repMin: rx.repMin, repMax: rx.repMax, rest: rx.rest, superset: null,
    sets: Array.from({ length: rx.sets }, () => ({ w: st.weight ?? null, r: st.reps ?? rx.repMin, rir: null, done: false })),
  });
  persist();
  rerender();
}

function drawRest(el) {
  const a = sess();
  const box = el.querySelector('[data-rest]');
  if (!box || !a) return;
  if (!a.restEnd) {
    box.innerHTML = '';
    return;
  }
  const left = Math.ceil((a.restEnd - Date.now()) / 1000);
  if (left <= 0) {
    a.restEnd = null;
    persist();
    box.innerHTML = '';
    if (store.get().settings.restSound) beep(2);
    toast('Pause vorbei – nächster Satz!');
    return;
  }
  if (!box.firstElementChild) {
    box.innerHTML = `<div class="rest-bar"><span>⏱</span><span class="t" data-t></span>
      <button data-rest="-15">−15</button><button data-rest="15">+15</button><button data-rest="skip">Weiter</button></div>`;
    box.querySelectorAll('[data-rest]').forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset.rest;
        if (v === 'skip') a.restEnd = null;
        else a.restEnd += Number(v) * 1000;
        persist();
        drawRest(el);
      })
    );
  }
  box.querySelector('[data-t]').textContent = fmtDuration(left);
}

function infoSheet(exId) {
  const ex = findExercise(exId, store.get().customExercises);
  if (!ex) return;
  sheet(`<h2>${esc(ex.name)}</h2>
    ${animSvg(ex.id)}
    <div class="row gap wrap mt"><span class="badge accent">${esc(MUSCLES[ex.muscle])}</span>${ex.sec.map((m) => `<span class="badge">${esc(MUSCLES[m])}</span>`).join('')}</div>
    ${ex.steps?.length ? `<ol class="howto mt">${ex.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="muted mt">Keine Beschreibung.</p>'}
    <div class="card tight mt"><p class="muted" style="font-size:14px"><b>RIR</b> = Wiederholungen in Reserve: Wie viele Wiederholungen hättest du noch geschafft? 0 = Muskelversagen. Ideal sind meist 1–3.</p></div>
    <button class="btn block mt" data-close>Schließen</button>`, (el) => startAnimations(el, store.get().customExercises));
}

function exMenu(i) {
  const s = store.get();
  const a = sess();
  const e = a.exercises[i];
  const hasNext = i < a.exercises.length - 1;
  const linked = e.superset && a.exercises[i + 1]?.superset === e.superset;
  sheet(
    `<h2>${esc(exName(e.exId, s.customExercises))}</h2>
     <div class="list">
       <div class="list-item" data-a="swap"><div class="thumb">⇄</div><div class="meta"><b>Übung tauschen</b><small>Alternative für denselben Muskel</small></div></div>
       ${hasNext ? `<div class="list-item" data-a="ss"><div class="thumb">🔗</div><div class="meta"><b>${linked ? 'Supersatz lösen' : 'Supersatz mit nächster Übung'}</b><small>Abwechselnd ohne Pause</small></div></div>` : ''}
       ${i > 0 ? '<div class="list-item" data-a="up"><div class="thumb">↑</div><div class="meta"><b>Nach oben schieben</b></div></div>' : ''}
       <div class="list-item" data-a="rest"><div class="thumb">⏱</div><div class="meta"><b>Pause ändern</b><small>Aktuell ${e.rest} s</small></div></div>
       <div class="list-item" data-a="rm"><div class="thumb">🗑</div><div class="meta"><b style="color:var(--danger)">Übung entfernen</b></div></div>
     </div>`,
    (el, close) => {
      el.addEventListener('click', async (ev) => {
        const act = ev.target.closest('[data-a]')?.dataset.a;
        if (!act) return;
        close();
        if (act === 'swap') {
          const alts = alternatives(e.exId, equipmentFor(s.profile, s.status.mode === 'holiday' ? s.status.location : null), s.profile.pain || [], s.customExercises);
          pickExercise(
            (id) => {
              e.exId = id;
              const st = store.get().exerciseState[id] || {};
              e.sets.forEach((x) => { if (!x.done) x.w = st.weight ?? null; });
              persist();
              rerender();
            },
            { title: 'Übung tauschen', only: alts.length ? alts : null }
          );
        } else if (act === 'ss') {
          if (linked) {
            a.exercises[i + 1].superset = null;
            if (a.exercises[i - 1]?.superset !== e.superset) e.superset = null;
          } else {
            const id = e.superset || uid();
            e.superset = id;
            a.exercises[i + 1].superset = id;
          }
          persist();
          rerender();
        } else if (act === 'up') {
          [a.exercises[i - 1], a.exercises[i]] = [a.exercises[i], a.exercises[i - 1]];
          persist();
          rerender();
        } else if (act === 'rest') {
          restSheet(e);
        } else if (act === 'rm') {
          if (!(await confirmDialog('Übung aus diesem Training entfernen?', { ok: 'Entfernen', danger: true }))) return;
          a.exercises.splice(i, 1);
          persist();
          rerender();
        }
      });
    }
  );
}

function restSheet(e) {
  sheet(
    `<h2>Pause</h2><div class="chips" style="flex-wrap:wrap">${[30, 45, 60, 90, 120, 150, 180, 240].map((v) => `<button class="chip ${e.rest === v ? 'on' : ''}" data-v="${v}">${fmtDuration(v)}</button>`).join('')}</div>`,
    (el, close) => {
      el.querySelectorAll('[data-v]').forEach((b) =>
        b.addEventListener('click', () => {
          e.rest = Number(b.dataset.v);
          persist();
          close();
          rerender();
        })
      );
    }
  );
}

function sessionMenu() {
  sheet(
    `<h2>Training</h2>
     <div class="list">
       <div class="list-item" data-a="rename"><div class="thumb">✏️</div><div class="meta"><b>Umbenennen</b></div></div>
       <div class="list-item" data-a="discard"><div class="thumb">🗑</div><div class="meta"><b style="color:var(--danger)">Training verwerfen</b><small>Nichts wird gespeichert</small></div></div>
       <div class="list-item" data-a="leave"><div class="thumb">↩</div><div class="meta"><b>Zur Übersicht</b><small>Training läuft im Hintergrund weiter</small></div></div>
     </div>`,
    (el, close) => {
      el.addEventListener('click', async (ev) => {
        const act = ev.target.closest('[data-a]')?.dataset.a;
        if (!act) return;
        close();
        if (act === 'discard') {
          if (!(await confirmDialog('Training wirklich verwerfen?', { ok: 'Verwerfen', danger: true }))) return;
          store.update((s) => (s.activeSession = null));
          keepAwake(false);
          go('home');
        } else if (act === 'leave') {
          keepAwake(false);
          go('home');
        } else if (act === 'rename') {
          const name = prompt('Name des Trainings', sess().name);
          if (name) {
            sess().name = name.trim();
            persist();
            rerender();
          }
        }
      });
    }
  );
}

async function finish() {
  const a = sess();
  const done = a.exercises.flatMap((e) => e.sets).filter((x) => x.done).length;
  const open = a.exercises.flatMap((e) => e.sets).filter((x) => !x.done).length;
  if (!done) {
    if (await confirmDialog('Noch kein Satz abgehakt. Training verwerfen?', { ok: 'Verwerfen', danger: true })) {
      store.update((s) => (s.activeSession = null));
      keepAwake(false);
      go('home');
    }
    return;
  }
  if (open && !(await confirmDialog(`${open} Sätze sind noch offen. Trotzdem beenden?`, { ok: 'Beenden' }))) return;

  const s = store.get();
  // Bestwerte vor dem Speichern ermitteln
  const prs = [];
  for (const e of a.exercises) {
    const ex = findExercise(e.exId, s.customExercises);
    const doneSets = e.sets.filter((x) => x.done);
    if (!ex || !doneSets.length || isBodyweight(ex)) continue;
    const best = Math.max(...doneSets.map((x) => e1rm(Number(x.w), x.r)));
    const before = Math.max(0, ...s.workouts.flatMap((w) => w.exercises.filter((x) => x.exId === e.exId).flatMap((x) => x.sets.filter((y) => y.done).map((y) => e1rm(Number(y.w), y.r)))));
    if (before > 0 && best > before) prs.push(ex.name);
  }

  const workout = {
    id: a.id,
    date: todayKey(),
    dayId: a.dayId,
    name: a.name,
    startedAt: a.startedAt,
    durationSec: Math.round((Date.now() - a.startedAt) / 1000),
    readiness: a.readiness,
    deload: a.deload,
    exercises: a.exercises
      .filter((e) => e.sets.some((x) => x.done))
      .map((e) => ({ exId: e.exId, repMin: e.repMin, repMax: e.repMax, superset: e.superset, sets: e.sets.map(({ w, r, rir, done }) => ({ w, r, rir, done })) })),
  };
  let changes = [];
  store.update((st) => {
    st.workouts.push(workout);
    changes = applyProgression(st, workout);
    st.activeSession = null;
  });
  keepAwake(false);
  summary = { workout, changes, prs, streak: weekStreak(store.get()) };
  rerender();
}

function renderSummary(el) {
  const { workout: w, changes, prs, streak } = summary;
  const s = store.get();
  const muscles = new Set(w.exercises.map((e) => findExercise(e.exId, s.customExercises)?.muscle).filter(Boolean));
  const sets = w.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0);
  const vol = workoutVolume(w);
  el.innerHTML = `
    <div class="center col" style="padding-top:20px">
      <div style="font-size:64px">🏆</div>
      <h1 class="mt">Stark gemacht!</h1>
      <p class="muted mt">${esc(w.name)} abgeschlossen</p>
      ${streak ? `<span class="badge accent mt">🔥 ${streak} ${streak === 1 ? 'Woche' : 'Wochen'} Streak</span>` : ''}
    </div>
    <div class="grid3 mt-l">
      <div class="card stat center"><b>${fmtDuration(w.durationSec)}</b><span>Dauer</span></div>
      <div class="card stat center"><b>${sets}</b><span>Sätze</span></div>
      <div class="card stat center"><b>${fmtNum(vol / 1000, 1)} t</b><span>Volumen</span></div>
    </div>
    ${prs.length ? `<div class="card hero mt"><b>🎉 Neue Bestleistung</b><p class="muted mt">${prs.map(esc).join(', ')}</p></div>` : ''}
    ${changes.length ? `<div class="card mt"><b>📈 Progression fürs nächste Mal</b>${changes.map((c) => `<p class="muted" style="font-size:14px;margin-top:6px">${esc(c)}</p>`).join('')}</div>` : ''}
    <div class="card mt"><b>Trainierte Muskeln</b><div class="mt">${bodyMap(muscles)}</div></div>
    <div style="height:80px"></div>
    <div class="fab-bar"><button class="btn ghost grow" data-share>Teilen</button><button class="btn primary grow" data-ok>Fertig</button></div>
  `;
  el.querySelector('[data-ok]').addEventListener('click', () => {
    summary = null;
    go('home');
  });
  el.querySelector('[data-share]').addEventListener('click', async () => {
    const text = `💪 ${w.name} erledigt!\n⏱ ${fmtDuration(w.durationSec)} · ${sets} Sätze · ${fmtNum(vol)} kg Volumen\n` +
      w.exercises.map((e) => `• ${exName(e.exId, s.customExercises)}: ${e.sets.filter((x) => x.done).map((x) => (x.w ? `${fmtNum(x.w, 2)}×${x.r}` : x.r)).join(', ')}`).join('\n') +
      (streak ? `\n🔥 ${streak} Wochen Streak` : '');
    try {
      if (navigator.share) await navigator.share({ title: 'Mein Workout', text });
      else {
        await navigator.clipboard.writeText(text);
        toast('In die Zwischenablage kopiert');
      }
    } catch { /* abgebrochen */ }
  });
}
