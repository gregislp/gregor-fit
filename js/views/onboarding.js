// Mehrstufiges Onboarding: sammelt Profil, erzeugt Plan und Ziele.
import * as store from '../store.js';
import { esc, WEEKDAYS, dateKey, fmtNum } from '../util.js';
import { MUSCLES, PAIN_AREAS, EQUIPMENT } from '../data/exercises.js';
import { SPLITS, recommendedSplit, generatePlan } from '../logic/planner.js';
import { ACTIVITY, calcTargets } from '../logic/nutrition.js';
import { bodyMap, option } from './components.js';
import { go } from '../app.js';

const DRAFT_KEY = 'gregorfit.onboarding';

const GOALS = [
  { value: 'abnehmen', label: 'Abnehmen', sub: 'Fett verlieren, definierter werden', emo: '🔥' },
  { value: 'muskel', label: 'Muskeln aufbauen', sub: 'Mehr Muskelmasse', emo: '💪' },
  { value: 'kraft', label: 'Stärker werden', sub: 'Maximalkraft steigern', emo: '🏋' },
  { value: 'fitness', label: 'Fitter werden', sub: 'Ausdauer und Kraft kombiniert', emo: '⚡' },
  { value: 'gesund', label: 'Gesund & beweglich', sub: 'Schmerzfrei durch den Alltag', emo: '🧘' },
];

const LEVELS = [
  { value: 'anfaenger', label: 'Einsteiger', sub: 'Ich trainiere neu oder fast nie', emo: '🌱' },
  { value: 'wiedereinstieg', label: 'Wiedereinsteiger', sub: 'Früher trainiert, lange Pause', emo: '🔁' },
  { value: 'fortgeschritten', label: 'Fortgeschritten', sub: 'Regelmäßig seit über einem Jahr', emo: '📈' },
  { value: 'profi', label: 'Sehr erfahren', sub: 'Mehrere Jahre strukturiertes Training', emo: '🏆' },
];

const WORK = [
  { value: 'sitzend', label: 'Überwiegend sitzend', sub: 'Büro, Homeoffice, Fahren', emo: '💻' },
  { value: 'stehend', label: 'Überwiegend stehend', sub: 'Handel, Pflege, Labor', emo: '🧍' },
  { value: 'koerperlich', label: 'Körperlich anstrengend', sub: 'Handwerk, Bau, Logistik', emo: '🔨' },
];

const defaults = () => ({
  goal: null, gender: null, birthday: '1990-01-01', height: 175, weight: 80, bodyfat: 20, bodyfatKnown: true,
  years: 0, consistent: false, level: null, weightGoal: null, focus: [], freq: 3, split: 'auto',
  days: [1, 3, 5], duration: 60, location: null, homeEquip: [], pain: [], activity: null, work: null, cardioPerWeek: 1,
});

let step = 0;
let d = loadDraft();

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      step = j.step || 0;
      return { ...defaults(), ...j.d };
    }
  } catch { /* leer */ }
  return defaults();
}

function saveDraft() {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, d })); } catch { /* leer */ }
}

const recFreq = () => (d.level === 'anfaenger' || d.level === 'wiedereinstieg' ? 3 : 4);

// Standard-Wochentage je Frequenz
const DAY_PRESETS = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] };

