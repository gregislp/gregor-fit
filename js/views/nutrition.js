// Ernährung: Tagesübersicht, Lebensmittel suchen/per Text, eigene Lebensmittel, Rezepte (alles lokal).
import * as store from '../store.js';
import { esc, sheet, toast, uid, todayKey, dateKey, parseKey, addDays, fmtDate, fmtNum, ring, bar, confirmDialog } from '../util.js';
import { MEALS, mealForNow, searchLocal } from '../data/foods.js';
import { totals, entryFrom, parseMealText } from '../logic/nutrition.js';
import { topbar } from './components.js';
import { weightSheet } from './home.js';
import { rerender } from '../app.js';

let curDay = todayKey();

const allCustom = (s) => [...s.customFoods, ...s.recipes.map(recipeAsFood)];

export default function nutrition(el, [param]) {
  const s = store.get();
  const entries = s.food[curDay] || [];
  const tot = totals(entries);
  const t = s.targets;
  const burned = s.cardio.filter((c) => c.date === curDay).reduce((a, c) => a + c.kcal, 0);
  const isToday = curDay === todayKey();
  const left = t.kcal - tot.kcal;

  el.innerHTML = `
    ${topbar('Ernährung', { right: '<button class="icon-btn" data-recipes aria-label="Rezepte">📖</button>' })}
    <div class="row between" style="margin-bottom:12px">
      <button class="icon-btn" data-day="-1" aria-label="Vorheriger Tag">‹</button>
      <b>${isToday ? 'Heute' : fmtDate(curDay)}</b>
      <button class="icon-btn" data-day="1" ${isToday ? 'disabled style="opacity:.3"' : ''} aria-label="Nächster Tag">›</button>
    </div>

    <div class="card hero">
      <div class="row between">
        <div class="stat center"><b>${fmtNum(tot.kcal)}</b><span>Gegessen</span></div>
        ${ring(tot.kcal, t.kcal, { size: 130, label: fmtNum(Math.abs(left)), sub: left >= 0 ? 'kcal übrig' : 'kcal drüber' })}
        <div class="stat center"><b>${fmtNum(burned)}</b><span>Cardio</span></div>
      </div>
      <div class="macro mt">
        <div class="m"><b>${fmtNum(tot.p)} / ${t.protein} g</b><small class="muted">Protein</small>${bar(tot.p, t.protein, 'p')}</div>
        <div class="m"><b>${fmtNum(tot.c)} / ${t.carbs} g</b><small class="muted">Kohlenhydrate</small>${bar(tot.c, t.carbs, 'c')}</div>
        <div class="m"><b>${fmtNum(tot.f)} / ${t.fat} g</b><small class="muted">Fett</small>${bar(tot.f, t.fat, 'f')}</div>
      </div>
      ${burned ? `<p class="dim mt" style="font-size:12px">Cardio-Kalorien sind im Ziel nicht automatisch eingerechnet.</p>` : ''}
    </div>

    ${MEALS.map((m) => {
      const list = entries.filter((e) => e.meal === m.id);
      const kc = list.reduce((a, e) => a + e.kcal, 0);
      return `<div class="list mt">
        <div class="meal-head"><div><b>${m.icon} ${m.name}</b> <span class="muted" style="font-size:14px">${fmtNum(kc)} kcal</span></div><button class="add-round" data-add="${m.id}" aria-label="${m.name} hinzufügen">＋</button></div>
        ${list.map((e) => `<div class="list-item" data-e="${e.id}"><div class="meta"><b>${esc(e.name)}</b><small>${fmtNum(e.grams)} g · E ${fmtNum(e.p)} · K ${fmtNum(e.c)} · F ${fmtNum(e.f)}</small></div><b>${fmtNum(e.kcal)}</b></div>`).join('')}
      </div>`;
    }).join('')}

    <div class="grid2 mt">
      <div class="card tight click" data-water><span class="kicker">💧 Wasser</span><b style="display:block;font-size:20px">${fmtNum((s.water[curDay] || 0) / 1000, 2)} l</b><small class="dim">Tippen: +250 ml</small></div>
      <div class="card tight click" data-weight><span class="kicker">⚖️ Gewicht</span><b style="display:block;font-size:20px">${s.weights.at(-1) ? fmtNum(s.weights.at(-1).kg, 1) + ' kg' : '–'}</b><small class="dim">Tippen zum Eintragen</small></div>
    </div>
    <a class="btn ghost block mt" href="#/profile/targets">🎯 Ziele bearbeiten</a>
  `;

  el.querySelectorAll('[data-day]').forEach((b) =>
    b.addEventListener('click', () => {
      const n = addDays(parseKey(curDay), Number(b.dataset.day));
      if (dateKey(n) > todayKey()) return;
      curDay = dateKey(n);
      rerender();
    })
  );
  el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => addSheet(b.dataset.add)));
  el.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => editEntry(entries.find((e) => e.id === b.dataset.e))));
  el.querySelector('[data-water]').addEventListener('click', () => {
    store.update((st) => (st.water[curDay] = (st.water[curDay] || 0) + 250));
    rerender();
  });
  el.querySelector('[data-weight]').addEventListener('click', () => weightSheet());
  el.querySelector('[data-recipes]').addEventListener('click', recipesSheet);

  if (param === 'add') {
    history.replaceState(null, '', '#/nutrition');
    curDay = todayKey();
    addSheet(mealForNow());
  }
}

