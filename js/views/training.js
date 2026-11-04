// Training-Tab: Plan, Bibliothek, Übungsdetails, Plan-Editor, Start eines Workouts.
import * as store from '../store.js';
import { esc, sheet, confirmDialog, toast, uid, WEEKDAYS, WEEKDAYS_LONG, fmtDate, fmtDuration, fmtNum, lineChart, todayKey } from '../util.js';
import { EXERCISES, MUSCLES, EQUIPMENT, findExercise, TIMED, isBodyweight } from '../data/exercises.js';
import { SPLITS, generatePlan, buildSession, planWeek, isDeloadWeek, alternatives, equipmentFor, prescription, e1rm, workoutVolume } from '../logic/planner.js';
import { exThumb, exMeta, exName, topbar } from './components.js';
import { go, rerender } from '../app.js';

export function modeTabs(active) {
  const t = (id, label, href) => `<a class="chip ${active === id ? 'on' : ''}" href="${href}">${label}</a>`;
  return `<div class="chips" style="margin-bottom:16px">${t('kraft', '🏋 Kraft', '#/training')}${t('cardio', '🏃 Cardio', '#/cardio')}${t('mobility', '🧘 Mobility', '#/mobility')}</div>`;
}

// ---------- Workout starten (mit Tagesform-Abfrage) ----------
export function startWorkout(day) {
  const s = store.get();
  if (s.activeSession) {
    go('session');
    return;
  }
  if (s.status.mode === 'sick') {
    confirmDialog('Du bist als krank markiert. Training bei Krankheit kann schaden. Trotzdem starten?', { ok: 'Trotzdem' }).then((ok) => ok && readiness(day));
    return;
  }
  readiness(day);
}

function readiness(day) {
  const r = { energy: 7, soreness: 3 };
  sheet(
    `<h2>Wie fühlst du dich heute?</h2>
     <p class="muted" style="margin-top:-6px;margin-bottom:16px">Wir passen das Volumen an deine Tagesform an.</p>
     <label class="field"><span>Energie: <b data-o="energy">${r.energy}</b>/10</span><input type="range" min="0" max="10" value="${r.energy}" name="energy"></label>
     <label class="field mt"><span>Muskelkater: <b data-o="soreness">${r.soreness}</b>/10</span><input type="range" min="0" max="10" value="${r.soreness}" name="soreness"></label>
     <div class="row gap mt-l"><button class="btn ghost grow" data-skip>Überspringen</button><button class="btn primary grow" data-go>Training starten</button></div>`,
    (el, close) => {
      el.querySelectorAll('input').forEach((i) =>
        i.addEventListener('input', () => {
          r[i.name] = Number(i.value);
          el.querySelector(`[data-o="${i.name}"]`).textContent = i.value;
        })
      );
      const begin = (withR) => {
        close();
        store.update((s) => {
          s.activeSession = day ? buildSession(day, s, withR ? r : null) : emptySession();
        });
        go('session');
      };
      el.querySelector('[data-go]').addEventListener('click', () => begin(true));
      el.querySelector('[data-skip]').addEventListener('click', () => begin(false));
    }
  );
}

function emptySession() {
  return { id: uid(), dayId: null, name: 'Freies Training', startedAt: Date.now(), readiness: null, notes: [], deload: false, exercises: [] };
}

export function startFree() {
  const s = store.get();
  if (s.activeSession) return go('session');
  store.update((st) => (st.activeSession = emptySession()));
  go('session');
}