const STEPS = [
  {
    id: 'welcome',
    render: () => `<div class="splash">
      <div class="logo">F20</div>
      <h1>FITinMYTWEENTY</h1>
      <p class="muted" style="max-width:300px">Dein persönlicher Trainingsplan für Kraft, Cardio, Ernährung und Mobility – passend zu deinem Körper und Alltag.</p>
      <p class="dim" style="font-size:13px">Alle Daten bleiben nur auf diesem Gerät.</p>
    </div>`,
    next: 'Los geht’s',
  },
  {
    id: 'goal', title: 'Was ist dein Hauptziel?', sub: 'Danach richten sich Plan, Wiederholungen und Kalorien.',
    render: () => GOALS.map((g) => option({ ...g, on: d.goal === g.value })).join(''),
    pick: (v) => (d.goal = v), valid: () => !!d.goal,
  },
  {
    id: 'gender', title: 'Dein Geschlecht', sub: 'Für die Berechnung deines Kalorienbedarfs.',
    render: () => option({ value: 'm', label: 'Männlich', emo: '🙋‍♂️', on: d.gender === 'm' }) + option({ value: 'w', label: 'Weiblich', emo: '🙋‍♀️', on: d.gender === 'w' }),
    pick: (v) => (d.gender = v), valid: () => !!d.gender,
  },
  {
    id: 'birthday', title: 'Wann hast du Geburtstag?', sub: 'Dein Alter beeinflusst Grundumsatz und Erholung.',
    render: () => `<input type="date" name="birthday" value="${esc(d.birthday)}" max="${dateKey()}" style="font-size:20px;padding:16px">`,
    valid: () => !!d.birthday,
  },
  {
    id: 'height', title: 'Wie groß bist du?',
    render: () => `<div class="big-value"><span data-out>${d.height}</span> <small>cm</small></div>
      <input type="range" name="height" min="130" max="220" value="${d.height}">`,
  },
  {
    id: 'weight', title: 'Wie viel wiegst du?',
    render: () => `<div class="big-value"><span data-out>${fmtNum(d.weight, 1)}</span> <small>kg</small></div>
      <input type="range" name="weight" min="35" max="200" step="0.5" value="${d.weight}">
      <div class="row gap center mt"><button class="btn small" data-adj="-0.5">−0,5</button><button class="btn small" data-adj="0.5">+0,5</button></div>`,
  },
  {
    id: 'bodyfat', title: 'Körperfettanteil', sub: 'Eine Schätzung reicht. Verbessert die Kalorienberechnung.',
    render: () => `<div class="big-value ${d.bodyfatKnown ? '' : 'dim'}"><span data-out>${d.bodyfat}</span> <small>%</small></div>
      <input type="range" name="bodyfat" min="5" max="50" value="${d.bodyfat}" ${d.bodyfatKnown ? '' : 'disabled'}>
      <p class="muted center mt" style="font-size:14px">${bfHint()}</p>
      <button class="opt mt ${d.bodyfatKnown ? '' : 'on'}" data-unknown><span class="emo">🤷</span><span><b>Weiß ich nicht</b><small class="muted">Wir rechnen ohne Körperfett</small></span></button>`,
  },
  { id: 'calc1', interstitial: 'Wir analysieren deine Körperdaten …' },
  {
    id: 'experience', title: 'Deine Trainingserfahrung', sub: 'Wie viele Jahre trainierst du schon mit Gewichten?',
    render: () => `<div class="big-value"><span data-out>${d.years >= 10 ? '10+' : d.years}</span> <small>Jahre</small></div>
      <input type="range" name="years" min="0" max="10" value="${d.years}">
      <div class="card row between mt"><span>Ich trainiere aktuell regelmäßig</span>
      <label class="toggle"><input type="checkbox" name="consistent" ${d.consistent ? 'checked' : ''}><span></span></label></div>`,
  },
  {
    id: 'level', title: 'Wie schätzt du dich ein?',
    render: () => LEVELS.map((l) => option({ ...l, on: d.level === l.value })).join(''),
    pick: (v) => {
      d.level = v;
      d.freq = recFreq();
      d.days = DAY_PRESETS[d.freq];
    },
    valid: () => !!d.level,
  },
  {
    id: 'weightGoal', title: 'Dein Zielgewicht', skip: () => !['abnehmen', 'muskel'].includes(d.goal),
    render: () => {
      if (d.weightGoal == null) d.weightGoal = d.goal === 'abnehmen' ? Math.round(d.weight * 0.9) : Math.round(d.weight + 4);
      const diff = Math.abs(d.weightGoal - d.weight);
      const rate = d.goal === 'abnehmen' ? 0.5 : 0.25;
      const weeks = Math.max(1, Math.ceil(diff / rate));
      const date = new Date(Date.now() + weeks * 7 * 864e5);
      return `<div class="big-value"><span data-out>${fmtNum(d.weightGoal, 1)}</span> <small>kg</small></div>
        <input type="range" name="weightGoal" min="35" max="200" step="0.5" value="${d.weightGoal}">
        <div class="card mt center"><p class="muted">Bei gesundem Tempo (~${fmtNum(rate, 2)} kg/Woche) erreichst du dein Ziel etwa</p>
        <h2 class="accent mt">${date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</h2></div>`;
    },
  },
  {
    id: 'focus', title: 'Welche Muskeln willst du betonen?', sub: 'Optional, bis zu 2. Sie bekommen extra Übungen.',
    render: () => `${bodyMap(new Set(d.focus))}
      <div class="chips wrap mt" style="flex-wrap:wrap">${Object.entries(MUSCLES)
        .map(([k, v]) => `<button class="chip ${d.focus.includes(k) ? 'on' : ''}" data-focus="${k}">${v}</button>`)
        .join('')}</div>`,
  },
  {
    id: 'freq', title: 'Wie oft pro Woche willst du trainieren?', sub: 'Krafttraining-Einheiten. Cardio planen wir separat.',
    render: () => [2, 3, 4, 5, 6].map((n) => option({ value: n, label: `${n}× pro Woche`, emo: ['', '', '✌️', '👌', '💪', '🔥', '🚀'][n], on: d.freq === n, tag: n === recFreq() ? 'Empfohlen' : '' })).join(''),
    pick: (v) => {
      d.freq = Number(v);
      d.days = DAY_PRESETS[d.freq];
    },
  },
  {
    id: 'split', title: 'Wie soll dein Plan aufgebaut sein?',
    render: () => {
      const rec = recommendedSplit(d.freq);
      return option({ value: 'auto', label: 'Automatisch wählen', sub: `Empfohlen: ${SPLITS[rec].name}`, emo: '✨', on: d.split === 'auto' }) +
        Object.entries(SPLITS).map(([k, s]) => option({ value: k, label: s.name, sub: s.desc, emo: { ganzkoerper: '🧍', oberunter: '↕️', ppl: '🔀' }[k], on: d.split === k, tag: k === rec ? 'Empfohlen' : '' })).join('');
    },
    pick: (v) => (d.split = v),
  },
  {
    id: 'days', title: 'An welchen Tagen trainierst du?', sub: () => `Wähle genau ${d.freq} Tage.`,
    render: () => {
      const h = Math.floor(d.duration / 60), m = d.duration % 60;
      return `<div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((wd) => `<button class="${d.days.includes(wd) ? 'on' : ''}" data-day="${wd}">${WEEKDAYS[wd]}</button>`).join('')}</div>
        <p class="center mt muted">${d.days.length} von ${d.freq} gewählt</p>
        <h3 class="mt-l">Dauer pro Einheit</h3>
        <div class="big-value" style="font-size:42px"><span data-out>${h ? `${h} h ` : ''}${m ? `${m} min` : ''}</span></div>
        <input type="range" name="duration" min="20" max="120" step="5" value="${d.duration}">`;
    },
    valid: () => d.days.length === d.freq,
  },
  {
    id: 'location', title: 'Wo trainierst du?',
    render: () => option({ value: 'gym', label: 'Fitnessstudio', sub: 'Alle Geräte verfügbar', emo: '🏢', on: d.location === 'gym' }) +
      option({ value: 'home', label: 'Zuhause', sub: 'Mit deiner eigenen Ausrüstung', emo: '🏠', on: d.location === 'home' }) +
      (d.location === 'home'
        ? `<h3 class="mt-l">Was hast du zuhause?</h3><p class="muted" style="margin:4px 0 12px">Körpergewicht geht immer.</p>
           <div class="chips" style="flex-wrap:wrap">${['kh', 'lh', 'kb', 'band', 'stange', 'bank'].map((k) => `<button class="chip ${d.homeEquip.includes(k) ? 'on' : ''}" data-equip="${k}">${EQUIPMENT[k]}</button>`).join('')}</div>`
        : ''),
    pick: (v) => (d.location = v), valid: () => !!d.location,
  },
  {
    id: 'pain', title: 'Hast du Schmerzen oder Beschwerden?', sub: 'Übungen, die diese Bereiche stark belasten, planen wir nicht ein.',
    render: () => `${option({ value: 'none', label: 'Keine Beschwerden', emo: '✅', on: !d.pain.length, attr: 'data-nopain' })}
      <div class="chips mt" style="flex-wrap:wrap">${Object.entries(PAIN_AREAS).map(([k, v]) => `<button class="chip ${d.pain.includes(k) ? 'on' : ''}" data-pain="${k}">${v}</button>`).join('')}</div>
      ${d.pain.length ? `<div class="card warn mt"><b>⚠️ Hinweis</b><p class="muted mt" style="font-size:14px">Bei starken, akuten oder unklaren Schmerzen lass dich bitte ärztlich oder physiotherapeutisch untersuchen, bevor du trainierst. Die App ersetzt keine Diagnose.</p></div>` : ''}`,
  },
  {
    id: 'activity', title: 'Wie aktiv ist dein Alltag?', sub: 'Ohne Training gerechnet.',
    render: () => Object.entries(ACTIVITY).map(([k, a]) => option({ value: k, label: a.name, sub: a.desc, emo: { sitzend: '🛋', leicht: '🚶', maessig: '🚴', sehr: '🏗' }[k], on: d.activity === k })).join(''),
    pick: (v) => (d.activity = v), valid: () => !!d.activity,
  },
  {
    id: 'work', title: 'Wie arbeitest du hauptsächlich?', sub: 'Für passende Mobility-Empfehlungen.',
    render: () => WORK.map((w) => option({ ...w, on: d.work === w.value })).join(''),
    pick: (v) => (d.work = v), valid: () => !!d.work,
  },
  {
    id: 'cardio', title: 'Wie viel Cardio möchtest du?', sub: 'Zusätzlich zum Krafttraining.',
    render: () => [0, 1, 2, 3].map((n) => option({ value: n, label: n ? `${n}× pro Woche` : 'Erstmal kein Cardio', emo: ['⏸', '🚶', '🏃', '🚴'][n], on: d.cardioPerWeek === n, tag: n === (d.goal === 'abnehmen' || d.goal === 'fitness' ? 2 : 1) ? 'Empfohlen' : '' })).join(''),
    pick: (v) => (d.cardioPerWeek = Number(v)),
  },
  { id: 'calc2', interstitial: 'Wir erstellen deinen persönlichen Plan …', final: true },
];

