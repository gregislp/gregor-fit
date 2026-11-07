// Profil & Einstellungen: Körperdaten, Trainingsprofil, Ziele, Datensicherung.
import * as store from '../store.js';
import { esc, sheet, toast, confirmDialog, age, fmtNum, WEEKDAYS, todayKey } from '../util.js';
import { MUSCLES, PAIN_AREAS, EQUIPMENT } from '../data/exercises.js';
import { SPLITS, generatePlan, recommendedSplit } from '../logic/planner.js';
import { calcTargets, ACTIVITY } from '../logic/nutrition.js';
import { topbar, toggle } from './components.js';
import { rerender, go, checkForUpdate, appVersion } from '../app.js';

const GOAL_NAMES = { abnehmen: 'Abnehmen', muskel: 'Muskelaufbau', kraft: 'Kraft', fitness: 'Fitness', gesund: 'Gesund & beweglich' };
const LEVEL_NAMES = { anfaenger: 'Einsteiger', wiedereinstieg: 'Wiedereinsteiger', fortgeschritten: 'Fortgeschritten', profi: 'Sehr erfahren' };

export default function profile(el, [param]) {
  const s = store.get();
  const p = s.profile;
  const t = s.targets;
  const row = (icon, label, value, attr) => `<div class="list-item" ${attr}><div class="thumb">${icon}</div><div class="meta"><b>${esc(label)}</b><small>${esc(value)}</small></div><span class="chev">›</span></div>`;

  el.innerHTML = `
    ${topbar('Profil')}
    <div class="card hero row gap">
      <div class="logo" style="width:60px;height:60px;font-size:20px;border-radius:18px">F20</div>
      <div><h2>${esc(GOAL_NAMES[p.goal])}</h2><p class="muted">${esc(LEVEL_NAMES[p.level])} · ${age(p.birthday)} Jahre · ${p.height} cm</p></div>
    </div>

    <div class="section-title"><h2>Persönlich</h2></div>
    <div class="list">
      ${row('🧍', 'Körperdaten', `${fmtNum(s.weights.at(-1)?.kg ?? p.weight, 1)} kg · ${p.height} cm${p.bodyfat ? ` · ${fmtNum(p.bodyfat, 1)} % KFA` : ''}`, 'data-body')}
      ${row('🏋', 'Trainingsprofil', `${p.freq}× pro Woche · ${p.duration} min · ${SPLITS[s.plan.split]?.name || ''}`, 'data-train')}
      ${row('🎯', 'Ernährungsziele', `${fmtNum(t.kcal)} kcal · ${t.protein} g Protein`, 'data-targets')}
    </div>

    <div class="section-title"><h2>Einstellungen</h2></div>
    <div class="list">
      <div class="list-item"><div class="thumb">🔔</div><div class="meta"><b>Ton am Pausenende</b><small>Signal, wenn die Satzpause vorbei ist</small></div>${toggle('restSound', s.settings.restSound)}</div>
    </div>

    <div class="section-title"><h2>Daten</h2></div>
    <div class="list">
      ${row('💾', 'Sicherung exportieren', 'Alle Daten als Datei speichern', 'data-export')}
      ${row('📂', 'Sicherung importieren', 'Daten aus einer Datei wiederherstellen', 'data-import')}
      ${row('🔄', 'Onboarding wiederholen', 'Alle Fragen neu beantworten, Verlauf bleibt', 'data-reob')}
      <div class="list-item" data-reset><div class="thumb">🗑</div><div class="meta"><b style="color:var(--danger)">Alle Daten löschen</b><small>Setzt die App vollständig zurück</small></div></div>
    </div>
    <input type="file" accept="application/json,.json" data-file hidden>

    <div class="section-title"><h2>Über</h2></div>
    <div class="card">
      <p><b>FITinMYTWEENTY</b> <span class="muted" data-ver>Version …</span></p>
      <button class="btn small ghost mt" data-update>🔄 Nach Updates suchen</button>
      <p class="muted mt" style="font-size:14px">Alle Daten werden ausschließlich lokal auf diesem Gerät gespeichert. Die App sendet nichts an fremde Server und funktioniert vollständig offline.</p>
      <p class="muted mt" style="font-size:14px">Die App ersetzt keine ärztliche oder physiotherapeutische Beratung. Bei Schmerzen oder Vorerkrankungen bitte vor dem Training abklären lassen.</p>
      <p class="muted mt" style="font-size:14px">📱 Tipp: Exportiere regelmäßig eine Sicherung, z. B. in iCloud Drive.</p>
    </div>
  `;

  appVersion().then((v) => {
    const out = el.querySelector('[data-ver]');
    if (out) out.textContent = v ? `Version ${v.replace(/^.*-v/, '')}` : 'Version unbekannt';
  });
  el.querySelector('[data-update]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Suche …';
    const ready = await checkForUpdate();
    btn.disabled = false;
    btn.textContent = '🔄 Nach Updates suchen';
    if (!ready) toast(navigator.onLine ? 'Du hast die neueste Version' : 'Keine Internetverbindung');
  });
  el.querySelector('[data-body]').addEventListener('click', bodySheet);
  el.querySelector('[data-train]').addEventListener('click', trainingSheet);
  el.querySelector('[data-targets]').addEventListener('click', targetsSheet);
  el.querySelector('[name=restSound]').addEventListener('change', (e) => store.update((st) => (st.settings.restSound = e.target.checked)));
  el.querySelector('[data-export]').addEventListener('click', exportData);
  el.querySelector('[data-import]').addEventListener('click', () => el.querySelector('[data-file]').click());
  el.querySelector('[data-file]').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!(await confirmDialog('Aktuelle Daten durch die Sicherung ersetzen?', { ok: 'Ersetzen', danger: true }))) return;
      store.importJSON(text);
      toast('Sicherung wiederhergestellt');
      go('home');
    } catch (err) {
      toast(err.message || 'Import fehlgeschlagen');
    }
  });
  el.querySelector('[data-reob]').addEventListener('click', async () => {
    if (!(await confirmDialog('Onboarding neu starten? Dein Plan wird danach neu erstellt, der Verlauf bleibt erhalten.', { ok: 'Neu starten' }))) return;
    store.update((st) => (st.profile = null));
    go('onboarding');
  });
  el.querySelector('[data-reset]').addEventListener('click', async () => {
    if (!(await confirmDialog('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.', { ok: 'Alles löschen', danger: true }))) return;
    store.reset();
    go('onboarding');
  });

  if (param === 'targets') {
    history.replaceState(null, '', '#/profile');
    targetsSheet();
  }
}