// ---------- Übungsauswahl als Sheet ----------
export function pickExercise(onPick, { muscle = null, title = 'Übung hinzufügen', only = null } = {}) {
  const s = store.get();
  let q = '';
  let m = muscle;
  const all = only || [...s.customExercises, ...EXERCISES];
  sheet(
    `<h2>${esc(title)}</h2>
     <div class="search"><input type="search" placeholder="Übung suchen" data-q></div>
     <div class="chips mt" data-mchips></div>
     <div class="list mt" data-list></div>`,
    (el, close) => {
      const draw = () => {
        el.querySelector('[data-mchips]').innerHTML =
          `<button class="chip ${!m ? 'on' : ''}" data-m="">Alle</button>` +
          Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${m === k ? 'on' : ''}" data-m="${k}">${v}</button>`).join('');
        const nq = q.toLowerCase();
        const items = all.filter((e) => (!m || e.muscle === m) && (!nq || e.name.toLowerCase().includes(nq))).slice(0, 80);
        el.querySelector('[data-list]').innerHTML = items.length
          ? items.map((e) => `<div class="list-item" data-id="${e.id}">${exThumb(e)}<div class="meta"><b>${esc(e.name)}</b><small>${esc(exMeta(e))}</small></div><span class="chev">＋</span></div>`).join('')
          : '<div class="empty">Keine Übung gefunden.</div>';
      };
      draw();
      el.querySelector('[data-q]').addEventListener('input', (e) => {
        q = e.target.value;
        draw();
      });
      el.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-m]');
        if (chip) {
          m = chip.dataset.m || null;
          draw();
          return;
        }
        const item = e.target.closest('[data-id]');
        if (item) {
          close();
          onPick(item.dataset.id);
        }
      });
    },
    { tall: true }
  );
}

// ---------- Training-Übersicht ----------
export default function training(el) {
  const s = store.get();
  const { plan, profile } = s;
  const week = planWeek(plan) + 1;
  const deload = plan && isDeloadWeek(plan, profile);
  const today = new Date().getDay();
  const recent = [...s.workouts].reverse().slice(0, 8);

  el.innerHTML = `
    ${topbar('Training', { right: `<a class="icon-btn" href="#/library" aria-label="Übungsbibliothek">📚</a>` })}
    ${modeTabs('kraft')}
    ${s.activeSession ? `<div class="card hero click" data-resume><div class="kicker">Läuft gerade</div><h2 class="mt">${esc(s.activeSession.name)}</h2><p class="muted mt">Tippen zum Fortsetzen</p></div>` : ''}
    <div class="card hero mt">
      <div class="row between"><span class="kicker">Aktiver Plan</span>${deload ? '<span class="badge warn">Deload-Woche</span>' : `<span class="badge accent">Woche ${week}</span>`}</div>
      <h2 class="mt">${esc(SPLITS[plan.split]?.name || 'Eigener Plan')}</h2>
      <p class="muted">${plan.days.length}× pro Woche · ca. ${profile.duration} min · ${esc(profile.location === 'gym' ? 'Studio' : 'Zuhause')}</p>
      <div class="row gap mt"><a class="btn small" href="#/plan">✏️ Bearbeiten</a><button class="btn small" data-regen>🔄 Neu erstellen</button></div>
    </div>

    <div class="section-title"><h2>Deine Einheiten</h2></div>
    <div class="stack">
    ${plan.days
      .map((d) => {
        const doneToday = d.weekday === today && s.workouts.some((w) => w.date === todayKey() && w.dayId === d.id);
        return `<div class="card">
          <div class="row between">
            <div><span class="kicker">${WEEKDAYS_LONG[d.weekday]}${d.weekday === today ? ' · Heute' : ''}</span><h3 class="mt" style="margin-top:4px">${esc(d.name)}</h3></div>
            ${doneToday ? '<span class="badge accent">✓ Erledigt</span>' : `<button class="btn small primary" data-start="${d.id}">Starten</button>`}
          </div>
          <div class="mt" style="font-size:14px">${d.exercises
            .map((it) => `<div class="row between" style="padding:5px 0;border-top:1px solid var(--line)"><span>${esc(exName(it.exId, s.customExercises))}</span><span class="muted">${it.sets}× ${it.repMin}–${it.repMax}${TIMED.has(it.exId) ? ' s' : ''}</span></div>`)
            .join('')}</div>
        </div>`;
      })
      .join('')}
    </div>
    <button class="btn ghost block mt" data-free>＋ Freies Training starten</button>

    ${s.bookmarks.length ? `<div class="section-title"><h2>Gemerkte Übungen</h2></div>
    <div class="list">${s.bookmarks.map((id) => findExercise(id, s.customExercises)).filter(Boolean).map((e) => `<a class="list-item" href="#/exercise/${e.id}">${exThumb(e)}<div class="meta"><b>${esc(e.name)}</b><small>${esc(exMeta(e))}</small></div><span class="chev">›</span></a>`).join('')}</div>` : ''}

    <div class="section-title"><h2>Verlauf</h2></div>
    ${recent.length
      ? `<div class="list">${recent.map((w) => `<div class="list-item" data-w="${w.id}"><div class="thumb">🏋</div><div class="meta"><b>${esc(w.name)}</b><small>${fmtDate(w.date)} · ${fmtDuration(w.durationSec)} · ${fmtNum(workoutVolume(w))} kg Volumen</small></div><span class="chev">›</span></div>`).join('')}</div>`
      : '<div class="empty card"><div class="big">🗓</div>Noch keine Workouts. Starte deine erste Einheit!</div>'}
  `;

  el.querySelector('[data-resume]')?.addEventListener('click', () => go('session'));
  el.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => startWorkout(plan.days.find((d) => d.id === b.dataset.start))));
  el.querySelector('[data-free]').addEventListener('click', startFree);
  el.querySelector('[data-regen]').addEventListener('click', async () => {
    if (!(await confirmDialog('Plan mit deinen aktuellen Profildaten neu erstellen? Eigene Änderungen am Plan gehen verloren.', { ok: 'Neu erstellen' }))) return;
    store.update((st) => (st.plan = generatePlan(st.profile, st.customExercises)));
    toast('Neuer Plan erstellt');
    rerender();
  });
  el.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => workoutSheet(s.workouts.find((w) => w.id === b.dataset.w))));
}

