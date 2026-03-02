/**
 * Stackr Quest — Shop Scene
 *
 * Grid of purchasable items: power-ups (with coin prices),
 * life refills. Clean mobile UI with purchase confirmation.
 */

import { getCoins, spendCoins, addPowerup, getLives, refillLives } from '../systems/progress.js';
import { POWERUPS, POWERUP_IDS } from '../game/powerups.js';

let containerEl = null;

export const shopScene = {
  id: 'shop',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="shop"]');
    if (!sceneEl) return;
    containerEl = sceneEl;
    render(ctx);
  },

  exit(_ctx) {
    if (containerEl) containerEl.innerHTML = '';
  },
};

// ─── Render ──────────────────────────────────────────────────────────

function render(ctx) {
  if (!containerEl) return;

  const coins = getCoins();
  const { lives, maxLives, nextRegenMs } = getLives();
  const lifeRefillCost = 300;

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel shop">
        <header class="shop__header">
          <button class="btn btn--small" data-action="back" aria-label="Back">← Back</button>
          <h2 class="overlay__title shop__title">🛒 Shop</h2>
          <span class="shop__balance">🪙 ${coins}</span>
        </header>

        <section class="shop__section">
          <h3 class="shop__section-title">Power-ups</h3>
          <div class="shop__grid">
            ${POWERUP_IDS.map((id) => {
              const def = POWERUPS[id];
              const canAfford = coins >= def.cost;
              return /* html */ `
                <button class="shop__item ${canAfford ? '' : 'shop__item--disabled'}"
                        data-action="buy-powerup"
                        data-powerup="${id}"
                        ${canAfford ? '' : 'disabled'}>
                  <span class="shop__item-icon">${def.icon}</span>
                  <span class="shop__item-name">${def.name}</span>
                  <span class="shop__item-desc">${def.description}</span>
                  <span class="shop__item-cost">${def.cost} 🪙</span>
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <section class="shop__section">
          <h3 class="shop__section-title">Lives</h3>
          <div class="shop__grid shop__grid--lives">
            <div class="shop__lives-status">
              <span class="shop__lives-count">❤️ ${lives} / ${maxLives}</span>
              ${nextRegenMs > 0 ? `<span class="shop__lives-regen">Next life in ${formatMs(nextRegenMs)}</span>` : ''}
            </div>
            <button class="shop__item ${coins >= lifeRefillCost && lives < maxLives ? '' : 'shop__item--disabled'}"
                    data-action="buy-lives"
                    ${coins >= lifeRefillCost && lives < maxLives ? '' : 'disabled'}>
              <span class="shop__item-icon">❤️</span>
              <span class="shop__item-name">Full Refill</span>
              <span class="shop__item-desc">Refill all ${maxLives} lives</span>
              <span class="shop__item-cost">${lifeRefillCost} 🪙</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  wireEvents(ctx);
}

function formatMs(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function wireEvents(ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'back') {
      ctx.router.navigate('#/map');
      return;
    }

    if (action === 'buy-powerup') {
      const id = btn.dataset.powerup;
      const def = POWERUPS[id];
      if (!def) return;
      if (spendCoins(def.cost)) {
        addPowerup(id);
        showToast(`Purchased ${def.name}!`);
        render(ctx); // refresh
      }
      return;
    }

    if (action === 'buy-lives') {
      if (spendCoins(300)) {
        refillLives();
        showToast('Lives refilled!');
        render(ctx); // refresh
      }
    }
  });
}

// Simple toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'shop__toast';
  toast.textContent = message;
  containerEl?.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 1500);
}
