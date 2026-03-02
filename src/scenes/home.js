/**
 * Stackr Quest — Home Scene
 *
 * Landing screen with Adventure Mode, Classic Mode, Shop,
 * and lives/coins display.
 */

import { getLives, getCoins, getTotalStars } from '../systems/progress.js';
import { getDailyStatus, generateDailyChallenge } from '../game/dailyChallenge.js';
import { hideGameUI, showGameUI } from './helpers.js';
import { getProfile, hasRealAccount } from '../systems/auth.js';
import { isSupabaseConfigured } from '../systems/supabase.js';

let containerEl = null;

export const homeScene = {
  id: 'home',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="home"]');
    if (!sceneEl) return;
    containerEl = sceneEl;

    // Hide the legacy overlay if it exists
    const legacyOverlay = document.querySelector('#homeOverlay');
    if (legacyOverlay) legacyOverlay.classList.add('hidden');

    // Hide game-only elements while on home
    hideGameUI();

    render(ctx);
  },

  exit(_ctx) {
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

  const streakBadge = daily.streak >= 3 ? `<span class="home__streak-badge">🔥 ${daily.streak} day streak!</span>` : '';
  const dailyDoneClass = daily.completedToday ? 'home__btn--daily-done' : '';
  const dailyLabel = daily.completedToday
    ? `✅ Daily Done — ⭐ ${daily.todayResult.stars}`
    : `📅 Daily Challenge`;
  const dailySubtext = daily.completedToday ? '' : `<span class="home__daily-hint">${dailyChallenge.objective.description}</span>`;

  containerEl.innerHTML = /* html */ `
    <div class="home">
      <div class="home__hero">
        <h1 class="home__title">Stackr Quest</h1>
        <p class="home__tagline">A block-stacking puzzle adventure</p>
      </div>

      <div class="home__stats">
        <span class="home__stat">⭐ ${totalStars}</span>
        <span class="home__stat">❤️ ${lives}</span>
        <span class="home__stat">🪙 ${coins}</span>
      </div>

      <div class="home__actions">
        <button class="btn home__btn home__btn--adventure" data-action="adventure">
          🗺️ Adventure Mode
        </button>
        <button class="btn home__btn home__btn--daily ${dailyDoneClass}" data-action="daily">
          ${dailyLabel}
          ${dailySubtext}
        </button>
        <button class="btn home__btn home__btn--classic" data-action="classic">
          🎮 Classic Mode
        </button>
      </div>

      ${streakBadge}

      <div class="home__secondary">
        <button class="btn btn--secondary btn--small" data-action="shop">🛒 Shop</button>
        <button class="btn btn--secondary btn--small" data-action="leaderboard">🏆 Leaderboards</button>
        ${isSupabaseConfigured ? `
          <button class="btn btn--secondary btn--small" data-action="account">
            ${hasRealAccount() ? `👤 ${getProfile().displayName}` : '🔐 Sign In'}
          </button>` : ''}
      </div>
    </div>
  `;

  wireEvents(ctx);
}

function wireEvents(ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'adventure') {
      ctx.router.navigate('#/map');
    } else if (action === 'daily') {
      ctx.router.navigate('#/play/daily');
    } else if (action === 'classic') {
      ctx.router.navigate('#/play/classic');
    } else if (action === 'shop') {
      ctx.router.navigate('#/shop');
    } else if (action === 'leaderboard') {
      ctx.router.navigate('#/leaderboard');
    } else if (action === 'account') {
      ctx.router.navigate('#/account');
    }
  });
}
