/**
 * Stackr Quest — Play Menu Scene
 *
 * Mode selection screen shown after tapping "Play!" on the splash page.
 * Shows Adventure / Classic / Daily Challenge as primary choices,
 * with Shop and Leaderboard below in the same visual weight.
 */

import { getLives, getCoins, getTotalStars } from '../systems/progress.js';
import { getDailyStatus, generateDailyChallenge } from '../game/dailyChallenge.js';
import { hideGameUI, showGameUI } from './helpers.js';

let containerEl = null;
let _abort = null;

export const playMenuScene = {
  id: 'play-menu',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="play-menu"]');
    if (!sceneEl) return;
    containerEl = sceneEl;
    _abort = new AbortController();

    hideGameUI();
    render(ctx);
  },

  exit(_ctx) {
    if (_abort) { _abort.abort(); _abort = null; }
    if (containerEl) containerEl.innerHTML = '';
    showGameUI();
  },
};

function render(ctx) {
  if (!containerEl) return;

  const { lives } = getLives();
  const coins = getCoins();
  const totalStars = getTotalStars();
  const daily = getDailyStatus();
  const dailyChallenge = generateDailyChallenge();

  const dailyDoneClass = daily.completedToday ? 'pm__card--done' : '';
  const dailyLabel = daily.completedToday
    ? `Daily Done — ⭐ ${daily.todayResult?.stars ?? 0}`
    : 'Daily Challenge';
  const dailySubtext = daily.completedToday
    ? ''
    : `<span class="pm__card-hint">${dailyChallenge.objective.description}</span>`;

  const streakBadge = daily.streak >= 3
    ? `<div class="pm__streak">🔥 ${daily.streak}-day streak!</div>`
    : '';

  containerEl.innerHTML = /* html */ `
    <div class="play-menu">
      <button class="pm__back" data-action="back" aria-label="Back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div class="pm__stats-bar">
        <span class="pm__stat">⭐ ${totalStars}</span>
        <span class="pm__stat">❤️ ${lives}</span>
        <span class="pm__stat">🪙 ${coins}</span>
      </div>

      <h2 class="pm__heading">Choose Mode</h2>

      <div class="pm__grid">
        <button class="pm__card pm__card--adventure" data-action="adventure">
          <span class="pm__card-icon">🗺️</span>
          <span class="pm__card-label">Adventure</span>
          <span class="pm__card-hint">200 puzzle levels</span>
        </button>

        <button class="pm__card pm__card--classic" data-action="classic">
          <span class="pm__card-icon">🎮</span>
          <span class="pm__card-label">Classic</span>
          <span class="pm__card-hint">Endless survival</span>
        </button>

        <button class="pm__card pm__card--daily ${dailyDoneClass}" data-action="daily">
          <span class="pm__card-icon">${daily.completedToday ? '✅' : '📅'}</span>
          <span class="pm__card-label">${dailyLabel}</span>
          ${dailySubtext}
        </button>
      </div>

      ${streakBadge}

      <div class="pm__extras">
        <button class="pm__extra-btn" data-action="shop">
          <span class="pm__extra-icon">🛒</span>
          <span>Shop</span>
        </button>
        <button class="pm__extra-btn" data-action="leaderboard">
          <span class="pm__extra-icon">🏆</span>
          <span>Leaderboards</span>
        </button>
      </div>
    </div>
  `;

  wireEvents(ctx);
}

function wireEvents(ctx) {
  if (!containerEl || !_abort) return;
  const signal = _abort.signal;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'back':       ctx.router.navigate('#/'); break;
      case 'adventure':  ctx.router.navigate('#/map'); break;
      case 'daily':      ctx.router.navigate('#/play/daily'); break;
      case 'classic':    ctx.router.navigate('#/play/classic'); break;
      case 'shop':       ctx.router.navigate('#/shop'); break;
      case 'leaderboard': ctx.router.navigate('#/leaderboard'); break;
    }
  }, { signal });
}
