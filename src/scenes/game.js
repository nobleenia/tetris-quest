/**
 * Stackr Quest — Game Scene
 *
 * The active gameplay scene. Manages the board, game loop, HUD,
 * and all in-game UI. Receives level params from the router/scene
 * manager and configures the engine accordingly.
 *
 * Phase 3: Loads level config, starts session, applies power-ups,
 * shows tutorial if needed, tracks objective progress in HUD.
 */

import { loadLevel } from '../game/levelConfig.js';
import { applyWorldTheme, applyStyle } from '../ui/stylemanager.js';
import { initQueue, spawnFromQueue } from '../game/spawn.js';
import { activatePowerup, POWERUPS, POWERUP_IDS, grantTimedPowerup } from '../game/powerups.js';
import { showTutorial } from '../ui/tutorial.js';
import { spendLife, getLives, getPowerups, usePowerup } from '../systems/progress.js';
import { generateDailyChallenge } from '../game/dailyChallenge.js';
import { showGameUI } from './helpers.js';

export const gameScene = {
  id: 'game',

  async enter(params, ctx) {
    // Ensure game-only DOM elements are visible
    showGameUI();

    const { state, session } = ctx;

    if (params.mode === 'classic') {
      // ── Classic mode ──
      session.startClassic();
      const bag = session.getBag();
      initQueue(state, bag);
      const ok = spawnFromQueue(state, bag);
      if (ok) session.onPieceSpawned();
      state.paused = false;
      state._gameOverShown = false;
      updateObjectiveHUD(null);
      return;
    }

    if (params.mode === 'daily') {
      // ── Daily Challenge mode ──
      const dailyCfg = generateDailyChallenge();
      applyStyle(dailyCfg.theme);

      // Build a minimal worldCfg for session
      const worldCfg = {
        id: 0,
        name: 'Daily Challenge',
        theme: dailyCfg.theme,
        cssClass: dailyCfg.cssClass,
      };

      session.startLevel(dailyCfg, worldCfg);

      const bag = session.getBag();
      initQueue(state, bag);
      const ok = spawnFromQueue(state, bag);
      if (ok) session.onPieceSpawned();
      state.paused = false;
      state._gameOverShown = false;
      state._isDaily = true;

      updateObjectiveHUD(state.objective);
      return;
    }

    // ── Adventure mode ──
    const { world, level } = params;
    if (!world || !level) {
      ctx.router.navigate('#/map');
      return;
    }

    // Check lives
    const { lives } = getLives();
    if (lives <= 0) {
      ctx.router.navigate('#/shop');
      return;
    }

    // Spend a life for the attempt
    spendLife();

    try {
      // Use cached data from briefing if available
      let levelCfg, worldCfg;
      if (ctx._pendingLevelCfg && ctx._pendingWorldCfg) {
        levelCfg = ctx._pendingLevelCfg;
        worldCfg = ctx._pendingWorldCfg;
        ctx._pendingLevelCfg = null;
        ctx._pendingWorldCfg = null;
      } else {
        const data = await loadLevel(world, level);
        levelCfg = data.level;
        worldCfg = data.world;
      }

      applyWorldTheme(world);
      session.startLevel(levelCfg, worldCfg);

      // Apply pre-level power-ups; store in-game ones for manual activation
      if (ctx._pendingPowerups?.length > 0) {
        const inGamePowerups = [];
        for (const pid of ctx._pendingPowerups) {
          const def = POWERUPS[pid];
          if (def?.activateIn === 'pre') {
            activatePowerup(pid, state);
          } else {
            inGamePowerups.push(pid);
          }
        }
        ctx._pendingPowerups = null;

        // Store in-game powerups on state so the HUD can render buttons
        state._inGamePowerups = inGamePowerups;
        renderPowerupBar(state, ctx);
      } else {
        state._inGamePowerups = [];
        renderPowerupBar(state, ctx);
      }

      // Spawn the initial piece
      const bag = session.getBag();
      initQueue(state, bag);
      const ok = spawnFromQueue(state, bag);
      if (ok) session.onPieceSpawned();

      state.paused = false;
      state._gameOverShown = false;

      // Show tutorial if this level has one
      if (levelCfg.tutorial) {
        showTutorial(levelCfg.tutorial);
      }

      // Update objective HUD
      updateObjectiveHUD(state.objective);
    } catch (err) {
      console.error('[game] Failed to load level', err);
      ctx.router.navigate('#/map');
    }
  },

  exit(ctx) {
    // Pause the game when leaving
    if (ctx && ctx.state) {
      ctx.state.paused = true;
    }

    // Force-hide legacy overlays so they don't bleed into other scenes
    const pauseOv = document.querySelector('#pauseOverlay');
    if (pauseOv) pauseOv.classList.add('hidden');
    const goOv = document.querySelector('#gameOverOverlay');
    if (goOv) goOv.classList.add('hidden');

    // Clear objective HUD
    updateObjectiveHUD(null);
  },

  onRoute(_params, _ctx) {
    // Route changes within the game scene are handled by exit + enter
  },
};

