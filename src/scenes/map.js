/**
 * Stackr Quest — World Map Scene
 *
 * Scrollable world map with node-path layout.
 * - Completed nodes are filled with star count
 * - Current node pulses
 * - Locked nodes are dimmed
 * - World gates show "X stars needed"
 * - Lives + coins shown in the header
 */

import { loadWorldData } from '../game/levelConfig.js';
import {
  getTotalStars,
  getLevelStars,
  getHighestReached,
  getLives,
  getCoins,
  isWorldUnlocked,
} from '../systems/progress.js';

// Inline the worlds index to avoid async fetch at scene enter
const WORLDS = [
  { id: 1, name: 'Foundation', starsToUnlock: 0, theme: 'modern' },
  { id: 2, name: 'Retro Land', starsToUnlock: 20, theme: 'gameboy' },
  { id: 3, name: 'Coral Depths', starsToUnlock: 45, theme: 'deepsea' },
  { id: 4, name: 'Neon District', starsToUnlock: 75, theme: 'neon' },
  { id: 5, name: 'Molten Core', starsToUnlock: 110, theme: 'volcano' },
  { id: 6, name: 'Dreamscape', starsToUnlock: 150, theme: 'vaporwave' },
  { id: 7, name: 'Thunderspire', starsToUnlock: 195, theme: 'storm' },
  { id: 8, name: 'Frozen Peaks', starsToUnlock: 245, theme: 'arctic' },
  { id: 9, name: 'Starfield', starsToUnlock: 300, theme: 'cosmos' },
  { id: 10, name: 'The Nexus', starsToUnlock: 360, theme: 'nexus' },
];

/** @type {HTMLElement|null} */
let containerEl = null;

/** Cached world data for expanded world */
let expandedWorldId = null;
let _expandedWorldData = null;

export const mapScene = {
  id: 'map',

  enter(params, ctx) {
    const sceneEl = document.querySelector('[data-scene="map"]');
    if (!sceneEl) return;
    containerEl = sceneEl;

    // Decide which world to show
    const targetWorld = params.world || getHighestReached().world;
    render(targetWorld, ctx);
  },

  exit(_ctx) {
    if (containerEl) containerEl.innerHTML = '';
    expandedWorldId = null;
    _expandedWorldData = null;
  },

  onRoute(params, ctx) {
    if (params.world) {
      render(params.world, ctx);
    }
  },
};

// ─── Render ──────────────────────────────────────────────────────────

