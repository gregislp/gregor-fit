// Home-Dashboard: heutiges Training, Wochenleiste, Gewohnheiten, Status.
import * as store from '../store.js';
import { esc, sheet, toast, todayKey, dateKey, addDays, weekStart, WEEKDAYS, WEEKDAYS_LONG, fmtNum, ring, bar } from '../util.js';
import { findExercise } from '../data/exercises.js';
import { SPLITS, plannedDayFor, weekStreak, weekProgress, LOCATIONS, isDeloadWeek } from '../logic/planner.js';
import { totals } from '../logic/nutrition.js';
import { routineSeconds } from '../data/mobility.js';
import { startWorkout, startFree } from './training.js';
import { recommendedRoutine } from './mobility.js';
import { go, rerender } from '../app.js';

const STATUS = {
  active: { name: 'Aktiv', icon: '💪' },
  sick: { name: 'Krank', icon: '🤒' },
  holiday: { name: 'Urlaub', icon: '🏖' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hallo';
  return 'Guten Abend';
}

export default function home(el, [param]) {
  const s = store.get();
  // Urlaub/Krank automatisch beenden, wenn das Enddatum vorbei ist
  if (s.status.mode !== 'active' && s.status.until && s.status.until < todayKey()) setStatus('active');

  const today = todayKey();
  const day = plannedDayFor(s.plan);
  const doneToday = s.workouts.filter((w) => w.date === today);
  const streak = weekStreak(s);
  const wp = weekProgress(s);
  const food = totals(s.food[today]);
  const t = s.targets;
  const steps = s.steps[today] || 0;
  const water = s.water[today] || 0;
  const weight = s.weights.at(-1);
  const rec = recommendedRoutine(s);
  const ws = weekStart();
  const deload = isDeloadWeek(s.plan, s.profile);

  // Nächster Trainingstag
  let nextDay = null;
  for (let i = 1; i <= 7 && !nextDay; i++) {
    const d = plannedDayFor(s.plan, addDays(new Date(), i));
    if (d) nextDay = { d, date: addDays(new Date(), i) };
  }

  let todayCard;
  if (s.activeSession) {
    todayCard = `<div class="card hero click" data-resume><div class="kicker">Training läuft</div><h2 class="mt">${esc(s.activeSession.name)}</h2><p class="muted mt">Tippen zum Fortsetzen →</p></div>`;
  } else if (s.status.mode === 'sick') {
    todayCard = `<div class="card danger"><div class="kicker">Krankmodus</div><h2 class="mt">Gute Besserung 🤒</h2><p class="muted mt">Erhol dich. Dein Streak ist geschützt. Leichte Mobility geht, wenn du dich gut fühlst.</p></div>`;
  } else if (doneToday.length) {
    todayCard = `<div class="card hero"><div class="kicker">Heute</div><h2 class="mt">✓ ${esc(doneToday.map((w) => w.name).join(', '))}</h2><p class="muted mt">Erledigt! Erholung ist jetzt Teil des Trainings.${nextDay ? ` Nächste Einheit: ${WEEKDAYS_LONG[nextDay.date.getDay()]}.` : ''}</p></div>`;
  } else if (day) {
    const holiday = s.status.mode === 'holiday';
    const mins = s.profile.duration;
    todayCard = `<div class="card hero">
      <div class="row between"><span class="kicker">Heute geplant</span>${deload ? '<span class="badge warn">Deload</span>' : ''}${holiday ? `<span class="badge warn">${esc(LOCATIONS[s.status.location || 'hotel'].name)}</span>` : ''}</div>
      <h2 class="mt">${esc(day.name)}</h2>
      <p class="muted mt">${day.exercises.length} Übungen · ca. ${mins} min</p>
      <p class="dim mt" style="font-size:13px">${esc(day.exercises.slice(0, 4).map((it) => findExercise(it.exId, s.customExercises)?.name).filter(Boolean).join(' · '))}${day.exercises.length > 4 ? ' …' : ''}</p>
      <button class="btn primary block mt" data-start>▶ Training starten</button>
    </div>`;
  } else {
    todayCard = `<div class="card">
      <div class="kicker">Heute</div><h2 class="mt">Ruhetag 😌</h2>
      <p class="muted mt">${nextDay ? `Nächste Einheit: <b>${esc(nextDay.d.name)}</b> am ${WEEKDAYS_LONG[nextDay.date.getDay()]}.` : ''} Perfekt für Mobility oder lockeres Cardio.</p>
      <div class="row gap mt"><button class="btn small" data-mob>🧘 ${esc(rec.name)} (${Math.round(routineSeconds(rec) / 60)} min)</button><button class="btn small ghost" data-anyway>Trotzdem trainieren</button></div>
    </div>`;
  }

  const act = (k) => s.workouts.some((w) => w.date === k) || s.cardio.some((c) => c.date === k) || s.mobility.some((m) => m.date === k);

  el.innerHTML = `
    <div class="topbar">
      <div class="grow"><p class="muted" style="font-size:14px">${WEEKDAYS_LONG[new Date().getDay()]}, ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}</p><h1>${greeting()} 👋</h1></div>
      <button class="icon-btn" data-status aria-label="Status">${STATUS[s.status.mode].icon}</button>
    </div>

    <div class="row gap" style="margin-bottom:14px">
      <span class="badge accent">🔥 ${streak} ${streak === 1 ? 'Woche' : 'Wochen'} Streak</span>
      <span class="badge">${wp.done}/${wp.goal} Workouts diese Woche</span>
      ${s.status.mode !== 'active' ? `<span class="badge warn">${STATUS[s.status.mode].name}</span>` : ''}
    </div>

    <div class="week">${Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i);
      const k = dateKey(d);
      const planned = s.plan.days.some((x) => x.weekday === d.getDay());
      return `<div class="d ${k === today ? 'today' : ''} ${act(k) ? 'done' : ''}">${WEEKDAYS[d.getDay()]}<b>${d.getDate()}</b><div class="dot ${planned ? '' : 'none'}"></div></div>`;
    }).join('')}</div>

    <div class="mt">${todayCard}</div>

    <div class="section-title"><h2>Heute im Blick</h2></div>
    <div class="grid2">
      <a class="card click" href="#/nutrition" style="display:flex;flex-direction:column;align-items:center">
        ${ring(food.kcal, t.kcal, { size: 110, label: fmtNum(Math.max(0, t.kcal - food.kcal)), sub: food.kcal > t.kcal ? 'kcal drüber' : 'kcal übrig' })}
        <span class="muted mt" style="font-size:13px">${fmtNum(food.kcal)} / ${fmtNum(t.kcal)} kcal</span>
      </a>
      <div class="col gap">
        <div class="card tight click" data-steps><div class="row between"><span class="kicker">👣 Schritte</span></div><b style="font-size:20px">${fmtNum(steps)}</b>${bar(steps, t.steps, 'blue')}<small class="dim">Ziel ${fmtNum(t.steps)}</small></div>
        <div class="card tight click" data-water><div class="row between"><span class="kicker">💧 Wasser</span><span class="accent" style="font-weight:800">＋</span></div><b style="font-size:20px">${fmtNum(water / 1000, 2)} l</b>${bar(water, t.water || 2500, 'blue')}</div>
      </div>
    </div>
    <div class="grid2 mt">
      <div class="card tight click" data-weight><span class="kicker">⚖️ Gewicht</span><b style="font-size:20px;display:block">${weight ? fmtNum(weight.kg, 1) + ' kg' : '–'}</b><small class="dim">${t.weightGoal ? `Ziel ${fmtNum(t.weightGoal, 1)} kg` : 'Tippen zum Eintragen'}</small></div>
      <div class="card tight click" data-protein><span class="kicker">🥩 Protein</span><b style="font-size:20px;display:block">${fmtNum(food.p)} / ${t.protein} g</b>${bar(food.p, t.protein, 'p')}</div>
    </div>

    <div class="section-title"><h2>Schnell hinzufügen</h2></div>
    <div class="grid3">
      <button class="card tight click center col" data-q="free" style="border:0"><span style="font-size:24px">🏋</span><small>Kraft</small></button>
      <a class="card tight click center col" href="#/cardio"><span style="font-size:24px">🏃</span><small>Cardio</small></a>
      <a class="card tight click center col" href="#/mobility"><span style="font-size:24px">🧘</span><small>Mobility</small></a>
      <a class="card tight click center col" href="#/nutrition/add"><span style="font-size:24px">🍽</span><small>Essen</small></a>
      <button class="card tight click center col" data-weight style="border:0"><span style="font-size:24px">⚖️</span><small>Gewicht</small></button>
      <button class="card tight click center col" data-steps style="border:0"><span style="font-size:24px">👣</span><small>Schritte</small></button>
    </div>
  `;

  el.querySelector('[data-resume]')?.addEventListener('click', () => go('session'));
  el.querySelector('[data-start]')?.addEventListener('click', () => startWorkout(day));
  el.querySelector('[data-mob]')?.addEventListener('click', () => go('mobility-run/' + rec.id));
  el.querySelector('[data-anyway]')?.addEventListener('click', () => pickDaySheet());
  el.querySelector('[data-q="free"]').addEventListener('click', startFree);
  el.querySelector('[data-status]').addEventListener('click', statusSheet);
  el.querySelectorAll('[data-steps]').forEach((b) => b.addEventListener('click', stepsSheet));
  el.querySelectorAll('[data-weight]').forEach((b) => b.addEventListener('click', () => weightSheet()));
  el.querySelector('[data-protein]').addEventListener('click', () => go('nutrition'));
  el.querySelector('[data-water]').addEventListener('click', () => {
    store.update((st) => (st.water[today] = (st.water[today] || 0) + 250));
    toast('+250 ml Wasser 💧');
    rerender();
  });

  if (param === 'welcome') {
    history.replaceState(null, '', '#/home');
    welcomeSheet();
  }
}

function pickDaySheet() {
  const s = store.get();
  sheet(
    `<h2>Welche Einheit?</h2><div class="list">${s.plan.days.map((d) => `<div class="list-item" data-d="${d.id}"><div class="thumb">🏋</div><div class="meta"><b>${esc(d.name)}</b><small>${d.exercises.length} Übungen</small></div></div>`).join('')}
     <div class="list-item" data-d="free"><div class="thumb">＋</div><div class="meta"><b>Freies Training</b></div></div></div>`,
    (el, close) => {
      el.addEventListener('click', (e) => {
        const id = e.target.closest('[data-d]')?.dataset.d;
        if (!id) return;
        close();
        if (id === 'free') startFree();
        else startWorkout(s.plan.days.find((d) => d.id === id));
      });
    }
  );
}

function setStatus(mode, until = null, location = null) {
  store.update((s) => {
    const today = todayKey();
    const open = s.statusLog.find((x) => !x.to);
    if (open) open.to = today;
    if (mode !== 'active') s.statusLog.push({ mode, from: today, to: until });
    s.status = { mode, until, location };
  });
}

function statusSheet() {
  const s = store.get();
  let mode = s.status.mode;
  let loc = s.status.location || 'hotel';
  const draw = (el) => {
    el.querySelector('[data-body]').innerHTML = `
      ${Object.entries(STATUS).map(([k, v]) => `<button class="opt ${mode === k ? 'on' : ''}" data-m="${k}"><span class="emo">${v.icon}</span><span><b>${v.name}</b><small class="muted">${{ active: 'Normales Training nach Plan', sick: 'Kein Training, Streak geschützt', holiday: 'Training mit dem, was verfügbar ist' }[k]}</small></span></button>`).join('')}
      ${mode !== 'active' ? `<label class="field mt"><span>Bis wann? (leer = bis ich es ändere)</span><input type="date" name="until" value="${s.status.until || ''}" min="${todayKey()}"></label>` : ''}
      ${mode === 'holiday' ? `<label class="field mt"><span>Wo trainierst du?</span><select name="loc">${Object.entries(LOCATIONS).map(([k, v]) => `<option value="${k}" ${loc === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label><p class="muted mt" style="font-size:13px">Übungen werden automatisch durch passende Alternativen ersetzt.</p>` : ''}`;
  };
  sheet(
    `<h2>Dein Status</h2><div data-body></div><button class="btn primary block mt-l" data-save>Übernehmen</button>`,
    (el, close) => {
      draw(el);
      el.addEventListener('click', (e) => {
        const m = e.target.closest('[data-m]')?.dataset.m;
        if (m) {
          mode = m;
          draw(el);
        }
      });
      el.addEventListener('change', (e) => {
        if (e.target.name === 'loc') loc = e.target.value;
      });
      el.querySelector('[data-save]').addEventListener('click', () => {
        const until = el.querySelector('[name=until]')?.value || null;
        setStatus(mode, mode === 'active' ? null : until, mode === 'holiday' ? loc : null);
        close();
        toast(`Status: ${STATUS[mode].name}`);
        rerender();
      });
    }
  );
}

function stepsSheet() {
  const k = todayKey();
  const cur = store.get().steps[k] || '';
  sheet(
    `<h2>👣 Schritte heute</h2>
     <p class="muted" style="margin-top:-8px;margin-bottom:12px">Tipp: Zahl aus der Health-App ablesen und hier eintragen.</p>
     <input type="number" inputmode="numeric" name="steps" value="${cur}" placeholder="z. B. 8500" style="font-size:24px">
     <button class="btn primary block mt" data-save>Speichern</button>`,
    (el, close) => {
      el.querySelector('input').focus();
      el.querySelector('[data-save]').addEventListener('click', () => {
        const v = Number(el.querySelector('input').value) || 0;
        store.update((s) => (s.steps[k] = v));
        close();
        rerender();
      });
    }
  );
}

export function weightSheet(after) {
  const s = store.get();
  const last = s.weights.at(-1)?.kg || s.profile.weight;
  sheet(
    `<h2>⚖️ Gewicht eintragen</h2>
     <label class="field"><span>Gewicht (kg)</span><input type="number" inputmode="decimal" step="0.1" name="kg" value="${last}" style="font-size:24px"></label>
     <label class="field mt"><span>Körperfett % (optional)</span><input type="number" inputmode="decimal" step="0.1" name="bf" placeholder="${s.bodyfat.at(-1)?.pct ?? ''}"></label>
     <p class="muted mt" style="font-size:13px">Am besten morgens nüchtern nach dem Toilettengang wiegen.</p>
     <button class="btn primary block mt" data-save>Speichern</button>`,
    (el, close) => {
      el.querySelector('[data-save]').addEventListener('click', () => {
        const kg = Number(el.querySelector('[name=kg]').value.replace(',', '.'));
        const bf = el.querySelector('[name=bf]').value;
        if (!kg) return toast('Bitte Gewicht eingeben');
        const k = todayKey();
        store.update((st) => {
          st.weights = st.weights.filter((w) => w.date !== k);
          st.weights.push({ date: k, kg });
          st.weights.sort((a, b) => a.date.localeCompare(b.date));
          st.profile.weight = kg;
          if (bf) {
            st.bodyfat = st.bodyfat.filter((w) => w.date !== k);
            st.bodyfat.push({ date: k, pct: Number(bf.replace(',', '.')) });
            st.bodyfat.sort((a, b) => a.date.localeCompare(b.date));
            st.profile.bodyfat = Number(bf.replace(',', '.'));
          }
        });
        close();
        toast('Gewicht gespeichert');
        after ? after() : rerender();
      });
    }
  );
}

function welcomeSheet() {
  const s = store.get();
  const t = s.targets;
  sheet(
    `<div class="center col"><div style="font-size:56px">🎉</div><h2 class="mt">Dein Plan ist fertig!</h2></div>
     <div class="card mt"><div class="kicker">Training</div><h3 class="mt">${esc(SPLITS[s.plan.split].name)}</h3>
       <p class="muted">${s.plan.days.map((d) => `${WEEKDAYS[d.weekday]}: ${esc(d.name)}`).join(' · ')}</p></div>
     <div class="card mt"><div class="kicker">Ernährung pro Tag</div>
       <div class="grid2 mt"><div class="stat"><b>${fmtNum(t.kcal)}</b><span>kcal</span></div><div class="stat"><b>${t.protein} g</b><span>Protein</span></div>
       <div class="stat"><b>${t.carbs} g</b><span>Kohlenhydrate</span></div><div class="stat"><b>${t.fat} g</b><span>Fett</span></div></div>
       <p class="dim mt" style="font-size:13px">Gesamtumsatz ca. ${fmtNum(t.tdee)} kcal. Ziele kannst du im Profil anpassen.</p></div>
     <div class="card mt"><div class="kicker">📱 Tipp für iPhone</div><p class="muted mt" style="font-size:14px">Öffne die App in Safari → Teilen-Symbol → „Zum Home-Bildschirm“. Dann läuft sie wie eine echte App, auch offline.</p></div>
     <button class="btn primary block mt-l" data-close>Los geht's</button>`,
    null,
    { tall: false }
  );
}

