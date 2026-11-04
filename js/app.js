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

// Beim Zurückkehren in die App an einem neuen Tag neu zeichnen
let lastDay = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== lastDay) {
    lastDay = todayKey();
    render();
  }
});

document.addEventListener('pointerdown', unlockAudio, { once: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
}

render();