function render(focusWorld, ctx) {
  if (!containerEl) return;

  const totalStars = getTotalStars();
  const { lives } = getLives();
  const coins = getCoins();
  const highest = getHighestReached();

  containerEl.innerHTML = /* html */ `
    <div class="map">
      <header class="map__header">
        <button class="map__back-btn btn btn--small" data-action="home" aria-label="Back to home">
          ← Home
        </button>
        <div class="map__stats">
          <span class="map__stat" title="Total Stars">⭐ ${totalStars}</span>
          <span class="map__stat" title="Lives">❤️ ${lives}</span>
          <span class="map__stat" title="Coins">🪙 ${coins}</span>
        </div>
        <button class="map__shop-btn btn btn--small" data-action="shop" aria-label="Shop">
          🛒 Shop
        </button>
      </header>

      <div class="map__scroll">
        <div class="map__worlds">
          ${WORLDS.map((w) => renderWorldNode(w, totalStars, highest, focusWorld)).join('')}
        </div>
      </div>
    </div>
  `;

  // Wire up event listeners
  wireEvents(ctx);

  // If a world is focused, auto-expand and load levels
  if (focusWorld > 0) {
    const w = WORLDS.find((w) => w.id === focusWorld);
    if (w && isWorldUnlocked(w.starsToUnlock)) {
      renderLevelGrid(focusWorld);
    }
    // Scroll to focused world
    const focusEl = containerEl.querySelector(`[data-world="${focusWorld}"]`);
    if (focusEl) {
      setTimeout(() => focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }
}

function renderWorldNode(world, totalStars, highest, focusWorld) {
  const unlocked = isWorldUnlocked(world.starsToUnlock);
  const isCurrent = world.id === highest.world;
  const isExpanded = world.id === focusWorld;

  // Count stars earned in this world
  let worldStars = 0;
  for (let l = 1; l <= 20; l++) {
    worldStars += getLevelStars(`${world.id}-${l}`);
  }
  const maxStars = 60;

  const stateClass = unlocked
    ? isCurrent
      ? 'map__world--current'
      : worldStars > 0
        ? 'map__world--completed'
        : 'map__world--available'
    : 'map__world--locked';

  return /* html */ `
    <div class="map__world ${stateClass} ${isExpanded ? 'map__world--expanded' : ''}"
         data-world="${world.id}"
         data-action="toggle-world">
      <div class="map__world-header">
        <div class="map__world-icon">${unlocked ? getWorldIcon(world.id) : '🔒'}</div>
        <div class="map__world-info">
          <h3 class="map__world-name">World ${world.id}: ${world.name}</h3>
          <div class="map__world-stars">${worldStars}/${maxStars} ⭐</div>
        </div>
        ${!unlocked ? `<div class="map__world-gate">Need ${world.starsToUnlock} ⭐</div>` : ''}
      </div>
      ${isExpanded && unlocked ? `<div class="map__levels" id="levels-${world.id}"><div class="map__loading">Loading...</div></div>` : ''}
    </div>
    <div class="map__path-connector"></div>
  `;
}

function getWorldIcon(id) {
  const icons = {
    1: '🏠',
    2: '🎮',
    3: '🐠',
    4: '💡',
    5: '🌋',
    6: '🌸',
    7: '⚡',
    8: '❄️',
    9: '🌟',
    10: '🔮',
  };
  return icons[id] || '🌍';
}

// ─── Level grid (lazy loaded) ────────────────────────────────────────

async function renderLevelGrid(worldId) {
  const levelsEl = containerEl?.querySelector(`#levels-${worldId}`);
  if (!levelsEl) return;

  try {
    const worldData = await loadWorldData(worldId);
    _expandedWorldData = worldData;
    expandedWorldId = worldId;

    const highest = getHighestReached();
    const levels = worldData.levels || [];

    levelsEl.innerHTML = /* html */ `
      <div class="map__level-grid">
        ${levels
          .map((level) => {
            const stars = getLevelStars(level.id);
            const levelNum = level.level;
            const isReached =
              worldId < highest.world ||
              (worldId === highest.world && levelNum <= highest.level);
            const isBoss = !!level.boss;

            const nodeClass = stars > 0
              ? 'map__level--cleared'
              : isReached
                ? 'map__level--current'
                : 'map__level--locked';

            return /* html */ `
              <button class="map__level ${nodeClass} ${isBoss ? 'map__level--boss' : ''}"
                      data-action="play-level"
                      data-world="${worldId}"
                      data-level="${levelNum}"
                      data-level-id="${level.id}"
                      ${!isReached ? 'disabled' : ''}>
                <span class="map__level-num">${isBoss ? '👑' : levelNum}</span>
                <span class="map__level-stars">
                  ${stars >= 1 ? '⭐' : '☆'}${stars >= 2 ? '⭐' : '☆'}${stars >= 3 ? '⭐' : '☆'}
                </span>
              </button>
            `;
          })
          .join('')}
      </div>
    `;
  } catch (err) {
    levelsEl.innerHTML = `<p class="map__error">Failed to load levels</p>`;
    console.error('[map] Failed to load world data', err);
  }
}

// ─── Events ──────────────────────────────────────────────────────────

function wireEvents(ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'home') {
      ctx.router.navigate('#/');
      return;
    }

    if (action === 'shop') {
      ctx.router.navigate('#/shop');
      return;
    }

    if (action === 'toggle-world') {
      const worldId = Number(btn.dataset.world);
      if (!isWorldUnlocked(WORLDS.find((w) => w.id === worldId)?.starsToUnlock ?? 999)) return;

      if (expandedWorldId === worldId) {
        // Collapse
        expandedWorldId = null;
        render(0, ctx); // re-render without focus
      } else {
        render(worldId, ctx);
      }
      return;
    }

    if (action === 'play-level') {
      const worldId = Number(btn.dataset.world);
      const levelNum = Number(btn.dataset.level);
      ctx.router.navigate(`#/briefing/${worldId}-${levelNum}`);
    }
  });
}
