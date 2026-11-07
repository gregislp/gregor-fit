// Persistenter App-Zustand in localStorage. Alles bleibt lokal auf dem Gerät.
const KEY = 'gregorfit.v1';

function emptyState() {
  return {
    version: 1,
    profile: null,          // Antworten aus dem Onboarding
    targets: null,          // kcal, Makros, Schritte, Zielgewicht
    plan: null,             // generierter Trainingsplan
    status: { mode: 'active', until: null, location: null },
    statusLog: [],          // { mode, from, to } für Streak-Schutz
    workouts: [],           // abgeschlossene Krafteinheiten
    cardio: [],             // Cardio-Einheiten
    mobility: [],           // Mobility-Einheiten
    mobilityTests: [],      // { date, test, value }
    exerciseState: {},      // exId -> { weight, reps } Progression
    customExercises: [],
    food: {},               // 'YYYY-MM-DD' -> [eintrag]
    customFoods: [],
    favorites: [],          // food keys
    recentFoods: [],        // food-Objekte (zuletzt genutzt)
    recipes: [],
    weights: [],            // { date, kg }
    bodyfat: [],            // { date, pct }
    steps: {},              // date -> n
    water: {},              // date -> ml
    bookmarks: [],          // exIds
    activeSession: null,    // laufendes Workout (übersteht App-Neustart)
    settings: { restSound: true, defaultRest: 90 },
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

export function get() {
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Speichern fehlgeschlagen', e);
  }
  listeners.forEach((fn) => fn(state));
}

// Ändert den Zustand über eine Funktion und speichert danach.
export function update(fn) {
  fn(state);
  save();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || !('version' in data)) {
    throw new Error('Keine gültige FITinMYTWEENTY-Sicherung');
  }
  state = { ...emptyState(), ...data };
  save();
}

export function reset() {
  state = emptyState();
  save();
}