async function exportData() {
  const json = store.exportJSON();
  const name = `fitinmytweenty-sicherung-${todayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'FITinMYTWEENTY Sicherung' });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function bodySheet() {
  const s = store.get();
  const p = s.profile;
  sheet(
    `<h2>Körperdaten</h2>
     <label class="field"><span>Geschlecht</span><select name="gender"><option value="m" ${p.gender === 'm' ? 'selected' : ''}>Männlich</option><option value="w" ${p.gender === 'w' ? 'selected' : ''}>Weiblich</option></select></label>
     <label class="field mt"><span>Geburtstag</span><input type="date" name="birthday" value="${esc(p.birthday)}"></label>
     <label class="field mt"><span>Größe (cm)</span><input type="number" name="height" value="${p.height}"></label>
     <label class="field mt"><span>Alltagsaktivität</span><select name="activity">${Object.entries(ACTIVITY).map(([k, a]) => `<option value="${k}" ${p.activity === k ? 'selected' : ''}>${a.name}</option>`).join('')}</select></label>
     <label class="field mt"><span>Arbeit</span><select name="work"><option value="sitzend" ${p.work === 'sitzend' ? 'selected' : ''}>Überwiegend sitzend</option><option value="stehend" ${p.work === 'stehend' ? 'selected' : ''}>Überwiegend stehend</option><option value="koerperlich" ${p.work === 'koerperlich' ? 'selected' : ''}>Körperlich</option></select></label>
     <p class="muted mt" style="font-size:13px">Gewicht und Körperfett trägst du über ⚖️ auf dem Home-Bildschirm ein.</p>
     <button class="btn primary block mt" data-save>Speichern</button>`,
    (el, close) => {
      el.querySelector('[data-save]').addEventListener('click', () => {
        const v = (n) => el.querySelector(`[name=${n}]`).value;
        store.update((st) => {
          Object.assign(st.profile, { gender: v('gender'), birthday: v('birthday'), height: Number(v('height')), activity: v('activity'), work: v('work') });
        });
        close();
        recalcTargetsPrompt();
      });
    }
  );
}

async function recalcTargetsPrompt() {
  if (await confirmDialog('Ernährungsziele mit den neuen Daten neu berechnen?', { ok: 'Neu berechnen', cancel: 'Behalten' })) {
    store.update((st) => (st.targets = { ...calcTargets(st.profile), weightGoal: st.targets.weightGoal }));
    toast('Ziele aktualisiert');
  }
  rerender();
}

function trainingSheet() {
  const s = store.get();
  const d = JSON.parse(JSON.stringify(s.profile));
  const draw = (el) => {
    el.querySelector('[data-body]').innerHTML = `
      <label class="field"><span>Ziel</span><select name="goal">${Object.entries(GOAL_NAMES).map(([k, v]) => `<option value="${k}" ${d.goal === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field mt"><span>Erfahrung</span><select name="level">${Object.entries(LEVEL_NAMES).map(([k, v]) => `<option value="${k}" ${d.level === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field mt"><span>Trainingstage (${d.days.length} gewählt)</span></label>
      <div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((wd) => `<button class="${d.days.includes(wd) ? 'on' : ''}" data-day="${wd}">${WEEKDAYS[wd]}</button>`).join('')}</div>
      <label class="field mt"><span>Dauer pro Einheit: <b data-dur>${d.duration}</b> min</span><input type="range" name="duration" min="20" max="120" step="5" value="${d.duration}"></label>
      <label class="field mt"><span>Aufbau</span><select name="split"><option value="auto" ${d.split === 'auto' ? 'selected' : ''}>Automatisch (${SPLITS[recommendedSplit(d.days.length)].name})</option>${Object.entries(SPLITS).map(([k, v]) => `<option value="${k}" ${d.split === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
      <label class="field mt"><span>Ort</span><select name="location"><option value="gym" ${d.location === 'gym' ? 'selected' : ''}>Fitnessstudio</option><option value="home" ${d.location === 'home' ? 'selected' : ''}>Zuhause</option></select></label>
      ${d.location === 'home' ? `<div class="chips mt" style="flex-wrap:wrap">${['kh', 'lh', 'kb', 'band', 'stange', 'bank'].map((k) => `<button class="chip ${d.homeEquip.includes(k) ? 'on' : ''}" data-equip="${k}">${EQUIPMENT[k]}</button>`).join('')}</div>` : ''}
      <label class="field mt"><span>Fokus-Muskeln (max. 2)</span></label>
      <div class="chips" style="flex-wrap:wrap">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${d.focus.includes(k) ? 'on' : ''}" data-focus="${k}">${v}</button>`).join('')}</div>
      <label class="field mt"><span>Beschwerden</span></label>
      <div class="chips" style="flex-wrap:wrap">${Object.entries(PAIN_AREAS).map(([k, v]) => `<button class="chip ${d.pain.includes(k) ? 'on' : ''}" data-pain="${k}">${v}</button>`).join('')}</div>
      <label class="field mt"><span>Cardio pro Woche</span><select name="cardioPerWeek">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${d.cardioPerWeek === n ? 'selected' : ''}>${n}×</option>`).join('')}</select></label>`;
  };
  sheet(
    `<h2>Trainingsprofil</h2><div data-body></div>
     <p class="muted mt" style="font-size:13px">Beim Speichern wird dein Plan neu erstellt. Deine Gewichte und der Verlauf bleiben erhalten.</p>
     <button class="btn primary block mt" data-save>Speichern & Plan neu erstellen</button>`,
    (el, close) => {
      draw(el);
      const tog = (arr, v, max = Infinity) => {
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1);
        else if (arr.length < max) arr.push(v);
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-day],[data-equip],[data-focus],[data-pain]');
        if (!b) return;
        if (b.dataset.day) tog(d.days, Number(b.dataset.day));
        if (b.dataset.equip) tog(d.homeEquip, b.dataset.equip);
        if (b.dataset.focus) tog(d.focus, b.dataset.focus, 2);
        if (b.dataset.pain) tog(d.pain, b.dataset.pain);
        draw(el);
      });
      el.addEventListener('input', (e) => {
        if (e.target.name === 'duration') {
          d.duration = Number(e.target.value);
          el.querySelector('[data-dur]').textContent = d.duration;
        }
      });
      el.addEventListener('change', (e) => {
        const n = e.target.name;
        if (['goal', 'level', 'split', 'location'].includes(n)) d[n] = e.target.value;
        if (n === 'cardioPerWeek') d[n] = Number(e.target.value);
        if (n === 'location') draw(el);
      });
      el.querySelector('[data-save]').addEventListener('click', () => {
        if (d.days.length < 1) return toast('Mindestens einen Trainingstag wählen');
        d.freq = d.days.length;
        const goalChanged = d.goal !== s.profile.goal;
        store.update((st) => {
          st.profile = d;
          st.plan = generatePlan(d, st.customExercises);
          if (goalChanged) st.targets = { ...calcTargets(d), weightGoal: st.targets.weightGoal };
        });
        close();
        toast('Plan neu erstellt');
        rerender();
      });
    },
    { tall: true }
  );
}

