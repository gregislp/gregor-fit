// Cardio-Aktivitäten mit MET-Werten (bei mittlerer Intensität, RPE 5).
// Kalorien = MET × kg × Stunden; die Intensität skaliert den MET-Wert.
const A = (id, name, icon, met, distance = false) => ({ id, name, icon, met, distance });

export const CARDIO = [
  A('laufen', 'Laufen', '🏃', 9.8, true),
  A('joggen_locker', 'Lockeres Joggen', '🏃', 7, true),
  A('intervall_lauf', 'Intervall-Laufen', '⚡', 11, true),
  A('gehen', 'Spazierengehen', '🚶', 3.5, true),
  A('walking', 'Walking (zügig)', '🚶', 4.8, true),
  A('nordic_walking', 'Nordic Walking', '🥢', 5.5, true),
  A('wandern', 'Wandern', '🥾', 6, true),
  A('radfahren', 'Radfahren', '🚴', 7.5, true),
  A('mtb', 'Mountainbike', '🚵', 8.5, true),
  A('ergometer', 'Fahrradergometer', '🚲', 6.8),
  A('spinning', 'Spinning / Indoor-Cycling', '🚲', 8.5),
  A('rudern', 'Rudergerät', '🚣', 7),
  A('crosstrainer', 'Crosstrainer', '⛷', 5),
  A('stepper', 'Stepper', '🪜', 8.8),
  A('treppensteigen', 'Treppensteigen', '🪜', 8),
  A('laufband_steigung', 'Laufband mit Steigung', '⛰', 7.5, true),
  A('schwimmen', 'Schwimmen', '🏊', 7, true),
  A('aquajogging', 'Aquajogging', '🌊', 6.5),
  A('seilspringen', 'Seilspringen', '🪢', 11),
  A('hiit', 'HIIT-Zirkel', '🔥', 8),
  A('tabata', 'Tabata', '⏱', 9),
  A('boxen', 'Boxen / Sandsack', '🥊', 7.8),
  A('kickboxen', 'Kickboxen', '🥋', 10),
  A('kampfsport', 'Kampfsport', '🥋', 10.3),
  A('fussball', 'Fußball', '⚽', 7),
  A('basketball', 'Basketball', '🏀', 6.5),
  A('handball', 'Handball', '🤾', 8),
  A('volleyball', 'Volleyball', '🏐', 4),
  A('tennis', 'Tennis', '🎾', 7.3),
  A('badminton', 'Badminton', '🏸', 5.5),
  A('squash', 'Squash', '🎾', 12),
  A('tischtennis', 'Tischtennis', '🏓', 4),
  A('padel', 'Padel', '🎾', 6),
  A('golf', 'Golf (zu Fuß)', '⛳', 4.8),
  A('klettern', 'Klettern / Bouldern', '🧗', 8),
  A('tanzen', 'Tanzen', '💃', 5.5),
  A('zumba', 'Zumba / Aerobic', '💃', 6.5),
  A('yoga', 'Yoga', '🧘', 3),
  A('pilates', 'Pilates', '🧘', 3.5),
  A('inline', 'Inlineskaten', '🛼', 7.5, true),
  A('skifahren', 'Skifahren', '⛷', 6),
  A('langlauf', 'Langlauf', '🎿', 9, true),
  A('snowboard', 'Snowboarden', '🏂', 5.3),
  A('eislaufen', 'Eislaufen', '⛸', 7),
  A('sup', 'Stand-up-Paddling', '🏄', 6),
  A('kajak', 'Kajak / Kanu', '🛶', 5),
  A('surfen', 'Surfen', '🏄', 3),
  A('reiten', 'Reiten', '🐎', 5.5),
  A('gartenarbeit', 'Gartenarbeit', '🌱', 3.8),
  A('hausarbeit', 'Hausarbeit (intensiv)', '🧹', 3.5),
  A('crossfit', 'Functional / CrossFit', '🏋', 8),
  A('circuit', 'Zirkeltraining', '🔁', 8),
  A('e_bike', 'E-Bike', '🚲', 4.5, true),
];

export const findCardio = (id) => CARDIO.find((a) => a.id === id);

// RPE 1–10 → Faktor auf den MET-Wert (5 = 1.0)
export function cardioKcal(act, minutes, rpe, kg) {
  if (!act) return 0;
  const factor = 0.55 + rpe * 0.09;
  return Math.round(act.met * factor * kg * (minutes / 60));
}

export const RPE_LABELS = {
  1: 'Sehr leicht', 2: 'Leicht', 3: 'Leicht', 4: 'Moderat', 5: 'Moderat',
  6: 'Etwas anstrengend', 7: 'Anstrengend', 8: 'Sehr anstrengend', 9: 'Extrem', 10: 'Maximal',
};
