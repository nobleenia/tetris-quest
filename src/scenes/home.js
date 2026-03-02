/**
 * Stackr Quest — Home Scene
 *
 * Landing screen with Adventure Mode, Classic Mode, Shop,
 * and lives/coins display.
 */

import { getLives, getCoins, getTotalStars } from '../systems/progress.js';

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

    // Hide game board and sidebar while on home
    const boardSection = document.querySelector('#board');
    if (boardSection) boardSection.style.display = 'none';
    const sidebar = document.querySelector('#sidebar');
    if (sidebar) sidebar.style.display = 'none';

    render(ctx);
  },

  exit(_ctx) {
    if (containerEl) containerEl.innerHTML = '';
    // Show game elements again
    const boardSection = document.querySelector('#board');
    if (boardSection) boardSection.style.display = '';
    const sidebar = document.querySelector('#sidebar');
    if (sidebar) sidebar.style.display = '';
  },
};

function render(ctx) {
  if (!containerEl) return;

  const { lives } = getLives();
  const coins = getCoins();
  const totalStars = getTotalStars();

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
        <button class="btn home__btn home__btn--classic" data-action="classic">
          🎮 Classic Mode
        </button>
      </div>

      <div class="home__secondary">
        <button class="btn btn--secondary btn--small" data-action="shop">🛒 Shop</button>
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
    } else if (action === 'classic') {
      ctx.router.navigate('#/play/classic');
    } else if (action === 'shop') {
      ctx.router.navigate('#/shop');
    }
  });
}