/**
 * Update the objective display in the HUD sidebar.
 * @param {object|null} objective
 */
function updateObjectiveHUD(objective) {
  // New objective display in the HUD bar area
  const objBar = document.querySelector('#gameHudObjective');
  if (objBar) {
    if (!objective) {
      objBar.style.display = 'none';
      objBar.innerHTML = '';
    } else {
      objBar.style.display = '';
      objBar.innerHTML = `🎯 ${objective.description || objective.type}`;
    }
  }

  // Legacy sidebar objective
  let el = document.querySelector('#objectiveHUD');
  if (!objective) {
    if (el) el.style.display = 'none';
    return;
  }

  if (!el) {
    el = document.createElement('div');
    el.id = 'objectiveHUD';
    el.className = 'sidebar__stat sidebar__stat--objective';
    const sidebar = document.querySelector('#sidebarStats');
    if (sidebar) sidebar.prepend(el);
  }

  el.style.display = '';
  el.innerHTML = `
    <span class="sidebar__label">Objective</span>
    <span class="sidebar__value" id="objectiveText">${objective.description || objective.type}</span>
  `;
}

/**
 * Render in-game powerup buttons in the bottom bar.
 * Shows available powerups with activation count.
 * When count is 0, shows a + button for quick in-game purchase.
 */
function renderPowerupBar(state, ctx) {
  const container = document.querySelector('#gPowerupSlots');
  if (!container) return;
  container.innerHTML = '';

  // Only show in-game powerups (activateIn === 'game')
  const inGameIds = POWERUP_IDS.filter(id => POWERUPS[id]?.activateIn === 'game');
  const inventory = getPowerups();
  const activePowerups = state._inGamePowerups || [];

  for (const pid of inGameIds) {
    const def = POWERUPS[pid];
    if (!def) continue;

    // Count: from inventory + any pre-selected for this level
    const invCount = inventory[pid] || 0;
    const activeCount = activePowerups.filter(id => id === pid).length;
    const totalCount = invCount + activeCount;

    // Check for timed powerup
    const timedInfo = state._timedPowerups?.[pid];
    const isTimed = timedInfo && timedInfo.remaining > 0;

    if (totalCount > 0 || isTimed) {
      const btn = document.createElement('button');
      btn.className = 'gbot__pw-btn';
      btn.setAttribute('aria-label', def.name);

      const countBadge = isTimed
        ? `<span class="gbot__pw-count gbot__pw-count--timed">${Math.ceil(timedInfo.remaining)}s</span>`
        : `<span class="gbot__pw-count">${totalCount}</span>`;

      btn.innerHTML = `<span class="gbot__pw-icon">${def.icon}</span>${countBadge}`;
      btn.addEventListener('click', () => {
        if (state.paused || state.gameOver) return;

        if (isTimed) {
          // Timed powerups are always active — just visual feedback
          btn.style.transform = 'scale(0.8)';
          setTimeout(() => { btn.style.transform = ''; }, 100);
          return;
        }

        // Spend from inventory first, then from pre-selected
        const idx = activePowerups.indexOf(pid);
        if (idx >= 0) {
          activePowerups.splice(idx, 1);
        } else if (invCount > 0) {
          usePowerup(pid);
        } else {
          return;
        }

        activatePowerup(pid, state);
        renderPowerupBar(state, ctx); // re-render to update counts
      });
      container.appendChild(btn);
    } else {
      // Empty slot — show icon + "+" for purchase
      const plusBtn = document.createElement('button');
      plusBtn.className = 'gbot__pw-empty';
      plusBtn.setAttribute('aria-label', `Buy ${def.name}`);
      plusBtn.innerHTML = `<span class="gbot__pw-icon" style="font-size:16px">${def.icon}</span><span class="gbot__pw-plus">+</span>`;
      plusBtn.addEventListener('click', () => {
        if (state.paused || state.gameOver) return;
        // Quick in-game purchase overlay
        showQuickPurchase(pid, state, ctx);
      });
      container.appendChild(plusBtn);
    }
  }
}

