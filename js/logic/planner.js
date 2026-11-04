// Regelbasierter Trainingsplan-Generator, Progression, Tagesform und Streak.
import { EXERCISES, findExercise, increment, TIMED } from '../data/exercises.js';
import { uid, weekStart, addDays, dateKey, parseKey, fmtNum } from '../util.js';

export const SPLITS = {
  ganzkoerper: { name: 'Ganzkörper', desc: 'Jede Einheit trainiert den ganzen Körper. Ideal bei 2–3 Tagen.' },
  oberunter: { name: 'Oberkörper / Unterkörper', desc: 'Abwechselnd Ober- und Unterkörper. Ideal bei 4 Tagen.' },
  ppl: { name: 'Push / Pull / Beine', desc: 'Drücken, Ziehen, Beine. Ideal bei 5–6 Tagen.' },
};

export function recommendedSplit(freq) {
  if (freq <= 3) return 'ganzkoerper';
  if (freq === 4) return 'oberunter';
  return 'ppl';
}

// Slots: m = Muskel, k = 'comp' | 'iso' | undefined (egal)
const S = (m, k) => ({ m, k });
const TEMPLATES = {
  gk_a: { name: 'Ganzkörper A', cat: 'gk', slots: [S('quads', 'comp'), S('brust', 'comp'), S('ruecken', 'comp'), S('hamstrings', 'comp'), S('schultern'), S('bauch')] },
  gk_b: { name: 'Ganzkörper B', cat: 'gk', slots: [S('hamstrings', 'comp'), S('ruecken', 'comp'), S('brust', 'comp'), S('quads', 'comp'), S('schultern', 'iso'), S('bizeps'), S('trizeps')] },
  gk_c: { name: 'Ganzkörper C', cat: 'gk', slots: [S('gluteus', 'comp'), S('brust', 'comp'), S('ruecken', 'comp'), S('quads'), S('schultern', 'iso'), S('bauch')] },
  ober_a: { name: 'Oberkörper A', cat: 'upper', slots: [S('brust', 'comp'), S('ruecken', 'comp'), S('schultern', 'comp'), S('ruecken', 'comp'), S('bizeps'), S('trizeps')] },
  ober_b: { name: 'Oberkörper B', cat: 'upper', slots: [S('ruecken', 'comp'), S('brust', 'comp'), S('ruecken', 'comp'), S('schultern', 'iso'), S('trizeps'), S('bizeps')] },
  unter_a: { name: 'Unterkörper A', cat: 'lower', slots: [S('quads', 'comp'), S('hamstrings', 'comp'), S('quads'), S('waden'), S('bauch')] },
  unter_b: { name: 'Unterkörper B', cat: 'lower', slots: [S('hamstrings', 'comp'), S('quads', 'comp'), S('gluteus'), S('hamstrings'), S('waden'), S('bauch')] },
  push: { name: 'Push (Drücken)', cat: 'push', slots: [S('brust', 'comp'), S('schultern', 'comp'), S('brust'), S('schultern', 'iso'), S('trizeps'), S('trizeps')] },
  pull: { name: 'Pull (Ziehen)', cat: 'pull', slots: [S('ruecken', 'comp'), S('ruecken', 'comp'), S('schultern', 'iso'), S('bizeps'), S('bizeps'), S('lowback')] },
  beine: { name: 'Beine', cat: 'lower', slots: [S('quads', 'comp'), S('hamstrings', 'comp'), S('quads'), S('gluteus'), S('waden'), S('bauch')] },
};

const SEQUENCES = {
  ganzkoerper: ['gk_a', 'gk_b', 'gk_c'],
  oberunter: ['ober_a', 'unter_a', 'ober_b', 'unter_b'],
  ppl: ['push', 'pull', 'beine'],
};

// Welche Fokus-Muskeln passen zu welcher Tageskategorie
const CAT_MUSCLES = {
  gk: null,
  upper: ['brust', 'ruecken', 'schultern', 'bizeps', 'trizeps', 'bauch'],
  lower: ['quads', 'hamstrings', 'gluteus', 'waden', 'bauch', 'lowback'],
  push: ['brust', 'schultern', 'trizeps', 'bauch'],
  pull: ['ruecken', 'bizeps', 'schultern', 'lowback', 'bauch'],
};

const HOME_BASE = ['kg'];
const ALL_EQUIP = ['kg', 'kh', 'lh', 'kb', 'band', 'stange', 'bank', 'kabel', 'maschine'];

