// Übungsanimationen: animierte 2D-Figur (Seitenansicht) per SVG.
// Eine Pose besteht aus Gelenkwinkeln in Grad im Körperkoordinatensystem
// (0 = nach unten, 90 = nach vorne, 180 = nach oben, -90 = nach hinten; die Figur schaut nach rechts):
//   rot   Drehung der ganzen Figur um die Hüfte (+ = im Uhrzeigersinn; 90 = Bauchlage, -90 = Rückenlage)
//   trunk Oberkörperneigung (+ = nach vorne)
//   sh    Oberarm, el Ellbogenbeugung (Unterarm = sh + el)
//   hip   Oberschenkel, knee Kniebeugung (Unterschenkel = hip − knee); hip2/knee2 = hinteres Bein
//   ankle Fußwinkel (− = Ferse hoch)
// Pro Übung wird zwischen Pose a und b hin- und herinterpoliert.
import { findExercise } from '../data/exercises.js';

// Segmentlängen so gewählt, dass auch „Arme über Kopf“ stehend ins Bild passt
const L = { torso: 42, neck: 5, head: 9, upper: 23, fore: 22, thigh: 32, shin: 32, foot: 10 };
const G = 168; // Bodenlinie
const W = 240;

const rad = (d) => (d * Math.PI) / 180;
const dir = (a) => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, d, len) => [p[0] + d[0] * len, p[1] + d[1] * len];

const BASE = { rot: 0, trunk: 0, sh: 0, el: 0, hip: 0, knee: 0, ankle: 0 };

