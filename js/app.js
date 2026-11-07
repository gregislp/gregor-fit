// Einstieg: Hash-Router, Tab-Leiste, Service Worker.
import * as store from './store.js';
import { unlockAudio, todayKey } from './util.js';
import onboarding from './views/onboarding.js';
import home from './views/home.js';
import training, { library, exerciseDetail, planEditor } from './views/training.js';
import session from './views/session.js';
import cardio, { cardioRun } from './views/cardio.js';
import mobility, { mobilityRun } from './views/mobility.js';
import nutrition from './views/nutrition.js';
import stats from './views/stats.js';
import profile from './views/profile.js';

const routes = {
  onboarding: { view: onboarding, tabbar: false },
  home: { view: home, tab: 'home' },
  training: { view: training, tab: 'training' },
  library: { view: library, tab: 'training' },
  exercise: { view: exerciseDetail, tab: 'training' },
  plan: { view: planEditor, tab: 'training' },
  session: { view: session, tabbar: false },
  cardio: { view: cardio, tab: 'training' },
  'cardio-run': { view: cardioRun, tabbar: false },
  mobility: { view: mobility, tab: 'training' },
  'mobility-run': { view: mobilityRun, tabbar: false },
  nutrition: { view: nutrition, tab: 'nutrition' },
  stats: { view: stats, tab: 'stats' },
  profile: { view: profile, tab: 'profile' },
};

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
let cleanup = null;

export function go(path) {
  if (location.hash === '#/' + path) render();
  else location.hash = '#/' + path;
}

export function rerender() {
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}

function render() {
  const s = store.get();
  let [name, ...params] = location.hash.replace(/^#\/?/, '').split('/');
  if (!s.profile) name = 'onboarding';
  else if (!name || !routes[name] || name === 'onboarding') name = s.activeSession ? 'session' : 'home';
  const route = routes[name];
  currentRoute = name;
  drawUpdateBanner();

  cleanup?.();
  cleanup = null;
  const showTabbar = route.tabbar !== false;
  tabbar.hidden = !showTabbar;
  app.classList.toggle('no-tabbar', !showTabbar);
  tabbar.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.tab === route.tab));
  const result = route.view(app, params.map(decodeURIComponent));
  if (typeof result === 'function') cleanup = result;
}

let lastPath = null;
window.addEventListener('hashchange', () => {
  const path = location.hash.split('/')[1];
  render();
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
});

// ---------- Updates ----------
// Eine neue sw.js-Version lädt alle Dateien neu und übernimmt sofort (skipWaiting/claim).
// Die laufende Seite zeigt aber noch den alten Code, bis neu geladen wird – daher der Hinweis.
// Während eines laufenden Trainings bleibt er ausgeblendet.
const QUIET_ROUTES = new Set(['session', 'cardio-run', 'mobility-run', 'onboarding']);
let currentRoute = null;
let updateReady = false;
// Ob die Seite schon von einem Service Worker gesteuert wird. Der erste Wechsel nach der
// Erstinstallation ist kein Update; jeder weitere schon.
let hasController = !!navigator.serviceWorker?.controller;

function drawUpdateBanner() {
  let banner = document.getElementById('update-banner');
  if (!updateReady || QUIET_ROUTES.has(currentRoute)) {
    banner?.remove();
    return;
  }
  if (banner) return;
  banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner';
  banner.innerHTML = '<span>✨ Neue Version verfügbar</span><button class="btn small primary">Aktualisieren</button>';
  banner.querySelector('button').addEventListener('click', () => location.reload());
  document.body.appendChild(banner);
}

// Sucht nach einer neuen Version und wartet, bis sie geladen ist. Ergebnis: true = Update bereit.
export async function checkForUpdate() {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (!reg) return false;
  try {
    await reg.update();
  } catch {
    return updateReady; // offline
  }
  const next = reg.installing || reg.waiting;
  if (next) {
    await new Promise((resolve) => {
      next.addEventListener('statechange', () => ['activated', 'redundant'].includes(next.state) && resolve());
      setTimeout(resolve, 20000);
    });
    await new Promise((r) => setTimeout(r, 300)); // controllerchange abwarten
  }
  return updateReady;
}

// Installierte Version vom Service Worker erfragen
export function appVersion() {
  const ctrl = navigator.serviceWorker?.controller;
  if (!ctrl) return Promise.resolve(null);
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data?.version || null);
    ctrl.postMessage('version', [ch.port2]);
    setTimeout(() => resolve(null), 5000); // ein schlafender Service Worker braucht etwas zum Aufwachen
  });
}

let lastDay = todayKey();
let lastCheck = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  // Neuer Tag → neu zeichnen
  if (todayKey() !== lastDay) {
    lastDay = todayKey();
    render();
  }
  // iOS setzt Web-Apps oft nur fort statt neu zu starten → hier selbst nach Updates suchen
  if (Date.now() - lastCheck > 60000) {
    lastCheck = Date.now();
    checkForUpdate();
  }
});

document.addEventListener('pointerdown', unlockAudio, { once: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hasController) {
      hasController = true;
      return;
    }
    updateReady = true;
    drawUpdateBanner();
  });
}

render();