export const LOCATIONS = {
  gym: { name: 'Fitnessstudio', equip: ALL_EQUIP },
  home: { name: 'Zuhause', equip: null }, // aus profile.homeEquip
  hotel: { name: 'Hotel-Gym', equip: ['kg', 'kh', 'band', 'bank'] },
  ohne: { name: 'Ohne Geräte', equip: ['kg'] },
};

export function equipmentFor(profile, location) {
  const loc = location || profile.location;
  if (loc === 'home') return [...new Set([...HOME_BASE, ...(profile.homeEquip || [])])];
  return LOCATIONS[loc]?.equip || ALL_EQUIP;
}

// Wiederholungsbereich, Pause, Sätze je nach Ziel und Level
export function prescription(profile, ex) {
  const comp = ex.kind === 'comp';
  let repMin = 8, repMax = 12, rest = comp ? 120 : 90;
  switch (profile.goal) {
    case 'kraft':
      if (comp) { repMin = 4; repMax = 6; rest = 180; } else { repMin = 8; repMax = 12; rest = 90; }
      break;
    case 'abnehmen':
    case 'fitness':
    case 'gesund':
      repMin = 10; repMax = 15; rest = comp ? 75 : 60;
      break;
    default:
      break;
  }
  if (TIMED.has(ex.id)) { repMin = 30; repMax = 60; rest = 45; }
  const lvl = profile.level;
  let sets = comp ? 3 : 2;
  if (lvl === 'fortgeschritten') sets = 3;
  if (lvl === 'profi') sets = comp ? 4 : 3;
  return { sets, repMin, repMax, rest };
}

function available(ex, equip, pain) {
  return ex.equip.every((e) => equip.includes(e)) && !ex.avoid.some((a) => pain.includes(a));
}

// Bevorzugt freie Gewichte im Studio, Körpergewicht nur wenn nötig
function rank(ex, location) {
  let s = 0;
  if (ex.kind === 'comp') s += 2;
  if (location === 'gym') {
    if (ex.equip.includes('lh')) s += 2;
    if (ex.equip.includes('kh')) s += 1.5;
    if (ex.equip.includes('kabel') || ex.equip.includes('maschine')) s += 1;
  } else {
    if (ex.equip.includes('kh') || ex.equip.includes('kb')) s += 1.5;
    if (ex.equip.includes('band') || ex.equip.includes('stange')) s += 1;
  }
  return s;
}

function pick(slot, { equip, pain, location, used, variant, custom }) {
  const pool = [...EXERCISES, ...custom].filter(
    (e) => e.muscle === slot.m && (!slot.k || e.kind === slot.k) && available(e, equip, pain) && !used.has(e.id)
  );
  if (!pool.length) {
    // Fallback: Grund-/Isolationsübung egal
    if (slot.k) return pick({ m: slot.m }, { equip, pain, location, used, variant, custom });
    return null;
  }
  pool.sort((a, b) => rank(b, location) - rank(a, location));
  // Variante rotiert unter den besten Kandidaten, damit A/B-Tage sich unterscheiden
  const top = pool.slice(0, Math.min(3, pool.length));
  return top[variant % top.length];
}

function estimateSeconds(items) {
  return items.reduce((s, it) => s + it.sets * (((it.repMin + it.repMax) / 2) * 3.5 + it.rest) + 60, 0);
}

// Erzeugt eine Trainingseinheit aus einer Vorlage
function buildDay(tplKey, variant, profile, opts = {}) {
  const tpl = TEMPLATES[tplKey];
  const location = opts.location || profile.location;
  const equip = opts.equip || equipmentFor(profile, location);
  const pain = profile.pain || [];
  const custom = opts.custom || [];
  const used = new Set();
  const slots = [...tpl.slots];

  // Fokus-Muskeln ergänzen (max. 2), sofern sie zur Tageskategorie passen
  const fits = CAT_MUSCLES[tpl.cat];
  (profile.focus || []).slice(0, 2).forEach((m) => {
    if (!fits || fits.includes(m)) slots.splice(Math.min(slots.length, 3), 0, { m });
  });

  let items = [];
  for (const slot of slots) {
    const ex = pick(slot, { equip, pain, location, used, variant, custom });
    if (!ex) continue;
    used.add(ex.id);
    items.push({ exId: ex.id, ...prescription(profile, ex) });
  }

  // An verfügbare Zeit anpassen
  const budget = (profile.duration || 60) * 60;
  while (estimateSeconds(items) > budget && items.length > 3) {
    // zuerst die letzte Isolationsübung streichen
    let idx = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (findExercise(items[i].exId, custom)?.kind === 'iso') { idx = i; break; }
    }
    items.splice(idx === -1 ? items.length - 1 : idx, 1);
  }
  if (estimateSeconds(items) < budget * 0.7) {
    items.forEach((it) => {
      if (estimateSeconds(items) < budget * 0.85 && findExercise(it.exId, custom)?.kind === 'comp') it.sets += 1;
    });
  }
  return { tplKey, name: tpl.name, cat: tpl.cat, exercises: items };
}