function targetsSheet() {
  const s = store.get();
  const t = s.targets;
  sheet(
    `<h2>🎯 Ziele</h2>
     <div class="grid2">
       <label class="field"><span>Kalorien (kcal)</span><input type="number" name="kcal" value="${t.kcal}"></label>
       <label class="field"><span>Protein (g)</span><input type="number" name="protein" value="${t.protein}"></label>
       <label class="field"><span>Kohlenhydrate (g)</span><input type="number" name="carbs" value="${t.carbs}"></label>
       <label class="field"><span>Fett (g)</span><input type="number" name="fat" value="${t.fat}"></label>
       <label class="field"><span>Schritte</span><input type="number" name="steps" value="${t.steps}"></label>
       <label class="field"><span>Wasser (ml)</span><input type="number" name="water" value="${t.water || 2500}"></label>
     </div>
     <label class="field mt"><span>Zielgewicht (kg, optional)</span><input type="number" step="0.5" name="weightGoal" value="${t.weightGoal ?? ''}"></label>
     <p class="muted mt" style="font-size:13px" data-check></p>
     <div class="row gap mt"><button class="btn ghost grow" data-auto>Automatisch</button><button class="btn primary grow" data-save>Speichern</button></div>`,
    (el, close) => {
      const check = () => {
        const v = (n) => Number(el.querySelector(`[name=${n}]`).value) || 0;
        const fromMacros = v('protein') * 4 + v('carbs') * 4 + v('fat') * 9;
        el.querySelector('[data-check]').textContent = `Makros ergeben ${fmtNum(fromMacros)} kcal${Math.abs(fromMacros - v('kcal')) > 100 ? ' – weicht vom Kalorienziel ab.' : '.'}`;
      };
      check();
      el.addEventListener('input', check);
      el.querySelector('[data-auto]').addEventListener('click', () => {
        const c = calcTargets(s.profile);
        ['kcal', 'protein', 'carbs', 'fat', 'steps', 'water'].forEach((k) => (el.querySelector(`[name=${k}]`).value = c[k]));
        check();
      });
      el.querySelector('[data-save]').addEventListener('click', () => {
        const v = (n) => Number(el.querySelector(`[name=${n}]`).value) || 0;
        store.update((st) => {
          st.targets = { ...st.targets, kcal: v('kcal'), protein: v('protein'), carbs: v('carbs'), fat: v('fat'), steps: v('steps'), water: v('water'), weightGoal: v('weightGoal') || null };
        });
        close();
        toast('Ziele gespeichert');
        rerender();
      });
    }
  );
}