// Bewegungsmuster. anchor: welcher Punkt bleibt horizontal fix ('foot' | 'hip' | 'hand');
// hang: Figur hängt an den Händen (sonst steht der tiefste Punkt auf dem Boden).
// Ausstattung: bench ('torso'|'shoulder'|'hand'|'hip'|'incline'), seat, wall, bar, cable/band ('top'|'front'|'back'|'low').
const P = {
  squat_bw: { a: { sh: 90 }, b: { trunk: 35, hip: 100, knee: 115, sh: 90 } },
  squat_bar: { a: { trunk: 5, sh: -30, el: -140 }, b: { trunk: 40, hip: 100, knee: 115, sh: 5, el: -140 } },
  squat_goblet: { a: { sh: 20, el: 150 }, b: { trunk: 30, hip: 100, knee: 115, sh: 45, el: 140 } },
  squat_half: { a: { trunk: 10, hip: 30, knee: 35, sh: 40, el: 60 }, b: { trunk: 15, hip: 45, knee: 55, sh: 40, el: 60 } },
  wall_sit: { a: { hip: 90, knee: 90, sh: 60 }, b: { hip: 90, knee: 90, sh: 62, trunk: 2 }, wall: true },
  lunge: { a: { hip: 25, knee: 5, hip2: -20, knee2: 5 }, b: { hip: 80, knee: 85, hip2: -15, knee2: 75 } },
  leg_press: { a: { rot: -50, hip: 120, knee: 125, sh: 20 }, b: { rot: -50, hip: 45, knee: 10, sh: 20 }, anchor: 'hip', seat: true },
  leg_ext: { a: { hip: 90, knee: 90, sh: 20 }, b: { hip: 90, knee: 5, sh: 20 }, anchor: 'hip', seat: true },
  leg_curl: { a: { hip: 90, knee: 5, sh: 20 }, b: { hip: 90, knee: 100, sh: 20 }, anchor: 'hip', seat: true },
  deadlift: { a: { trunk: 55, hip: 70, knee: 90 }, b: {} },
  rdl: { a: { knee: 10 }, b: { trunk: 80, hip: 10, knee: 20 } },
  swing: { a: { trunk: 70, hip: 30, knee: 35, sh: -15 }, b: { trunk: -5, sh: 90 } },
  nordic: { a: { hip: 0, knee: 90, sh: 10 }, b: { trunk: 60, hip: -60, knee: 30, sh: 90 }, anchor: 'hip' },
  bridge: { a: { rot: -90, hip: 45, knee: 105, sh: 0 }, b: { rot: -110, hip: 10, knee: 120, sh: 20 }, anchor: 'foot' },
  hip_thrust: { a: { rot: -90, hip: 45, knee: 105, sh: 0 }, b: { rot: -110, hip: 10, knee: 120, sh: 20 }, anchor: 'foot', bench: 'shoulder' },
  calf: { a: { sh: 0 }, b: { ankle: -35 } },
  bench_press: { a: { rot: -90, knee: 90, sh: 90 }, b: { rot: -90, knee: 90, sh: -50, el: 140 }, anchor: 'hip', bench: 'torso' },
  bench_incline: { a: { rot: -55, hip: 25, knee: 80, sh: 125 }, b: { rot: -55, hip: 25, knee: 80, sh: -40, el: 165 }, anchor: 'hip', bench: 'incline' },
  bench_fly: { a: { rot: -90, knee: 90, sh: 90, el: 15 }, b: { rot: -90, knee: 90, sh: -60, el: 25 }, anchor: 'hip', bench: 'torso' },
  chest_press_seated: { a: { hip: 90, knee: 90, sh: -60, el: 150 }, b: { hip: 90, knee: 90, sh: 90 }, anchor: 'hip', seat: true },
  standing_press: { a: { trunk: 10, hip: 15, hip2: -15, knee2: 5, sh: -60, el: 150 }, b: { trunk: 10, hip: 15, hip2: -15, knee2: 5, sh: 90 }, band: 'back' },
  standing_fly: { a: { trunk: 15, hip: 15, hip2: -15, knee2: 5, sh: 140, el: 20 }, b: { trunk: 15, hip: 15, hip2: -15, knee2: 5, sh: 70, el: 15 }, cable: 'top' },
  pushup: { a: { rot: 75, sh: 75 }, b: { rot: 88, sh: -47, el: 135 } },
  pike: { a: { rot: 135, hip: 105, sh: 135 }, b: { rot: 125, hip: 95, sh: 205, el: -80 } },
  dips: { a: { trunk: 10, hip: 20, knee: 70 }, b: { trunk: 25, hip: 20, knee: 70, sh: -60, el: 60 }, anchor: 'hand', hang: true, bar: 'short' },
  bench_dips: { a: { hip: 90, sh: -10 }, b: { hip: 90, sh: -70, el: 70 }, anchor: 'hand', bench: 'hand' },
  pullup: { a: { sh: 180, hip: 10, knee: 40 }, b: { sh: 330, el: 210, hip: 10, knee: 40 }, anchor: 'hand', hang: true, bar: 'long' },
  lat_pulldown: { a: { hip: 90, knee: 90, sh: 180 }, b: { hip: 90, knee: 90, sh: 330, el: 210 }, anchor: 'hip', seat: true, cable: 'top' },
  seated_row: { a: { trunk: 10, hip: 90, knee: 20, sh: 90 }, b: { trunk: -10, hip: 90, knee: 20, sh: -30, el: 120 }, anchor: 'hip', cable: 'front' },
  bent_row: { a: { trunk: 70, hip: 15, knee: 25 }, b: { trunk: 70, hip: 15, knee: 25, sh: -60, el: 60 } },
  inverted_row: { a: { rot: -70, sh: 70 }, b: { rot: -70, sh: 0, el: 110 }, anchor: 'hand', hang: true, bar: 'table' },
  face_pull: { a: { sh: 90 }, b: { sh: 110, el: 130 }, cable: 'front' },
  superman: { a: { rot: 90, sh: 180 }, b: { rot: 90, trunk: -15, hip: -15, sh: 195 }, anchor: 'hip' },
  hyperext: { a: { rot: 90, trunk: 70, sh: 120, el: 150 }, b: { rot: 90, sh: 160, el: 150 }, anchor: 'hip', bench: 'hip' },
  ohp: { a: { sh: 30, el: 150 }, b: { sh: 180 } },
  ohp_seated: { a: { hip: 90, knee: 90, sh: 30, el: 150 }, b: { hip: 90, knee: 90, sh: 180 }, anchor: 'hip', seat: true },
  lateral_raise: { a: { sh: 5, el: 10 }, b: { sh: 85, el: 10 } },
  reverse_fly: { a: { trunk: 75, hip: 15, knee: 25, el: 10 }, b: { trunk: 75, hip: 15, knee: 25, sh: -75, el: 10 } },
  curl: { a: { el: 5 }, b: { sh: 10, el: 140 } },
  pushdown: { a: { trunk: 10, sh: 10, el: 110 }, b: { trunk: 10, sh: 5 }, cable: 'top' },
  overhead_ext: { a: { sh: 170, el: 140 }, b: { sh: 175 } },
  plank: { a: { rot: 82, sh: 82, el: 90 }, b: { rot: 84, sh: 84, el: 90 } },
  crunch: { a: { rot: -90, hip: 55, knee: 110, sh: 160, el: 150 }, b: { rot: -90, trunk: 35, hip: 55, knee: 110, sh: 195, el: 150 }, anchor: 'hip' },
  kneel_crunch: { a: { knee: 90, trunk: 10, sh: 160, el: 150 }, b: { knee: 90, trunk: 70, sh: 220, el: 150 }, anchor: 'hip', cable: 'top' },
  leg_raise: { a: { rot: -90 }, b: { rot: -90, hip: 90 }, anchor: 'hip' },
  hanging_raise: { a: { sh: 180 }, b: { sh: 180, hip: 90, knee: 10 }, anchor: 'hand', hang: true, bar: 'long' },
  dead_bug: { a: { rot: -90, sh: 90, hip: 90, knee: 90 }, b: { rot: -90, sh: 170, hip: 10, knee: 0, hip2: 90, knee2: 90 }, anchor: 'hip' },
  climber: { a: { rot: 70, sh: 70 }, b: { rot: 70, sh: 70, hip: 100, knee: 110, hip2: 0, knee2: 0 } },
  pallof: { a: { hip: 10, knee: 10, sh: 10, el: 140 }, b: { hip: 10, knee: 10, sh: 90 }, band: 'front' },
  ab_wheel: { a: { knee: 90, trunk: 45, sh: 40 }, b: { trunk: 80, hip: -55, knee: 35, sh: 165 }, anchor: 'hip' },
};

