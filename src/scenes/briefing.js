/**
 * Stackr Quest — Level Briefing Scene
 *
 * Shown when a player taps a level node on the map.
 * Displays: objective, star thresholds, best score, modifier icons,
 * power-up selection, retry count, and a "Play" button.
 */

import { loadLevel } from '../game/levelConfig.js';
import { applyWorldTheme } from '../ui/stylemanager.js';
import {
  getLevelStars,
  getLevelBestScore,
  getLevelRetries,
  getLives,
  getPowerups,
  usePowerup,
} from '../systems/progress.js';
import { POWERUPS, POWERUP_IDS } from '../game/powerups.js';
import { getStarDescriptions } from '../game/stars.js';
import { hideGameUI, showGameUI } from './helpers.js';
import { globalLevelNum } from '../engine/constants.js';
import { injectAnimatedBg, destroyAnimatedBg } from '../ui/animatedBg.js';

let containerEl = null;
let levelCfg = null;
let worldCfg = null;
let selectedPowerups = [];

export const briefingScene = {
  id: 'briefing',

  async enter(params, ctx) {
    const sceneEl = document.querySelector('[data-scene="briefing"]');
    if (!sceneEl) return;
    containerEl = sceneEl;
    selectedPowerups = [];
    hideGameUI();

    const { world, level } = params;
    if (!world || !level) {
      ctx.router.navigate('#/map');
      return;
    }

    try {
      const data = await loadLevel(world, level);
      levelCfg = data.level;
      worldCfg = data.world;
      applyWorldTheme(world);
      render(world, level, ctx);
    } catch (err) {
      console.error('[briefing] Failed to load level', err);
      containerEl.innerHTML = `
        <div class="overlay">
          <div class="overlay__panel">
            <h2 class="overlay__title">Error</h2>
            <p>Failed to load level ${world}-${level}</p>
            <button class="btn" data-action="back">Back to Map</button>
          </div>
        </div>
      `;
      containerEl.querySelector('[data-action="back"]')?.addEventListener('click', () => {
        ctx.router.navigate('#/map');
      });
    }
  },

  exit(_ctx) {
    if (containerEl) { destroyAnimatedBg(containerEl); containerEl.innerHTML = ''; }
    levelCfg = null;
    worldCfg = null;
    selectedPowerups = [];
    showGameUI();
  },
};

function render(worldId, levelNum, ctx) {
  if (!containerEl || !levelCfg) return;

  const levelId = `${worldId}-${levelNum}`;
  const bestStars = getLevelStars(levelId);
  const bestScore = getLevelBestScore(levelId);
  const retries = getLevelRetries(levelId);
  const { lives } = getLives();
  const inventory = getPowerups();

  // Star descriptions
  const starDescs = levelCfg.stars
    ? getStarDescriptions(levelCfg.stars, levelCfg.objective)
    : ['Complete objective', 'Meet secondary goal', 'Near-perfect play'];

  // Modifier list
  const modifiers = levelCfg.modifiers || [];
  const hasBoss = !!levelCfg.boss;

  containerEl.innerHTML = /* html */ `
    <div class="overlay">
      <div class="overlay__panel briefing">
        <button class="briefing__close" data-action="back" aria-label="Back to map">✕</button>

        <h2 class="overlay__title briefing__title">
          ${hasBoss ? '👑 ' : ''}${levelCfg.name || `Level ${globalLevelNum(worldId, levelNum)}`}
        </h2>

        <p class="briefing__world">${worldCfg?.name || `World ${worldId}`} — Level ${globalLevelNum(worldId, levelNum)}</p>

        <div class="briefing__objective">
          <h3>Objective</h3>
          <p>${levelCfg.objective?.description || 'Complete the level.'}</p>
        </div>

        <div class="briefing__stars-info">
          <h3>Stars</h3>
          <div class="briefing__star-row">
            <span class="briefing__star ${bestStars >= 1 ? 'earned' : ''}">⭐</span>
            <span>${starDescs[0] || 'Complete objective'}</span>
          </div>
          <div class="briefing__star-row">
            <span class="briefing__star ${bestStars >= 2 ? 'earned' : ''}">⭐</span>
            <span>${starDescs[1] || '—'}</span>
          </div>
          <div class="briefing__star-row">
            <span class="briefing__star ${bestStars >= 3 ? 'earned' : ''}">⭐</span>
            <span>${starDescs[2] || '—'}</span>
          </div>
        </div>

        ${bestScore > 0 ? `<p class="briefing__best">Best: ${bestScore} pts</p>` : ''}
        ${retries > 0 ? `<p class="briefing__retries">Attempts: ${retries}</p>` : ''}

        ${
          modifiers.length > 0
            ? `
          <div class="briefing__modifiers">
            <h3>Modifiers</h3>
            <div class="briefing__modifier-list">
              ${modifiers.map((m) => `<span class="briefing__modifier">${getModifierIcon(m)} ${m}</span>`).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          hasBoss
            ? `
          <div class="briefing__boss">
            <h3>⚔️ Boss Fight</h3>
            <p>${levelCfg.boss.type}</p>
          </div>
        `
            : ''
        }

        <div class="briefing__powerups">
          <h3>Power-ups <span class="briefing__hint">(optional)</span></h3>
          <div class="briefing__powerup-grid">
            ${POWERUP_IDS.map((id) => {
              const def = POWERUPS[id];
              const count = inventory[id] || 0;
              return /* html */ `
                <button class="briefing__powerup ${count === 0 ? 'disabled' : ''}"
                        data-action="toggle-powerup"
                        data-powerup="${id}"
                        ${count === 0 ? 'disabled' : ''}>
                  <span class="briefing__powerup-icon">${def.icon}</span>
                  <span class="briefing__powerup-name">${def.name}</span>
                  <span class="briefing__powerup-count">×${count}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="briefing__actions">
          <button class="btn briefing__play-btn" data-action="play">
            ▶ Play ${lives > 0 ? '' : '(No Lives!)'}
          </button>
          <button class="btn btn--secondary" data-action="back">
            Back to Map
          </button>
        </div>

        <p class="briefing__lives">❤️ ${lives} lives remaining</p>
      </div>
    </div>
  `;

  wireEvents(worldId, levelNum, ctx);
  injectAnimatedBg(containerEl);
}

function getModifierIcon(modifier) {
  const icons = {
    iceBlocks: '🧊',
    bombBlocks: '💣',
    darkBlocks: '🌑',
    stoneBlocks: '🪨',
    gravityShift: '🔄',
    comboMultiplier: '🔥',
    pieceLimited: '♟️',
  };
  return icons[modifier] || '✦';
}

function wireEvents(worldId, levelNum, ctx) {
  if (!containerEl) return;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'back') {
      ctx.router.navigate(`#/map/${worldId}`);
      return;
    }

    if (action === 'toggle-powerup') {
      const id = btn.dataset.powerup;
      if (selectedPowerups.includes(id)) {
        selectedPowerups = selectedPowerups.filter((p) => p !== id);
        btn.classList.remove('selected');
      } else {
        selectedPowerups.push(id);
        btn.classList.add('selected');
      }
      return;
    }

    if (action === 'play') {
      // Consume selected power-ups from inventory
      for (const pid of selectedPowerups) {
        usePowerup(pid);
      }

      // Store selected powerups for the game scene to apply
      ctx._pendingPowerups = [...selectedPowerups];
      ctx._pendingLevelCfg = levelCfg;
      ctx._pendingWorldCfg = worldCfg;

      ctx.router.navigate(`#/play/${worldId}-${levelNum}`);
    }
  });
}