/**
 * Show a quick purchase popup without leaving the game.
 * Offers qty-based and duration-based purchase when applicable.
 */
function showQuickPurchase(powerupId, state, ctx) {
  const def = POWERUPS[powerupId];
  if (!def) return;

  state.paused = true;

  const timedCost = Math.floor(def.cost * 1.5);
  const showTimedOption = def.canBeTimed;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'gbot__purchase-overlay';
  overlay.innerHTML = `
    <div class="gbot__purchase-card">
      <div class="gbot__purchase-icon">${def.icon}</div>
      <div class="gbot__purchase-name">${def.name}</div>
      <div class="gbot__purchase-desc">${def.description}</div>
      <div class="gbot__purchase-options">
        <button class="gbot__purchase-opt gbot__purchase-opt--qty" data-type="qty">
          <span class="gbot__purchase-opt-label">1× Use</span>
          <span class="gbot__purchase-opt-price">🪙 ${def.cost}</span>
        </button>
        ${showTimedOption ? `
        <button class="gbot__purchase-opt gbot__purchase-opt--timed" data-type="timed">
          <span class="gbot__purchase-opt-label">⏱ 30s</span>
          <span class="gbot__purchase-opt-price">🪙 ${timedCost}</span>
        </button>` : ''}
      </div>
      <button class="gbot__purchase-cancel">Cancel</button>
    </div>
  `;

  const gameRoot = document.querySelector('#gameRoot');
  if (!gameRoot) return;
  gameRoot.appendChild(overlay);

  // Buy by quantity
  overlay.querySelector('.gbot__purchase-opt--qty')?.addEventListener('click', () => {
    import('../systems/progress.js').then(({ getCoins, spendCoins }) => {
      const coins = getCoins();
      if (coins >= def.cost) {
        spendCoins(def.cost);
        activatePowerup(powerupId, state);
        overlay.remove();
        state.paused = false;
        renderPowerupBar(state, ctx);
      } else {
        flashPrice(overlay);
      }
    });
  });

  // Buy by duration (timed)
  if (showTimedOption) {
    overlay.querySelector('.gbot__purchase-opt--timed')?.addEventListener('click', () => {
      import('../systems/progress.js').then(({ getCoins, spendCoins }) => {
        const coins = getCoins();
        if (coins >= timedCost) {
          spendCoins(timedCost);
          grantTimedPowerup(state, powerupId, 30);
          activatePowerup(powerupId, state);
          overlay.remove();
          state.paused = false;
          renderPowerupBar(state, ctx);
        } else {
          flashPrice(overlay);
        }
      });
    });
  }

  overlay.querySelector('.gbot__purchase-cancel').addEventListener('click', () => {
    overlay.remove();
    state.paused = false;
  });
}

/** Flash prices red briefly to indicate insufficient coins */
function flashPrice(overlay) {
  overlay.querySelectorAll('.gbot__purchase-opt-price').forEach(el => {
    el.style.color = '#ef4444';
    setTimeout(() => { el.style.color = ''; }, 500);
  });
}
