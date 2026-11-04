// Statistik: Körper, Ernährung, Trainingsvolumen, Übungsfortschritt, Schritte, Aktivität.
import * as store from '../store.js';
import { esc, todayKey, dateKey, addDays, weekStart, parseKey, fmtNum, lineChart, barChart, WEEKDAYS } from '../util.js';
import { findExercise, MUSCLES, isBodyweight } from '../data/exercises.js';
import { workoutVolume, e1rm, weekStreak } from '../logic/planner.js';
import { totals } from '../logic/nutrition.js';
import { topbar } from './components.js';
import { rerender } from '../app.js';

const RANGES = { '1W': 7, '1M': 30, '3M': 90, '12M': 365 };
let range = '1M';
let exSel = null;

const short = (k) => {
  const d = parseKey(k);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

export default function stats(el) {
  const s = store.get();
  const days = RANGES[range];
  const from = dateKey(addDays(new Date(), -days + 1));
  const inRange = (k) => k >= from && k <= todayKey();

  const workouts = s.workouts.filter((w) => inRange(w.date));
  const cardio = s.cardio.filter((c) => inRange(c.date));
  const vol = workouts.reduce((a, w) => a + workoutVolume(w), 0);
  const dayKeys = Array.from({ length: days }, (_, i) => dateKey(addDays(new Date(), -days + 1 + i)));
  const loggedDays = dayKeys.filter((k) => (s.food[k] || []).length);
  const avgKcal = loggedDays.length ? loggedDays.reduce((a, k) => a + totals(s.food[k]).kcal, 0) / loggedDays.length : 0;

  // Kalorien: täglich bis 1M, sonst Wochenmittel
  let kcalPts;
  if (days <= 30) {
    const lastN = days === 7 ? dayKeys : dayKeys.slice(-14);
    kcalPts = lastN.map((k) => ({ label: days === 7 ? WEEKDAYS[parseKey(k).getDay()] : short(k).replace(/\.$/, ''), value: Math.round(totals(s.food[k]).kcal) }));
  } else {
    kcalPts = weeklyBuckets(days).map(({ start, keys }) => {
      const l = keys.filter((k) => (s.food[k] || []).length);
      return { label: short(dateKey(start)), value: l.length ? Math.round(l.reduce((a, k) => a + totals(s.food[k]).kcal, 0) / l.length) : 0 };
    });
  }

  const weeks = weeklyBuckets(Math.max(days, 56)).slice(-8);
  const volPts = weeks.map(({ start, keys }) => ({
    label: short(dateKey(start)),
    value: Math.round(s.workouts.filter((w) => keys.includes(w.date)).reduce((a, w) => a + workoutVolume(w), 0)),
  }));

  // Sätze pro Muskel
  const perMuscle = {};
  workouts.forEach((w) => w.exercises.forEach((e) => {
    const m = findExercise(e.exId, s.customExercises)?.muscle;
    if (m) perMuscle[m] = (perMuscle[m] || 0) + e.sets.filter((x) => x.done).length;
  }));
  const maxSets = Math.max(1, ...Object.values(perMuscle));

  // Übungen mit Verlauf
  const exIds = [...new Set(s.workouts.flatMap((w) => w.exercises.map((e) => e.exId)))];
  if (!exSel || !exIds.includes(exSel)) exSel = exIds[0] || null;
  const exObj = exSel && findExercise(exSel, s.customExercises);
  const exPts = exSel
    ? s.workouts
        .filter((w) => inRange(w.date))
        .map((w) => {
          const e = w.exercises.find((x) => x.exId === exSel);
          const done = e?.sets.filter((x) => x.done) || [];
          if (!done.length) return null;
          const v = isBodyweight(exObj) ? Math.max(...done.map((x) => x.r || 0)) : Math.max(...done.map((x) => e1rm(Number(x.w), x.r)));
          return { label: short(w.date), value: Math.round(v * 10) / 10 };
        })
        .filter(Boolean)
    : [];

  const stepPts = (days === 7 ? dayKeys : dayKeys.slice(-14)).map((k) => ({ label: days === 7 ? WEEKDAYS[parseKey(k).getDay()] : short(k).replace(/\.$/, ''), value: s.steps[k] || 0 }));

  // Aktivitätskalender: letzte 5 Wochen
  const calStart = addDays(weekStart(), -28);
  const cal = Array.from({ length: 35 }, (_, i) => {
    const k = dateKey(addDays(calStart, i));
    const w = s.workouts.some((x) => x.date === k);
    const c = s.cardio.some((x) => x.date === k);
    const m = s.mobility.some((x) => x.date === k);
    return { k, lvl: (w ? 2 : 0) + (c ? 1 : 0) + (m ? 1 : 0), future: k > todayKey() };
  });

  el.innerHTML = `
    ${topbar('Statistik')}
    <div class="seg">${Object.keys(RANGES).map((r) => `<button class="${r === range ? 'on' : ''}" data-r="${r}">${r}</button>`).join('')}</div>

    <div class="grid2 mt">
      <div class="card stat"><span>Workouts</span><b>${workouts.length}</b></div>
      <div class="card stat"><span>Volumen</span><b>${fmtNum(vol / 1000, 1)} t</b></div>
      <div class="card stat"><span>Cardio</span><b>${fmtNum(cardio.reduce((a, c) => a + c.minutes, 0))} min</b></div>
      <div class="card stat"><span>Ø kcal/Tag</span><b>${fmtNum(avgKcal)}</b></div>
    </div>

    <div class="section-title"><h2>🔥 Aktivität</h2><span class="badge accent">${weekStreak(s)} Wochen Streak</span></div>
    <div class="card">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
        ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => `<div class="dim center" style="font-size:11px">${d}</div>`).join('')}
        ${cal.map((c) => `<div title="${c.k}" style="aspect-ratio:1;border-radius:7px;background:${c.future ? 'transparent' : ['var(--card2)', 'rgba(198,244,50,.3)', 'rgba(198,244,50,.6)', 'rgba(198,244,50,.8)', 'var(--accent)'][Math.min(4, c.lvl)]};${c.k === todayKey() ? 'outline:2px solid var(--text)' : ''}"></div>`).join('')}
      </div>
      <p class="dim mt" style="font-size:12px">Heller = mehr Aktivität (Kraft, Cardio, Mobility)</p>
    </div>

    <div class="section-title"><h2>⚖️ Körpergewicht</h2></div>
    <div class="card">${lineChart(s.weights.filter((w) => inRange(w.date)).map((w) => ({ label: short(w.date), value: w.kg })), { unit: ' kg', goal: s.targets.weightGoal })}</div>
    ${s.bodyfat.length > 1 ? `<div class="section-title"><h2>Körperfett</h2></div><div class="card">${lineChart(s.bodyfat.filter((w) => inRange(w.date)).map((w) => ({ label: short(w.date), value: w.pct })), { unit: ' %' })}</div>` : ''}

    <div class="section-title"><h2>🍽 Kalorien</h2></div>
    <div class="card">${barChart(kcalPts, { goal: s.targets.kcal, unit: ' kcal' })}</div>

    <div class="section-title"><h2>🏋 Volumen pro Woche</h2></div>
    <div class="card">${barChart(volPts, { unit: ' kg' })}</div>

    <div class="section-title"><h2>📈 Übungsfortschritt</h2></div>
    <div class="card">
      ${exIds.length
        ? `<select data-ex>${exIds.map((id) => `<option value="${id}" ${id === exSel ? 'selected' : ''}>${esc(findExercise(id, s.customExercises)?.name || id)}</option>`).join('')}</select>
           <p class="dim mt" style="font-size:12px">${isBodyweight(exObj) ? 'Beste Wiederholungszahl' : 'Geschätztes 1RM (Epley)'}</p>
           <div class="mt">${lineChart(exPts, { unit: isBodyweight(exObj) ? '' : ' kg' })}</div>`
        : '<div class="chart-empty">Noch keine Workouts.</div>'}
    </div>

    <div class="section-title"><h2>💪 Sätze pro Muskel</h2></div>
    <div class="card">
      ${Object.keys(perMuscle).length
        ? Object.entries(perMuscle).sort((a, b) => b[1] - a[1]).map(([m, n]) => `<div style="margin-bottom:10px"><div class="row between" style="font-size:14px"><span>${esc(MUSCLES[m])}</span><b>${n}</b></div><div class="pbar"><div style="width:${(n / maxSets) * 100}%"></div></div></div>`).join('')
        : '<div class="chart-empty">Noch keine Daten.</div>'}
    </div>

    <div class="section-title"><h2>👣 Schritte</h2></div>
    <div class="card">${barChart(stepPts, { goal: s.targets.steps })}</div>
  `;

  el.querySelectorAll('[data-r]').forEach((b) =>
    b.addEventListener('click', () => {
      range = b.dataset.r;
      rerender();
    })
  );
  el.querySelector('[data-ex]')?.addEventListener('change', (e) => {
    exSel = e.target.value;
    rerender();
  });
}

function weeklyBuckets(days) {
  const n = Math.ceil(days / 7);
  const ws = weekStart();
  return Array.from({ length: n }, (_, i) => {
    const start = addDays(ws, -(n - 1 - i) * 7);
    return { start, keys: Array.from({ length: 7 }, (_, j) => dateKey(addDays(start, j))) };
  });
}