function addEntries(list) {
  store.update((s) => {
    (s.food[curDay] ||= []).push(...list.map((e) => ({ ...e, id: uid() })));
    list.forEach((e) => {
      const food = { key: e.key || 'x_' + e.name, name: e.name, ...e.per100, unit: e.unit, src: e.src };
      s.recentFoods = [food, ...s.recentFoods.filter((f) => f.key !== food.key)].slice(0, 30);
    });
  });
}

// ---------- Hinzufügen ----------
function addSheet(meal) {
  let tab = 'search';
  return sheet(
    `<h2>${MEALS.find((m) => m.id === meal).icon} ${MEALS.find((m) => m.id === meal).name}</h2>
     <div class="seg" data-tabs>
       <button data-t="search" class="on">Suchen</button><button data-t="text">Text</button><button data-t="own">Eigene</button>
     </div>
     <div class="mt" data-body></div>`,
    (el, closeFn) => {
      const body = el.querySelector('[data-body]');
      const draw = () => {
        el.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
        if (tab === 'search') drawSearch(body, meal, closeFn);
        if (tab === 'text') drawText(body, meal, closeFn);
        if (tab === 'own') drawOwn(body, meal, closeFn);
      };
      el.querySelector('[data-tabs]').addEventListener('click', (e) => {
        const t = e.target.closest('[data-t]')?.dataset.t;
        if (t) {
          tab = t;
          draw();
        }
      });
      draw();
    },
    { tall: true }
  );
}

function foodRow(f, fav) {
  return `<div class="list-item" data-f="${esc(f.key)}"><div class="meta"><b>${esc(f.name)}</b><small>${fmtNum(f.kcal)} kcal/100 g · E ${fmtNum(f.p, 1)} · K ${fmtNum(f.c, 1)} · F ${fmtNum(f.f, 1)}</small></div>${fav ? '<span>★</span>' : '<span class="chev">＋</span>'}</div>`;
}