export function generatePlan(profile, custom = []) {
  const split = profile.split && profile.split !== 'auto' ? profile.split : recommendedSplit(profile.freq);
  const seq = SEQUENCES[split];
  const weekdays = [...(profile.days || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const days = weekdays.map((wd, i) => {
    const tplKey = seq[i % seq.length];
    // Tagesindex als Variante: gleiche Muskeln bekommen an verschiedenen Tagen andere Übungen
    const variant = i;
    return { id: uid(), weekday: wd, ...buildDay(tplKey, variant, profile, { custom }) };
  });
  return { split, createdAt: Date.now(), days };
}

// Ersatzübung für Urlaubs-/Hotelmodus oder Schmerzen
export function substitute(exId, equip, pain, custom = [], exclude = new Set()) {
  const ex = findExercise(exId, custom);
  if (!ex) return null;
  if (available(ex, equip, pain) && !exclude.has(ex.id)) return ex;
  const pool = [...EXERCISES, ...custom].filter((e) => e.muscle === ex.muscle && available(e, equip, pain) && !exclude.has(e.id));
  pool.sort((a, b) => (b.kind === ex.kind) - (a.kind === ex.kind) || rank(b, 'home') - rank(a, 'home'));
  return pool[0] || null;
}

export function alternatives(exId, equip, pain, custom = []) {
  const ex = findExercise(exId, custom);
  if (!ex) return [];
  return [...EXERCISES, ...custom].filter((e) => e.id !== exId && e.muscle === ex.muscle && available(e, equip, pain));
}

// ---------- Periodisierung ----------
export function planWeek(plan) {
  if (!plan) return 0;
  return Math.floor((Date.now() - plan.createdAt) / (7 * 864e5));
}

export function isDeloadWeek(plan, profile) {
  const cycle = profile.level === 'anfaenger' || profile.level === 'wiedereinstieg' ? 6 : 4;
  const w = planWeek(plan);
  return w > 0 && w % cycle === cycle - 1;
}

// ---------- Session aus Plan erzeugen ----------
// readiness: { energy 0–10, soreness 0–10 }
export function buildSession(day, state, readiness = null) {
  const { profile, exerciseState, customExercises = [], status, plan } = state;
  const deload = plan && isDeloadWeek(plan, profile);
  let equip = null;
  if (status.mode === 'holiday') equip = equipmentFor(profile, status.location || 'hotel');
  const used = new Set();
  const notes = [];
  let reduce = 0;
  if (readiness) {
    if (readiness.soreness >= 7 || readiness.energy <= 3) {
      reduce = 1;
      notes.push('Hoher Muskelkater oder wenig Energie: 1 Satz weniger pro Übung.');
    }
  }
  if (deload) notes.push('Deload-Woche: weniger Sätze und ~10 % weniger Gewicht zur Erholung.');

  const exercises = [];
  for (const it of day.exercises) {
    let exId = it.exId;
    if (equip) {
      const sub = substitute(exId, equip, profile.pain || [], customExercises, used);
      if (!sub) continue;
      exId = sub.id;
    }
    used.add(exId);
    const ex = findExercise(exId, customExercises);
    if (!ex) continue;
    const st = exerciseState[exId] || {};
    let sets = it.sets - reduce - (deload ? 1 : 0);
    sets = Math.max(ex.kind === 'comp' ? 2 : 1, sets);
    let weight = st.weight ?? null;
    if (weight && deload) weight = Math.round((weight * 0.9) / 0.5) * 0.5;
    const reps = st.reps && increment(ex) === 0 ? st.reps : it.repMin;
    exercises.push({
      exId,
      repMin: it.repMin,
      repMax: it.repMax,
      rest: it.rest,
      superset: null,
      sets: Array.from({ length: sets }, () => ({ w: weight, r: reps, rir: null, done: false })),
    });
  }
  return {
    id: uid(),
    dayId: day.id,
    name: day.name,
    startedAt: Date.now(),
    readiness,
    notes,
    deload,
    exercises,
  };
}

// ---------- Progression nach dem Training ----------
export function applyProgression(state, workout) {
  const changes = [];
  for (const e of workout.exercises) {
    const ex = findExercise(e.exId, state.customExercises);
    const done = e.sets.filter((s) => s.done && s.r > 0);
    if (!ex || !done.length) continue;
    const inc = increment(ex);
    const st = (state.exerciseState[e.exId] ||= {});
    const allTop = done.every((s) => s.r >= e.repMax);
    const rirs = done.map((s) => s.rir).filter((v) => v != null);
    const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : 2;
    const under = done.filter((s) => s.r < e.repMin).length > done.length / 2;

    if (inc === 0) {
      const target = Math.max(...done.map((s) => s.r));
      if (done.every((s) => s.r >= (st.reps || e.repMin)) && avgRir >= 1) {
        st.reps = Math.min(target + 1, e.repMax + 10);
        changes.push(`${ex.name}: nächstes Mal ${st.reps} ${TIMED.has(ex.id) ? 's' : 'Wdh.'}`);
      } else {
        st.reps = st.reps || e.repMin;
      }
      continue;
    }

    const weights = done.map((s) => Number(s.w) || 0);
    const top = Math.max(...weights);
    if (!top) continue;
    if (workout.deload) {
      st.weight = st.weight ?? top;
      continue;
    }
    if (allTop && avgRir >= 1) {
      st.weight = Math.round((top + inc) * 100) / 100;
      changes.push(`${ex.name}: +${fmtNum(inc, 2)} kg → ${fmtNum(st.weight, 2)} kg`);
    } else if (under) {
      st.weight = Math.max(inc, Math.round((top - inc) * 100) / 100);
      changes.push(`${ex.name}: Gewicht angepasst → ${fmtNum(st.weight, 2)} kg`);
    } else {
      st.weight = top;
    }
  }
  return changes;
}

// Geschätztes 1RM (Epley)
export const e1rm = (w, r) => (w && r ? w * (1 + r / 30) : 0);

export function workoutVolume(w) {
  return w.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).reduce((a, x) => a + (Number(x.w) || 0) * (x.r || 0), 0), 0);
}