// Übung → Muster (fehlende Übungen nutzen das Muster ihres Hauptmuskels)
const MAP = {
  bankdruecken: 'bench_press', kh_bankdruecken: 'bench_press', enges_bankdruecken: 'bench_press',
  schraegbank_kh: 'bench_incline', schraegbank_lh: 'bench_incline', flys_kh: 'bench_fly',
  brustpresse: 'chest_press_seated', butterfly: 'chest_press_seated', band_brustpresse: 'standing_press', kabel_crossover: 'standing_fly',
  liegestuetz: 'pushup', liegestuetz_erhoeht: 'pushup', enge_liegestuetz: 'pushup', dips: 'dips', bankdips: 'bench_dips',
  klimmzug: 'pullup', chinup: 'pullup', negativ_klimmzug: 'pullup', latzug: 'lat_pulldown',
  kabelrudern: 'seated_row', band_rudern: 'seated_row', ruderzug_maschine: 'seated_row',
  lh_rudern: 'bent_row', kh_rudern: 'bent_row', kb_rudern: 'bent_row', tischrudern: 'inverted_row',
  face_pull: 'face_pull', band_pull_apart: 'face_pull', superman: 'superman', hyperextension: 'hyperext',
  ohp: 'ohp', kh_schulterdruecken: 'ohp', kb_press: 'ohp', schulterpresse: 'ohp_seated', pike_pushup: 'pike',
  seitheben: 'lateral_raise', band_seitheben: 'lateral_raise', kabel_seitheben: 'lateral_raise', reverse_flys: 'reverse_fly',
  kh_curl: 'curl', hammer_curl: 'curl', lh_curl: 'curl', band_curl: 'curl', kabel_curl: 'curl',
  trizeps_pushdown: 'pushdown', band_trizeps: 'pushdown', ueberkopf_trizeps: 'overhead_ext',
  kniebeuge: 'squat_bar', goblet_squat: 'squat_goblet', kb_goblet: 'squat_goblet', squat_kg: 'squat_bw',
  bulgarian: 'lunge', ausfallschritt: 'lunge', kh_ausfallschritt: 'lunge', step_up: 'lunge',
  beinpresse: 'leg_press', beinstrecker: 'leg_ext', wandsitzen: 'wall_sit',
  kreuzheben: 'deadlift', rdl: 'rdl', kh_rdl: 'rdl', einbein_rdl: 'rdl', kb_swing: 'swing',
  beinbeuger_maschine: 'leg_curl', nordic_curl: 'nordic', hip_thrust: 'hip_thrust', kh_hip_thrust: 'hip_thrust',
  glute_bridge: 'bridge', band_abduktion: 'squat_half', abduktor_maschine: 'squat_half',
  wadenheben: 'calf', kh_wadenheben: 'calf', wadenmaschine: 'calf',
  plank: 'plank', seitstuetz: 'plank', crunch: 'crunch', russian_twist: 'crunch', kabel_crunch: 'kneel_crunch',
  beinheben: 'leg_raise', haengendes_beinheben: 'hanging_raise', dead_bug: 'dead_bug', mountain_climber: 'climber',
  pallof: 'pallof', ab_wheel: 'ab_wheel',
};
const BY_MUSCLE = {
  brust: 'pushup', ruecken: 'bent_row', schultern: 'ohp', bizeps: 'curl', trizeps: 'pushdown', quads: 'squat_bw',
  hamstrings: 'rdl', gluteus: 'bridge', waden: 'calf', bauch: 'crunch', lowback: 'superman',
};