function bfHint() {
  const bf = d.bodyfat;
  const m = d.gender !== 'w';
  if (!d.bodyfatKnown) return 'Ohne Angabe nutzen wir die Formel nach Größe, Gewicht und Alter.';
  const cuts = m ? [10, 15, 20, 25, 30] : [18, 23, 28, 33, 38];
  const labels = ['Sehr definiert, Bauchmuskeln klar sichtbar', 'Athletisch, Konturen sichtbar', 'Fit, leichte Konturen', 'Durchschnittlich', 'Etwas Bauchansatz', 'Deutlicher Bauchansatz'];
  return labels[cuts.findIndex((c) => bf < c) === -1 ? 5 : cuts.findIndex((c) => bf < c)];
}

function visibleSteps() {
  return STEPS.filter((s) => !s.skip?.());
}

function finish() {
  const now = Date.now();
  const profile = {
    ...d,
    bodyfat: d.bodyfatKnown ? d.bodyfat : null,
    createdAt: now,
  };
  delete profile.bodyfatKnown;
  store.update((s) => {
    s.profile = profile;
    s.targets = calcTargets(profile);
    s.plan = generatePlan(profile, s.customExercises);
    // Verlauf behalten (z. B. bei wiederholtem Onboarding), nur heutigen Wert setzen
    const k = dateKey();
    s.weights = [...s.weights.filter((w) => w.date !== k), { date: k, kg: profile.weight }];
    if (profile.bodyfat) s.bodyfat = [...s.bodyfat.filter((w) => w.date !== k), { date: k, pct: profile.bodyfat }];
  });
  sessionStorage.removeItem(DRAFT_KEY);
  step = 0;
  d = defaults();
  go('home/welcome');
}