export function workoutSheet(w) {
  const s = store.get();
  sheet(
    `<h2>${esc(w.name)}</h2>
     <p class="muted" style="margin-top:-8px">${fmtDate(w.date)} · ${fmtDuration(w.durationSec)} · ${fmtNum(workoutVolume(w))} kg</p>
     <div class="mt">${w.exercises
       .map((e) => {
         const done = e.sets.filter((x) => x.done);
         if (!done.length) return '';
         const timed = TIMED.has(e.exId);
         return `<div class="card tight mt"><b>${esc(exName(e.exId, s.customExercises))}</b>
         <div class="muted" style="font-size:14px;margin-top:4px">${done.map((x) => (x.w ? `${fmtNum(x.w, 2)} kg × ${x.r}` : `${x.r}${timed ? ' s' : ' Wdh.'}`)).join(' · ')}</div></div>`;
       })
       .join('')}</div>
     <div class="row gap mt-l"><button class="btn danger grow" data-del>Löschen</button><button class="btn grow" data-close>Schließen</button></div>`,
    (el, close) => {
      el.querySelector('[data-del]').addEventListener('click', async () => {
        if (!(await confirmDialog('Dieses Workout wirklich löschen?', { ok: 'Löschen', danger: true }))) return;
        store.update((st) => (st.workouts = st.workouts.filter((x) => x.id !== w.id)));
        close();
        rerender();
      });
    }
  );
}

// ---------- Übungsbibliothek ----------
let libState = { q: '', m: null, eq: null };