// Welche Körpersegmente ein Muskel einfärbt
const SEG = {
  brust: ['torso'], ruecken: ['torso'], bauch: ['torso'], lowback: ['torso'],
  schultern: ['upper'], bizeps: ['upper'], trizeps: ['upper'],
  quads: ['thigh', 'thigh2'], hamstrings: ['thigh', 'thigh2'], gluteus: ['hipdot'], waden: ['shin', 'shin2'],
};

export function patternFor(ex) {
  if (!ex) return P.squat_bw;
  return P[MAP[ex.id]] || P[BY_MUSCLE[ex.muscle]] || P.squat_bw;
}

// Gelenkpositionen für eine Pose (Hüfte im Ursprung, danach Drehung)
function solve(p) {
  const t = p.trunk;
  const up = dir(180 - t);
  const hip = [0, 0];
  const sh = add(hip, up, L.torso);
  const neck = add(sh, up, L.neck);
  const head = add(neck, up, L.head);
  const elbow = add(sh, dir(p.sh), L.upper);
  const hand = add(elbow, dir(p.sh + p.el), L.fore);
  const leg = (h, k) => {
    const knee = add(hip, dir(h), L.thigh);
    const ankle = add(knee, dir(h - k), L.shin);
    const toe = add(ankle, dir(h - k + 90 + p.ankle), L.foot);
    return { knee, ankle, toe };
  };
  const l1 = leg(p.hip, p.knee);
  const l2 = leg(p.hip2 ?? p.hip, p.knee2 ?? p.knee);
  const pts = { hip, sh, neck, head, elbow, hand, knee: l1.knee, ankle: l1.ankle, toe: l1.toe, knee2: l2.knee, ankle2: l2.ankle, toe2: l2.toe };
  const r = rad(p.rot);
  const c = Math.cos(r), s = Math.sin(r);
  for (const k in pts) {
    const [x, y] = pts[k];
    pts[k] = [x * c - y * s, x * s + y * c];
  }
  return pts;
}

function bounds(pts) {
  const xs = Object.values(pts).map((p) => p[0]);
  const ys = Object.values(pts).map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys) - L.head, maxY: Math.max(...ys) };
}

const lerpPose = (a, b, k) => {
  const o = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key], vb = b[key];
    o[key] = va == null ? vb : vb == null ? va : va + (vb - va) * k;
  }
  return o;
};

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent?.appendChild(e);
  return e;
};

function propKind(ex) {
  if (!ex) return null;
  if (ex.equip.includes('lh')) return 'plate';
  if (ex.equip.includes('kh')) return 'db';
  if (ex.equip.includes('kb')) return 'kb';
  return null;
}

