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
import { activatePowerup } from '../game/powerups.js';
import { showTutorial } from '../ui/tutorial.js';
import { spendLife, getLives } from '../systems/progress.js';
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

      // Apply pre-level power-ups
      if (ctx._pendingPowerups?.length > 0) {
        for (const pid of ctx._pendingPowerups) {
          activatePowerup(pid, state);
        }
        ctx._pendingPowerups = null;
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
  let el = document.querySelector('#objectiveHUD');
  if (!objective) {
    if (el) el.style.display = 'none';
    return;
  }

  if (!el) {
    // Create objective HUD element
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