// Letzte ausgeführte Sätze einer Übung (für „Vorher“-Spalte)
export function lastPerformance(workouts, exId) {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const e = workouts[i].exercises.find((x) => x.exId === exId);
    if (e && e.sets.some((s) => s.done)) return e.sets.filter((s) => s.done);
  }
  return null;
}

// ---------- Kalender & Streak ----------
export function plannedDayFor(plan, date = new Date()) {
  if (!plan) return null;
  return plan.days.find((d) => d.weekday === new Date(date).getDay()) || null;
}

function inStatus(statusLog, key) {
  return statusLog.some((s) => s.from <= key && (!s.to || s.to >= key) && s.mode !== 'active');
}

export function activityDates(state) {
  const set = new Set();
  state.workouts.forEach((w) => set.add(w.date));
  state.cardio.forEach((c) => set.add(c.date));
  state.mobility.forEach((m) => set.add(m.date));
  return set;
}

// Wochen-Streak: Anzahl aufeinanderfolgender Wochen mit erreichtem Wochenziel.
// Wochen mit Krankheit/Urlaub sind geschützt und unterbrechen den Streak nicht.
export function weekStreak(state) {
  const goal = Math.max(1, state.profile?.freq || 3);
  const log = state.statusLog || [];
  const count = (start) => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const k = dateKey(addDays(start, i));
      n += state.workouts.filter((w) => w.date === k).length;
      n += state.cardio.filter((c) => c.date === k).length > 0 ? 0.5 : 0;
    }
    return n;
  };
  const protectedWeek = (start) => {
    for (let i = 0; i < 7; i++) if (inStatus(log, dateKey(addDays(start, i)))) return true;
    return false;
  };
  let streak = 0;
  let start = weekStart();
  // aktuelle Woche zählt nur, wenn schon erreicht
  if (count(start) >= goal) streak++;
  start = addDays(start, -7);
  const firstUse = state.profile?.createdAt ? weekStart(new Date(state.profile.createdAt)) : start;
  while (start >= firstUse) {
    if (count(start) >= goal) streak++;
    else if (!protectedWeek(start)) break;
    start = addDays(start, -7);
  }
  return streak;
}

export function weekProgress(state) {
  const start = weekStart();
  const keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
  const done = state.workouts.filter((w) => keys.includes(w.date)).length;
  return { done, goal: state.profile?.freq || 3, keys };
}

export { parseKey };