// Baut die Animation in ein <svg> und startet sie. Gibt eine Stopp-Funktion zurück.
// opts.still: feste Phase 0..1 statt Animation (für die Kontrollseite)
export function mountAnimation(svg, ex, opts = {}) {
  const pat = patternFor(ex);
  const A = { ...BASE, ...pat.a };
  const B = { ...BASE, ...pat.b };
  const anchor = pat.anchor || 'foot';
  const anchorKey = anchor === 'foot' ? 'ankle' : anchor;

  // Ausrichtung aus Pose A: horizontal zentrieren, vertikal auf den Boden bzw. an die Stange
  const ptsA = solve(A);
  const bA = bounds(ptsA);
  const targetX = ptsA[anchorKey][0] + (W / 2 - (bA.minX + bA.maxX) / 2);
  const handTargetY = ptsA.hand[1] + (24 - bA.minY);
  const place = (pts) => {
    const b = bounds(pts);
    const tx = targetX - pts[anchorKey][0];
    const ty = pat.hang ? handTargetY - pts.hand[1] : G - b.maxY;
    const out = {};
    for (const k in pts) out[k] = [pts[k][0] + tx, pts[k][1] + ty];
    return out;
  };
  const fixA = place(ptsA);

  // Bildausschnitt an die Bewegung anpassen (liegende Übungen brauchen weniger Höhe)
  const frames = [0, 0.5, 1].map((k) => bounds(place(solve(lerpPose(A, B, k)))));
  const top = Math.max(0, Math.min(G - 100, Math.min(...frames.map((f) => f.minY), pat.cable || pat.band ? 6 : G) - 14));
  // Hängende Figuren können unter die Bodenlinie reichen
  const bottom = Math.max(G + 10, ...frames.map((f) => f.maxY + 10));
  svg.setAttribute('viewBox', `0 ${top.toFixed(0)} ${W} ${(bottom - top).toFixed(0)}`);
  svg.innerHTML = '';
  const hi = new Set((SEG[ex?.muscle] || []));
  const hi2 = new Set((ex?.sec || []).flatMap((m) => SEG[m] || []).filter((s) => !hi.has(s)));
  const cls = (name) => `seg ${hi.has(name) ? 'hi' : hi2.has(name) ? 'hi2' : ''}`;

  el('line', { x1: 8, x2: W - 8, y1: G + 1, y2: G + 1, class: 'ground' }, svg);

  // Feste Ausstattung (aus Pose A)
  const gear = el('g', { class: 'gear' }, svg);
  const benchAt = (x1, x2, y) => {
    el('rect', { x: Math.min(x1, x2), y, width: Math.abs(x2 - x1), height: 6, rx: 3 }, gear);
    el('line', { x1: (x1 + x2) / 2, x2: (x1 + x2) / 2, y1: y + 6, y2: G }, gear);
  };
  if (pat.bench === 'torso') benchAt(fixA.sh[0] - 8, fixA.hip[0] + 8, Math.max(fixA.sh[1], fixA.hip[1]) + 5);
  if (pat.bench === 'shoulder') benchAt(fixA.sh[0] - 34, fixA.sh[0] + 6, fixA.sh[1] - 2);
  if (pat.bench === 'hand') benchAt(fixA.hand[0] - 30, fixA.hand[0] + 4, fixA.hand[1] + 2);
  if (pat.bench === 'hip') benchAt(fixA.hip[0] - 36, fixA.hip[0] + 6, fixA.hip[1] + 5);
  if (pat.bench === 'incline') {
    el('line', { x1: fixA.hip[0] + 4, y1: fixA.hip[1] + 6, x2: fixA.sh[0] - 4, y2: fixA.sh[1] + 6, class: 'thick' }, gear);
    el('line', { x1: fixA.hip[0], x2: fixA.hip[0], y1: fixA.hip[1] + 6, y2: G }, gear);
  }
  if (pat.seat && G - fixA.hip[1] - 5 > 4) el('rect', { x: fixA.hip[0] - 16, y: fixA.hip[1] + 5, width: 26, height: G - fixA.hip[1] - 5, rx: 3 }, gear);
  if (pat.wall) el('line', { x1: fixA.sh[0] - 7, x2: fixA.sh[0] - 7, y1: G, y2: G - 130, class: 'thick' }, gear);
  if (pat.bar === 'long') el('line', { x1: fixA.hand[0] - 34, x2: fixA.hand[0] + 34, y1: fixA.hand[1], y2: fixA.hand[1], class: 'thick' }, gear);
  if (pat.bar === 'short') el('line', { x1: fixA.hand[0] - 18, x2: fixA.hand[0] + 18, y1: fixA.hand[1] + 2, y2: fixA.hand[1] + 2, class: 'thick' }, gear);
  if (pat.bar === 'table') {
    el('line', { x1: fixA.hand[0] - 40, x2: fixA.hand[0] + 6, y1: fixA.hand[1], y2: fixA.hand[1], class: 'thick' }, gear);
    el('line', { x1: fixA.hand[0] - 36, x2: fixA.hand[0] - 36, y1: fixA.hand[1], y2: G }, gear);
  }
  const lineTo = pat.cable || pat.band || (ex?.equip.includes('kabel') ? 'top' : ex?.equip.includes('band') ? 'low' : null);
  const lineAnchor = lineTo && { top: [fixA.hand[0] + 6, 6], front: [W - 10, fixA.hand[1]], back: [10, fixA.hand[1]], low: [fixA.ankle[0] + 4, G] }[lineTo];
  const cableLine = lineAnchor && el('line', { class: ex?.equip.includes('band') || pat.band ? 'band' : 'cable' }, svg);

  // Körper (hinteres Bein zuerst, gedimmt)
  const back = el('g', { class: 'back' }, svg);
  const s = {
    thigh2: el('line', { class: cls('thigh2') }, back),
    shin2: el('line', { class: cls('shin2') }, back),
    foot2: el('line', { class: 'seg' }, back),
    thigh: el('line', { class: cls('thigh') }, svg),
    shin: el('line', { class: cls('shin') }, svg),
    foot: el('line', { class: 'seg' }, svg),
    torso: el('line', { class: cls('torso') + ' torso' }, svg),
    neck: el('line', { class: 'seg' }, svg),
    head: el('circle', { r: L.head - 1, class: 'head' }, svg),
    hipdot: el('circle', { r: 7, class: `joint ${hi.has('hipdot') ? 'hi' : hi2.has('hipdot') ? 'hi2' : ''}` }, svg),
    upper: el('line', { class: cls('upper') }, svg),
    fore: el('line', { class: 'seg' }, svg),
  };
  const kind = propKind(ex);
  const prop = kind === 'plate' ? el('circle', { r: 9, class: 'prop' }, svg)
    : kind === 'db' ? el('rect', { width: 12, height: 7, rx: 2, class: 'prop' }, svg)
    : kind === 'kb' ? el('circle', { r: 6, class: 'prop fill' }, svg) : null;

  const seg = (e, p, q) => {
    e.setAttribute('x1', p[0].toFixed(1)); e.setAttribute('y1', p[1].toFixed(1));
    e.setAttribute('x2', q[0].toFixed(1)); e.setAttribute('y2', q[1].toFixed(1));
  };
  const draw = (k) => {
    const pt = place(solve(lerpPose(A, B, k)));
    seg(s.thigh2, pt.hip, pt.knee2); seg(s.shin2, pt.knee2, pt.ankle2); seg(s.foot2, pt.ankle2, pt.toe2);
    seg(s.thigh, pt.hip, pt.knee); seg(s.shin, pt.knee, pt.ankle); seg(s.foot, pt.ankle, pt.toe);
    seg(s.torso, pt.hip, pt.sh); seg(s.neck, pt.sh, pt.neck);
    s.head.setAttribute('cx', pt.head[0].toFixed(1)); s.head.setAttribute('cy', pt.head[1].toFixed(1));
    s.hipdot.setAttribute('cx', pt.hip[0].toFixed(1)); s.hipdot.setAttribute('cy', pt.hip[1].toFixed(1));
    seg(s.upper, pt.sh, pt.elbow); seg(s.fore, pt.elbow, pt.hand);
    if (cableLine) seg(cableLine, pt.hand, lineAnchor);
    if (prop?.tagName === 'circle') { prop.setAttribute('cx', pt.hand[0].toFixed(1)); prop.setAttribute('cy', pt.hand[1].toFixed(1)); }
    if (prop?.tagName === 'rect') { prop.setAttribute('x', (pt.hand[0] - 6).toFixed(1)); prop.setAttribute('y', (pt.hand[1] - 3.5).toFixed(1)); }
  };

  // Hin und zurück mit kurzer Pause an den Umkehrpunkten
  const period = 2800;
  let raf = 0;
  const t0 = performance.now();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const frame = (now) => {
    if (!svg.isConnected) return;
    const ph = ((now - t0) % period) / period;
    const k = (1 - Math.cos(Math.min(1, Math.max(0, (ph < 0.5 ? ph : 1 - ph) * 2.4 - 0.1)) * Math.PI)) / 2;
    draw(k);
    raf = requestAnimationFrame(frame);
  };
  if (opts.still != null) {
    draw(opts.still);
    return () => {};
  }
  draw(0);
  if (reduce) draw(1);
  else raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// Startet alle <svg data-anim="exId"> innerhalb von root
export function startAnimations(root, custom = []) {
  const stops = [...root.querySelectorAll('svg[data-anim]')].map((svg) => mountAnimation(svg, findExercise(svg.dataset.anim, custom)));
  return () => stops.forEach((f) => f());
}

export const animSvg = (exId, cls = '') => `<svg class="anim ${cls}" data-anim="${exId}" role="img" aria-label="Bewegungsanimation"></svg>`;

export { P as PATTERNS, MAP as ANIM_MAP };
