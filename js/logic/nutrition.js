// Kalorien-/Makroziele und regelbasierte Texterkennung für Mahlzeiten.
import { age } from '../util.js';
import { searchLocal, norm } from '../data/foods.js';

export const ACTIVITY = {
  sitzend: { name: 'Kaum aktiv', desc: 'Überwiegend sitzend, wenig Bewegung', f: 1.2 },
  leicht: { name: 'Leicht aktiv', desc: 'Etwas Bewegung im Alltag', f: 1.375 },
  maessig: { name: 'Mäßig aktiv', desc: 'Viel auf den Beinen', f: 1.55 },
  sehr: { name: 'Sehr aktiv', desc: 'Körperliche Arbeit', f: 1.725 },
};

// Grundumsatz nach Mifflin-St Jeor; mit Körperfett nach Katch-McArdle
export function bmr(p) {
  const kg = p.weight || 75;
  if (p.bodyfat && p.bodyfat > 3 && p.bodyfat < 60) {
    const lbm = kg * (1 - p.bodyfat / 100);
    return 370 + 21.6 * lbm;
  }
  const base = 10 * kg + 6.25 * (p.height || 175) - 5 * age(p.birthday);
  return p.gender === 'w' ? base - 161 : base + 5;
}

export function calcTargets(p) {
  const kg = p.weight || 75;
  const tdee = bmr(p) * (ACTIVITY[p.activity]?.f || 1.375) + ((p.freq || 3) * 300) / 7;
  let kcal = tdee;
  if (p.goal === 'abnehmen') kcal = tdee - Math.min(500, tdee * 0.2);
  else if (p.goal === 'muskel') kcal = tdee + Math.min(300, tdee * 0.1);
  else if (p.goal === 'kraft') kcal = tdee + 150;
  kcal = Math.round(kcal / 10) * 10;
  const protein = Math.round(kg * (p.goal === 'abnehmen' ? 2.0 : 1.8));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const steps = p.activity === 'sitzend' ? 8000 : 10000;
  return { kcal, protein, carbs, fat, steps, tdee: Math.round(tdee), water: Math.round(kg * 35 / 250) * 250, weightGoal: p.weightGoal || null };
}

export function totals(entries) {
  return (entries || []).reduce(
    (t, e) => ({ kcal: t.kcal + e.kcal, p: t.p + e.p, c: t.c + e.c, f: t.f + e.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
}

// Eintrag aus Lebensmittel (pro 100 g) und Menge berechnen
export function entryFrom(food, grams, meal) {
  const k = grams / 100;
  return {
    meal,
    name: food.name,
    key: food.key,
    grams: Math.round(grams),
    kcal: Math.round(food.kcal * k),
    p: Math.round(food.p * k * 10) / 10,
    c: Math.round(food.c * k * 10) / 10,
    f: Math.round(food.f * k * 10) / 10,
    per100: { kcal: food.kcal, p: food.p, c: food.c, f: food.f },
    unit: food.unit || null,
    src: food.src || 'local',
  };
}

const UNIT_WORDS = {
  g: 'g', gr: 'g', gramm: 'g', ml: 'g', l: 'l', liter: 'l', kg: 'kg',
  stueck: 'u', stk: 'u', x: 'u', scheibe: 'u', scheiben: 'u', el: 'u', tl: 'u', portion: 'u', portionen: 'u',
  glas: 'u', glaeser: 'u', tasse: 'u', tassen: 'u', becher: 'u', handvoll: 'u', dose: 'u', schuessel: 'u',
  teller: 'u', flasche: 'u', riegel: 'u', kugel: 'u', scoop: 'u', filet: 'u',
};
const NUM_WORDS = { ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, halbe: 0.5, halber: 0.5, halb: 0.5 };

// "200g Haferflocken, 1 Banane und 2 Eier" → [{ food, grams, text }]
export function parseMealText(text, extraFoods = []) {
  const parts = text
    .replace(/(\d),(\d)/g, '$1.$2') // Dezimalkomma ist kein Trenner
    .split(/,|;|\n|\bund\b|\bmit\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const part of parts) {
    let words = norm(part.replace(/(\d)([a-zA-Z])/g, '$1 $2')).split(/\s+/).filter(Boolean);
    // Dezimalzahlen gehen durch norm verloren -> Zahl aus dem Rohtext lesen
    const rawNum = part.match(/(\d+(?:\.\d+)?)/);
    let qty = null;
    let unit = null;
    if (rawNum) {
      qty = parseFloat(rawNum[1]);
      words = words.filter((w) => !/^\d+$/.test(w));
    } else if (NUM_WORDS[words[0]] != null) {
      qty = NUM_WORDS[words.shift()];
    }
    if (words.length && UNIT_WORDS[words[0]]) unit = UNIT_WORDS[words.shift()];
    const name = words.join(' ');
    if (!name) continue;
    const food = searchLocal(name, extraFoods)[0] || searchLocal(name.split(' ').slice(-1)[0], extraFoods)[0];
    if (!food) {
      out.push({ food: null, grams: 0, text: part });
      continue;
    }
    let grams;
    const portion = food.unit ? food.unit[1] : 100;
    if (unit === 'g') grams = qty ?? 100;
    else if (unit === 'kg') grams = (qty ?? 1) * 1000;
    else if (unit === 'l') grams = (qty ?? 1) * 1000;
    else grams = (qty ?? 1) * portion;
    out.push({ food, grams, text: part });
  }
  return out;
}