function drawSearch(body, meal, closeAll) {
  const s = store.get();
  let results = [];
  const favs = s.favorites.map((k) => [...s.recentFoods, ...allCustom(s)].find((f) => f.key === k) || searchLocal(k)[0]).filter(Boolean);
  body.innerHTML = `
    <div class="search"><input type="search" placeholder="Lebensmittel suchen" data-q enterkeyhint="search"></div>
    <div data-res class="mt"></div>`;
  const res = body.querySelector('[data-res]');
  const showDefault = () => {
    res.innerHTML = `
      ${favs.length ? `<div class="kicker mt">Favoriten</div><div class="list mt">${favs.map((f) => foodRow(f, true)).join('')}</div>` : ''}
      ${s.recentFoods.length ? `<div class="kicker mt-l">Zuletzt</div><div class="list mt">${s.recentFoods.slice(0, 12).map((f) => foodRow(f)).join('')}</div>` : '<div class="empty">Suche nach einem Lebensmittel, z. B. „Haferflocken“.</div>'}`;
    results = [...favs, ...s.recentFoods];
  };
  showDefault();
  const input = body.querySelector('[data-q]');
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) return showDefault();
    results = searchLocal(q, allCustom(s));
    res.innerHTML = results.length
      ? `<div class="list">${results.map((f) => foodRow(f)).join('')}</div>`
      : '<div class="empty">Nicht gefunden. Lege es unter „Eigene“ mit den Werten von der Verpackung an.</div>';
  });
  res.addEventListener('click', (e) => {
    const key = e.target.closest('[data-f]')?.dataset.f;
    const f = key && results.find((x) => x.key === key);
    if (f) amountSheet(f, meal, closeAll);
  });
}