export default function onboarding(el) {
  const steps = visibleSteps();
  step = Math.min(step, steps.length - 1);
  const s = steps[step];
  const progress = Math.round((step / (steps.length - 1)) * 100);
  let timer = null;

  if (s.interstitial) {
    el.innerHTML = `<div class="splash"><div class="calc-anim"></div><h2>${esc(s.interstitial)}</h2>
      <p class="muted">${s.final ? 'Übungen auswählen · Volumen berechnen · Kalorien bestimmen' : 'Grundumsatz · Körperzusammensetzung'}</p></div>`;
    timer = setTimeout(() => {
      if (s.final) finish();
      else {
        step++;
        saveDraft();
        onboarding(el);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }

  const sub = typeof s.sub === 'function' ? s.sub() : s.sub;
  el.innerHTML = `<div class="ob">
    <div class="row gap">
      ${step > 0 ? '<button class="icon-btn" data-back aria-label="Zurück">‹</button>' : ''}
      ${step > 0 ? `<div class="ob-progress"><div style="width:${progress}%"></div></div>` : ''}
    </div>
    <div class="ob-body">
      ${s.title ? `<h1>${esc(s.title)}</h1>` : ''}
      ${sub ? `<p>${esc(sub)}</p>` : ''}
      ${s.render()}
    </div>
    <div class="ob-foot">
      <button class="btn primary block" data-next ${s.valid && !s.valid() ? 'disabled' : ''}>${esc(s.next || 'Weiter')}</button>
    </div>
  </div>`;

  const refresh = () => {
    saveDraft();
    const y = window.scrollY;
    onboarding(el);
    window.scrollTo(0, y);
  };

  el.querySelector('[data-back]')?.addEventListener('click', () => {
    step = Math.max(0, step - 1);
    // Interstitials beim Zurückgehen überspringen
    while (step > 0 && visibleSteps()[step].interstitial) step--;
    refresh();
  });
  el.querySelector('[data-next]').addEventListener('click', () => {
    step++;
    refresh();
    window.scrollTo(0, 0);
  });

  el.querySelectorAll('[data-v]').forEach((b) =>
    b.addEventListener('click', () => {
      s.pick?.(b.dataset.v);
      refresh();
    })
  );

  // Schieberegler & Eingaben live aktualisieren
  el.querySelectorAll('input[name]').forEach((inp) => {
    const handler = () => {
      const n = inp.name;
      if (inp.type === 'checkbox') d[n] = inp.checked;
      else if (inp.type === 'date') d[n] = inp.value;
      else d[n] = Number(inp.value);
      const out = el.querySelector('[data-out]');
      if (out && inp.type === 'range') {
        if (n === 'years') out.textContent = d.years >= 10 ? '10+' : d.years;
        else if (n === 'duration') {
          const h = Math.floor(d.duration / 60), m = d.duration % 60;
          out.textContent = `${h ? `${h} h ` : ''}${m ? `${m} min` : ''}`;
        } else out.textContent = fmtNum(d[n], 1);
      }
      saveDraft();
      el.querySelector('[data-next]').disabled = !!(s.valid && !s.valid());
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', () => {
      handler();
      if (['bodyfat', 'weightGoal'].includes(inp.name)) refresh();
    });
  });

  el.querySelectorAll('[data-adj]').forEach((b) =>
    b.addEventListener('click', () => {
      d.weight = Math.round((d.weight + Number(b.dataset.adj)) * 2) / 2;
      refresh();
    })
  );
  el.querySelector('[data-unknown]')?.addEventListener('click', () => {
    d.bodyfatKnown = !d.bodyfatKnown;
    refresh();
  });

  const toggleIn = (arr, v, max = Infinity) => {
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
    else if (arr.length < max) arr.push(v);
  };
  el.querySelectorAll('[data-focus], .bodymap [data-m]').forEach((b) =>
    b.addEventListener('click', () => {
      toggleIn(d.focus, b.dataset.focus || b.dataset.m, 2);
      refresh();
    })
  );
  el.querySelectorAll('[data-day]').forEach((b) =>
    b.addEventListener('click', () => {
      const wd = Number(b.dataset.day);
      if (d.days.includes(wd)) d.days = d.days.filter((x) => x !== wd);
      else if (d.days.length < d.freq) d.days = [...d.days, wd];
      refresh();
    })
  );
  el.querySelectorAll('[data-equip]').forEach((b) =>
    b.addEventListener('click', () => {
      toggleIn(d.homeEquip, b.dataset.equip);
      refresh();
    })
  );
  el.querySelectorAll('[data-pain]').forEach((b) =>
    b.addEventListener('click', () => {
      toggleIn(d.pain, b.dataset.pain);
      refresh();
    })
  );
  el.querySelector('[data-nopain]')?.addEventListener('click', () => {
    d.pain = [];
    refresh();
  });
}