export function library(el) {
  const s = store.get();
  const all = [...s.customExercises, ...EXERCISES];
  const draw = () => {
    const nq = libState.q.toLowerCase();
    const items = all.filter(
      (e) => (!libState.m || e.muscle === libState.m) && (!libState.eq || e.equip.includes(libState.eq)) && (!nq || e.name.toLowerCase().includes(nq))
    );
    el.querySelector('[data-list]').innerHTML = items.length
      ? items.map((e) => `<a class="list-item" href="#/exercise/${e.id}">${exThumb(e)}<div class="meta"><b>${esc(e.name)}${e.custom ? ' <span class="badge">Eigene</span>' : ''}</b><small>${esc(exMeta(e))}</small></div><span class="chev">›</span></a>`).join('')
      : '<div class="empty">Keine Übung gefunden.</div>';
    el.querySelector('[data-count]').textContent = `${items.length} Übungen`;
  };
  el.innerHTML = `
    ${topbar('Übungen', { back: '#/training', right: '<button class="icon-btn" data-new aria-label="Eigene Übung">＋</button>' })}
    <div class="search"><input type="search" placeholder="Suchen" value="${esc(libState.q)}" data-q></div>
    <div class="chips mt">${`<button class="chip ${!libState.m ? 'on' : ''}" data-m="">Alle Muskeln</button>` + Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${libState.m === k ? 'on' : ''}" data-m="${k}">${v}</button>`).join('')}</div>
    <div class="chips mt">${`<button class="chip ${!libState.eq ? 'on' : ''}" data-eq="">Alle Geräte</button>` + Object.entries(EQUIPMENT).map(([k, v]) => `<button class="chip ${libState.eq === k ? 'on' : ''}" data-eq="${k}">${v}</button>`).join('')}</div>
    <p class="muted mt" style="font-size:13px" data-count></p>
    <div class="list mt" data-list></div>`;
  draw();
  el.querySelector('[data-q]').addEventListener('input', (e) => {
    libState.q = e.target.value;
    draw();
  });
  el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { libState.m = b.dataset.m || null; library(el); }));
  el.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => { libState.eq = b.dataset.eq || null; library(el); }));
  el.querySelector('[data-new]').addEventListener('click', () => customExerciseSheet());
}

export function customExerciseSheet(onCreated) {
  sheet(
    `<h2>Eigene Übung</h2>
     <label class="field"><span>Name</span><input type="text" name="name" placeholder="z. B. Landmine Press"></label>
     <label class="field mt"><span>Hauptmuskel</span><select name="muscle">${Object.entries(MUSCLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
     <label class="field mt"><span>Gerät</span><select name="equip">${Object.entries(EQUIPMENT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
     <label class="field mt"><span>Art</span><select name="kind"><option value="comp">Grundübung (mehrgelenkig)</option><option value="iso">Isolationsübung</option></select></label>
     <label class="field mt"><span>Ausführung (optional, eine Zeile pro Schritt)</span><textarea name="steps"></textarea></label>
     <button class="btn primary block mt-l" data-save>Speichern</button>`,
    (el, close) => {
      el.querySelector('[data-save]').addEventListener('click', () => {
        const v = (n) => el.querySelector(`[name=${n}]`).value.trim();
        if (!v('name')) return toast('Bitte einen Namen eingeben');
        const ex = {
          id: 'c_' + uid(), name: v('name'), muscle: v('muscle'), sec: [], equip: [v('equip')], kind: v('kind'), avoid: [],
          steps: v('steps').split('\n').map((x) => x.trim()).filter(Boolean), custom: true,
        };
        store.update((s) => s.customExercises.push(ex));
        close();
        toast('Übung gespeichert');
        if (onCreated) onCreated(ex.id);
        else rerender();
      });
    }
  );
}

// ---------- Übungsdetail ----------
export function exerciseDetail(el, [id]) {
  const s = store.get();
  const ex = findExercise(id, s.customExercises);
  if (!ex) {
    el.innerHTML = `${topbar('Übung', { back: '#/library' })}<div class="empty">Übung nicht gefunden.</div>`;
    return;
  }
  const hist = s.workouts
    .map((w) => {
      const e = w.exercises.find((x) => x.exId === id);
      if (!e) return null;
      const done = e.sets.filter((x) => x.done);
      if (!done.length) return null;
      const best = isBodyweight(ex) ? Math.max(...done.map((x) => x.r || 0)) : Math.max(...done.map((x) => e1rm(Number(x.w), x.r)));
      return { date: w.date, value: Math.round(best * 10) / 10, top: Math.max(...done.map((x) => Number(x.w) || 0)) };
    })
    .filter(Boolean);
  const st = s.exerciseState[id] || {};
  const bm = s.bookmarks.includes(id);
  const bw = isBodyweight(ex);
  el.innerHTML = `
    ${topbar(ex.name, { back: 'javascript:history.back()', right: `<button class="icon-btn" data-bm aria-label="Merken">${bm ? '★' : '☆'}</button>` })}
    <div class="figure">${exThumb(ex).replace('class="thumb"', 'style="font-size:72px"')}</div>
    <div class="row gap wrap mt"><span class="badge accent">${esc(MUSCLES[ex.muscle])}</span>${ex.sec.map((m) => `<span class="badge">${esc(MUSCLES[m])}</span>`).join('')}<span class="badge">${ex.kind === 'comp' ? 'Grundübung' : 'Isolation'}</span></div>
    <p class="muted mt">${esc(ex.equip.map((e) => EQUIPMENT[e]).join(', '))}</p>
    ${ex.steps?.length ? `<div class="section-title"><h2>Ausführung</h2></div><div class="card"><ol class="howto">${ex.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
    <div class="section-title"><h2>Dein Fortschritt</h2></div>
    <div class="grid2">
      <div class="card stat"><span>${bw ? 'Ziel-Wdh.' : 'Arbeitsgewicht'}</span><b>${bw ? (st.reps ?? '–') : st.weight ? fmtNum(st.weight, 2) + ' kg' : '–'}</b></div>
      <div class="card stat"><span>${bw ? 'Bestleistung' : 'Geschätztes 1RM'}</span><b>${hist.length ? fmtNum(Math.max(...hist.map((h) => h.value)), 1) + (bw ? '' : ' kg') : '–'}</b></div>
    </div>
    <div class="card mt">${lineChart(hist.map((h) => ({ label: fmtDate(h.date).split(', ')[1], value: h.value })), { unit: bw ? '' : ' kg' })}</div>
    ${ex.custom ? '<button class="btn ghost block mt" data-del>Eigene Übung löschen</button>' : ''}
  `;
  el.querySelector('[data-bm]').addEventListener('click', () => {
    store.update((st2) => {
      st2.bookmarks = bm ? st2.bookmarks.filter((x) => x !== id) : [...st2.bookmarks, id];
    });
    rerender();
  });
  el.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (!(await confirmDialog('Eigene Übung löschen?', { ok: 'Löschen', danger: true }))) return;
    store.update((st2) => (st2.customExercises = st2.customExercises.filter((x) => x.id !== id)));
    go('library');
  });
}

// ---------- Plan-Editor ----------
export function planEditor(el) {
  const s = store.get();
  // Arbeitskopie, gespeichert wird erst mit „Speichern“
  if (planEditor.draft?.createdAt !== s.plan.createdAt) planEditor.draft = null;
  const draft = planEditor.draft || (planEditor.draft = JSON.parse(JSON.stringify(s.plan)));
  const equip = equipmentFor(s.profile);
  const pain = s.profile.pain || [];

  el.innerHTML = `
    ${topbar('Plan bearbeiten', { back: '#/training' })}
    <p class="muted" style="margin-bottom:12px">Übungen tauschen, Sätze und Wiederholungen anpassen, Tage verschieben.</p>
    ${draft.days
      .map(
        (d, di) => `<div class="card mt">
        <div class="row gap">
          <input type="text" value="${esc(d.name)}" data-dname="${di}" style="font-weight:700">
          <select data-wd="${di}" style="width:90px">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<option value="${w}" ${d.weekday === w ? 'selected' : ''}>${WEEKDAYS[w]}</option>`).join('')}</select>
        </div>
        ${d.exercises
          .map(
            (it, ei) => `<div style="border-top:1px solid var(--line);padding:10px 0;margin-top:10px">
            <div class="row between gap"><b class="grow" style="font-size:15px">${esc(exName(it.exId, s.customExercises))}</b>
              <button class="btn small" data-up="${di}:${ei}" aria-label="Nach oben">↑</button>
              <button class="btn small" data-swap="${di}:${ei}">⇄</button>
              <button class="btn small" data-rm="${di}:${ei}" aria-label="Entfernen">✕</button></div>
            <div class="grid3 mt">
              <label class="field"><span>Sätze</span><input type="number" min="1" max="10" value="${it.sets}" data-f="sets" data-i="${di}:${ei}"></label>
              <label class="field"><span>Wdh. min</span><input type="number" min="1" max="100" value="${it.repMin}" data-f="repMin" data-i="${di}:${ei}"></label>
              <label class="field"><span>Wdh. max</span><input type="number" min="1" max="100" value="${it.repMax}" data-f="repMax" data-i="${di}:${ei}"></label>
            </div>
            <label class="field mt"><span>Pause (Sekunden)</span><input type="number" min="15" max="600" step="15" value="${it.rest}" data-f="rest" data-i="${di}:${ei}"></label>
          </div>`
          )
          .join('')}
        <button class="btn small ghost mt" data-add="${di}">＋ Übung</button>
      </div>`
      )
      .join('')}
    <div style="height:70px"></div>
    <div class="fab-bar"><button class="btn ghost grow" data-cancel>Verwerfen</button><button class="btn primary grow" data-save>Speichern</button></div>
  `;
  const at = (v) => v.split(':').map(Number);
  el.querySelectorAll('[data-dname]').forEach((i) => i.addEventListener('input', () => (draft.days[i.dataset.dname].name = i.value)));
  el.querySelectorAll('[data-wd]').forEach((i) => i.addEventListener('change', () => (draft.days[i.dataset.wd].weekday = Number(i.value))));
  el.querySelectorAll('[data-f]').forEach((i) =>
    i.addEventListener('input', () => {
      const [di, ei] = at(i.dataset.i);
      draft.days[di].exercises[ei][i.dataset.f] = Number(i.value) || 1;
    })
  );
  el.querySelectorAll('[data-rm]').forEach((b) =>
    b.addEventListener('click', () => {
      const [di, ei] = at(b.dataset.rm);
      draft.days[di].exercises.splice(ei, 1);
      rerender();
    })
  );
  el.querySelectorAll('[data-up]').forEach((b) =>
    b.addEventListener('click', () => {
      const [di, ei] = at(b.dataset.up);
      if (!ei) return;
      const arr = draft.days[di].exercises;
      [arr[ei - 1], arr[ei]] = [arr[ei], arr[ei - 1]];
      rerender();
    })
  );
  el.querySelectorAll('[data-swap]').forEach((b) =>
    b.addEventListener('click', () => {
      const [di, ei] = at(b.dataset.swap);
      const it = draft.days[di].exercises[ei];
      const alts = alternatives(it.exId, equip, pain, s.customExercises);
      pickExercise(
        (id) => {
          it.exId = id;
          rerender();
        },
        { title: 'Übung tauschen', only: alts.length ? alts : null, muscle: alts.length ? null : findExercise(it.exId, s.customExercises)?.muscle }
      );
    })
  );
  el.querySelectorAll('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      pickExercise((id) => {
        const ex = findExercise(id, s.customExercises);
        draft.days[Number(b.dataset.add)].exercises.push({ exId: id, ...prescription(s.profile, ex) });
        rerender();
      });
    })
  );
  el.querySelector('[data-save]').addEventListener('click', () => {
    store.update((st) => (st.plan = draft));
    planEditor.draft = null;
    toast('Plan gespeichert');
    go('training');
  });
  el.querySelector('[data-cancel]').addEventListener('click', () => {
    planEditor.draft = null;
    go('training');
  });
}