function amountSheet(food, meal, closeAll) {
  let grams = food.unit ? food.unit[1] : 100;
  let m = meal;
  const isFav = () => store.get().favorites.includes(food.key);
  sheet(
    `<div class="row between"><h2 style="margin:0">${esc(food.name)}</h2><button class="icon-btn" data-fav aria-label="Favorit">${isFav() ? '★' : '☆'}</button></div>
     <p class="muted mt">${fmtNum(food.kcal)} kcal pro 100 g</p>
     <label class="field mt"><span>Menge (g / ml)</span><input type="number" inputmode="decimal" name="g" value="${grams}" style="font-size:22px"></label>
     <div class="chips mt">${[food.unit ? [`1 ${food.unit[0]}`, food.unit[1]] : null, food.unit ? [`2 ${food.unit[0]}`, food.unit[1] * 2] : null, ['50 g', 50], ['100 g', 100], ['150 g', 150], ['200 g', 200]].filter(Boolean).map(([l, g]) => `<button class="chip" data-g="${g}">${esc(l)}</button>`).join('')}</div>
     <label class="field mt"><span>Mahlzeit</span><select name="meal">${MEALS.map((x) => `<option value="${x.id}" ${x.id === m ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
     <div class="card tight mt" data-prev></div>
     <button class="btn primary block mt" data-save>Hinzufügen</button>`,
    (el, close) => {
      const prev = () => {
        const e = entryFrom(food, grams, m);
        el.querySelector('[data-prev]').innerHTML = `<div class="grid2"><div class="stat"><b>${e.kcal}</b><span>kcal</span></div><div class="stat"><b>${fmtNum(e.p, 1)} g</b><span>Protein</span></div><div class="stat"><b>${fmtNum(e.c, 1)} g</b><span>Kohlenhydrate</span></div><div class="stat"><b>${fmtNum(e.f, 1)} g</b><span>Fett</span></div></div>`;
      };
      prev();
      const gi = el.querySelector('[name=g]');
      gi.addEventListener('input', () => {
        grams = Number(gi.value.replace(',', '.')) || 0;
        prev();
      });
      el.querySelectorAll('[data-g]').forEach((b) =>
        b.addEventListener('click', () => {
          grams = Number(b.dataset.g);
          gi.value = grams;
          prev();
        })
      );
      el.querySelector('[name=meal]').addEventListener('change', (e) => (m = e.target.value));
      el.querySelector('[data-fav]').addEventListener('click', (e) => {
        store.update((st) => {
          st.favorites = isFav() ? st.favorites.filter((k) => k !== food.key) : [...st.favorites, food.key];
          if (!st.recentFoods.some((f) => f.key === food.key)) st.recentFoods.push(food);
        });
        e.target.textContent = isFav() ? '★' : '☆';
      });
      el.querySelector('[data-save]').addEventListener('click', () => {
        if (!grams) return toast('Bitte Menge eingeben');
        addEntries([entryFrom(food, grams, m)]);
        close();
        closeAll();
        toast(`${food.name} hinzugefügt`);
        rerender();
      });
    }
  );
}

function drawText(body, meal, closeAll) {
  const s = store.get();
  body.innerHTML = `
    <p class="muted" style="font-size:14px">Schreib einfach, was du gegessen hast. Mit dem 🎤 auf der iPhone-Tastatur kannst du es auch diktieren.</p>
    <textarea class="mt" data-txt placeholder="z. B. 2 Eier, 1 Scheibe Vollkornbrot, 200 g Skyr und 1 Banane"></textarea>
    <button class="btn block mt" data-parse>Erkennen</button>
    <div data-out class="mt"></div>`;
  let parsed = [];
  const out = body.querySelector('[data-out]');
  const show = () => {
    const ok = parsed.filter((p) => p.food);
    const sum = ok.reduce((a, p) => a + entryFrom(p.food, p.grams, meal).kcal, 0);
    out.innerHTML = parsed.length
      ? `<div class="list">${parsed.map((p, i) => (p.food
          ? `<div class="list-item"><div class="meta"><b>${esc(p.food.name)}</b><small>„${esc(p.text)}“</small></div><input type="number" value="${Math.round(p.grams)}" data-i="${i}" style="width:84px;text-align:right"> g</div>`
          : `<div class="list-item"><div class="meta"><b style="color:var(--warn)">Nicht erkannt</b><small>„${esc(p.text)}“ – bitte über Suche hinzufügen</small></div></div>`)).join('')}</div>
         ${ok.length ? `<p class="center mt"><b>${fmtNum(sum)} kcal</b> gesamt</p><button class="btn primary block mt" data-addall>Alle hinzufügen</button>` : ''}`
      : '<div class="empty">Nichts erkannt.</div>';
    out.querySelectorAll('[data-i]').forEach((inp) =>
      inp.addEventListener('change', () => {
        parsed[inp.dataset.i].grams = Number(inp.value) || 0;
        show();
      })
    );
    out.querySelector('[data-addall]')?.addEventListener('click', () => {
      addEntries(ok.filter((p) => p.grams > 0).map((p) => entryFrom(p.food, p.grams, meal)));
      closeAll();
      toast(`${ok.length} Lebensmittel hinzugefügt`);
      rerender();
    });
  };
  body.querySelector('[data-parse]').addEventListener('click', () => {
    parsed = parseMealText(body.querySelector('[data-txt]').value, allCustom(s));
    show();
  });
}

// ---------- Eigene Lebensmittel ----------
function drawOwn(body, meal, closeAll) {
  const s = store.get();
  body.innerHTML = `
    ${s.customFoods.length ? `<div class="kicker">Deine Lebensmittel</div><div class="list mt" data-list>${s.customFoods.map((f) => foodRow(f)).join('')}</div>` : ''}
    <div class="kicker mt-l">Neues Lebensmittel</div>
    <label class="field mt"><span>Name</span><input type="text" name="name"></label>
    <div class="grid2 mt">
      <label class="field"><span>kcal / 100 g</span><input type="number" inputmode="decimal" name="kcal"></label>
      <label class="field"><span>Protein / 100 g</span><input type="number" inputmode="decimal" name="p"></label>
      <label class="field"><span>Kohlenhydrate / 100 g</span><input type="number" inputmode="decimal" name="c"></label>
      <label class="field"><span>Fett / 100 g</span><input type="number" inputmode="decimal" name="f"></label>
    </div>
    <label class="field mt"><span>Portionsgröße in g (optional)</span><input type="number" inputmode="decimal" name="portion"></label>
    <button class="btn primary block mt" data-save>Speichern & auswählen</button>`;
  body.querySelector('[data-list]')?.addEventListener('click', (e) => {
    const f = s.customFoods.find((x) => x.key === e.target.closest('[data-f]')?.dataset.f);
    if (f) amountSheet(f, meal, closeAll);
  });
  body.querySelector('[data-save]').addEventListener('click', () => {
    const v = (n) => Number((body.querySelector(`[name=${n}]`).value || '0').replace(',', '.'));
    const name = body.querySelector('[name=name]').value.trim();
    if (!name || !v('kcal')) return toast('Name und kcal sind Pflicht');
    const f = { key: 'own_' + uid(), name, kcal: v('kcal'), p: v('p'), c: v('c'), f: v('f'), unit: v('portion') ? ['Portion', v('portion')] : null, src: 'own' };
    store.update((st) => st.customFoods.push(f));
    amountSheet(f, meal, closeAll);
  });
}

function editEntry(e) {
  sheet(
    `<h2>${esc(e.name)}</h2>
     <label class="field"><span>Menge (g)</span><input type="number" inputmode="decimal" name="g" value="${e.grams}" style="font-size:22px"></label>
     <label class="field mt"><span>Mahlzeit</span><select name="meal">${MEALS.map((x) => `<option value="${x.id}" ${x.id === e.meal ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
     <div class="row gap mt-l"><button class="btn danger grow" data-del>Löschen</button><button class="btn primary grow" data-save>Speichern</button></div>`,
    (el, close) => {
      el.querySelector('[data-save]').addEventListener('click', () => {
        const g = Number(el.querySelector('[name=g]').value.replace(',', '.'));
        const meal = el.querySelector('[name=meal]').value;
        store.update((s) => {
          const list = s.food[curDay];
          const i = list.findIndex((x) => x.id === e.id);
          const per = e.per100 || { kcal: (e.kcal / e.grams) * 100, p: (e.p / e.grams) * 100, c: (e.c / e.grams) * 100, f: (e.f / e.grams) * 100 };
          list[i] = { ...entryFrom({ ...per, name: e.name, key: e.key, unit: e.unit, src: e.src }, g, meal), id: e.id };
        });
        close();
        rerender();
      });
      el.querySelector('[data-del]').addEventListener('click', () => {
        store.update((s) => (s.food[curDay] = s.food[curDay].filter((x) => x.id !== e.id)));
        close();
        rerender();
      });
    }
  );
}

// ---------- Rezepte ----------
function recipeAsFood(r) {
  const tg = r.items.reduce((a, i) => a + i.grams, 0) || 1;
  const sum = totals(r.items);
  return {
    key: 'rec_' + r.id,
    name: `🍲 ${r.name}`,
    kcal: Math.round((sum.kcal / tg) * 100),
    p: Math.round((sum.p / tg) * 1000) / 10,
    c: Math.round((sum.c / tg) * 1000) / 10,
    f: Math.round((sum.f / tg) * 1000) / 10,
    unit: ['Portion', Math.round(tg / (r.portions || 1))],
    src: 'recipe',
  };
}

function recipesSheet() {
  const s = store.get();
  sheet(
    `<h2>📖 Rezepte</h2>
     ${s.recipes.length
       ? `<div class="list">${s.recipes.map((r) => {
           const f = recipeAsFood(r);
           return `<div class="list-item" data-r="${r.id}"><div class="meta"><b>${esc(r.name)}</b><small>${r.portions} Portionen · ${fmtNum((f.kcal * f.unit[1]) / 100)} kcal pro Portion</small></div><span class="chev">›</span></div>`;
         }).join('')}</div>`
       : '<div class="empty"><div class="big">🍲</div>Noch keine Rezepte. Lege dein Lieblingsgericht einmal an und trage es künftig mit einem Tipp ein.</div>'}
     <button class="btn primary block mt" data-new>＋ Neues Rezept</button>`,
    (el, close) => {
      el.querySelector('[data-new]').addEventListener('click', () => {
        close();
        recipeEditor();
      });
      el.querySelectorAll('[data-r]').forEach((b) =>
        b.addEventListener('click', () => {
          close();
          recipeEditor(s.recipes.find((r) => r.id === b.dataset.r));
        })
      );
    },
    { tall: true }
  );
}

function recipeEditor(existing) {
  const r = existing ? JSON.parse(JSON.stringify(existing)) : { id: uid(), name: '', portions: 2, items: [] };
  sheet(
    `<h2>${existing ? 'Rezept bearbeiten' : 'Neues Rezept'}</h2>
     <label class="field"><span>Name</span><input type="text" name="name" value="${esc(r.name)}" placeholder="z. B. Protein-Porridge"></label>
     <label class="field mt"><span>Portionen</span><input type="number" min="1" name="portions" value="${r.portions}"></label>
     <div class="kicker mt-l">Zutaten</div>
     <div data-items class="mt"></div>
     <div class="search mt"><input type="search" placeholder="Zutat suchen" data-q></div>
     <div data-res class="mt"></div>
     <div class="card tight mt" data-sum></div>
     <div class="row gap mt-l">${existing ? '<button class="btn danger grow" data-del>Löschen</button>' : ''}<button class="btn grow" data-track>Eintragen</button><button class="btn primary grow" data-save>Speichern</button></div>`,
    (el, close) => {
      const s = store.get();
      const drawItems = () => {
        el.querySelector('[data-items]').innerHTML = r.items.length
          ? `<div class="list">${r.items.map((it, i) => `<div class="list-item"><div class="meta"><b>${esc(it.name)}</b><small>${it.kcal} kcal</small></div><input type="number" value="${it.grams}" data-ig="${i}" style="width:80px;text-align:right"> g <button class="icon-btn" data-rm="${i}">✕</button></div>`).join('')}</div>`
          : '<p class="muted">Noch keine Zutaten.</p>';
        const sum = totals(r.items);
        const p = Math.max(1, r.portions);
        el.querySelector('[data-sum]').innerHTML = `<b>Pro Portion:</b> ${fmtNum(sum.kcal / p)} kcal · E ${fmtNum(sum.p / p)} g · K ${fmtNum(sum.c / p)} g · F ${fmtNum(sum.f / p)} g`;
        el.querySelectorAll('[data-ig]').forEach((inp) =>
          inp.addEventListener('change', () => {
            const it = r.items[inp.dataset.ig];
            Object.assign(it, entryFrom({ ...it.per100, name: it.name, key: it.key }, Number(inp.value) || 0, 'recipe'));
            drawItems();
          })
        );
        el.querySelectorAll('[data-rm]').forEach((b) =>
          b.addEventListener('click', () => {
            r.items.splice(Number(b.dataset.rm), 1);
            drawItems();
          })
        );
      };
      drawItems();
      const res = el.querySelector('[data-res]');
      let found = [];
      el.querySelector('[data-q]').addEventListener('input', (e) => {
        found = searchLocal(e.target.value, s.customFoods).slice(0, 8);
        res.innerHTML = found.length ? `<div class="list">${found.map((f) => foodRow(f)).join('')}</div>` : '';
      });
      res.addEventListener('click', (e) => {
        const f = found.find((x) => x.key === e.target.closest('[data-f]')?.dataset.f);
        if (!f) return;
        r.items.push(entryFrom(f, f.unit ? f.unit[1] : 100, 'recipe'));
        res.innerHTML = '';
        el.querySelector('[data-q]').value = '';
        drawItems();
      });
      el.querySelector('[name=portions]').addEventListener('input', (e) => {
        r.portions = Math.max(1, Number(e.target.value) || 1);
        drawItems();
      });
      const saveRecipe = () => {
        r.name = el.querySelector('[name=name]').value.trim();
        if (!r.name || !r.items.length) {
          toast('Name und mindestens eine Zutat nötig');
          return false;
        }
        store.update((st) => {
          st.recipes = st.recipes.filter((x) => x.id !== r.id);
          st.recipes.push(r);
        });
        return true;
      };
      el.querySelector('[data-save]').addEventListener('click', () => {
        if (!saveRecipe()) return;
        close();
        toast('Rezept gespeichert');
      });
      el.querySelector('[data-track]').addEventListener('click', () => {
        if (!saveRecipe()) return;
        close();
        amountSheet(recipeAsFood(r), mealForNow(), () => {});
      });
      el.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!(await confirmDialog('Rezept löschen?', { ok: 'Löschen', danger: true }))) return;
        store.update((st) => (st.recipes = st.recipes.filter((x) => x.id !== r.id)));
        close();
      });
    },
    { tall: true }
  );
}
