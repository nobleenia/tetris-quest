/* eslint-disable no-console */
/**
 * Stackr Quest — Dev-Mode Level Test Harness
 *
 * Provides console-accessible utilities for testing individual levels
 * without navigating the UI. Only active in development builds.
 *
 * Usage (browser console):
 *   stackr.playLevel(1, 3)     — play World 1, Level 3
 *   stackr.playClassic()       — start classic mode
 *   stackr.status()            — show current session status
 *   stackr.completeLevel()     — force-complete the current level
 *   stackr.listLevels(1)       — list all levels in World 1
 *   stackr.inspect()           — dump current state snapshot
 */

import { loadLevel, loadWorldData } from './levelConfig.js';
import { applyWorldTheme } from '../ui/stylemanager.js';
import { initQueue, spawnFromQueue } from './spawn.js';

/**
 * Install the dev harness on the window object.
 * Only call this in development mode.
 *
 * @param {object} deps — { state, session, hud }
 */
export function installDevHarness({ state, session, hud }) {
  if (typeof window === 'undefined') return;

  const stackr = {
    /**
     * Load and play a specific level.
     * @param {number} worldId — 1-10
     * @param {number} levelNum — 1-20
     */
    async playLevel(worldId, levelNum) {
      try {
        const { world, level } = await loadLevel(worldId, levelNum);

        // Apply theme
        applyWorldTheme(worldId);

        // Start session
        session.startLevel(level, world);

        // Initial piece spawn
        initQueue(state);
        spawnFromQueue(state);
        session.onPieceSpawned();

        // Hide overlays
        const homeOverlay = document.querySelector('#homeOverlay');
        if (homeOverlay) homeOverlay.classList.add('hidden');
        if (hud) {
          hud.hideGameOver();
        }

        state.paused = false;
        state._gameOverShown = false;

        console.log(
          `[dev] Playing ${world.name} ${level.id}: "${level.name}"`,
          '\n  Objective:', level.objective.type, '→', level.objective.target,
          '\n  Modifiers:', state.modifiers.join(', ') || 'none',
          '\n  Boss:', state.boss?.type ?? 'none',
        );
      } catch (err) {
        console.error(`[dev] Failed to load level ${worldId}-${levelNum}:`, err);
      }
    },

    /** Start classic mode via session. */
    playClassic() {
      session.startClassic();

      // Initial piece spawn
      initQueue(state);
      spawnFromQueue(state);
      session.onPieceSpawned();

      const homeOverlay = document.querySelector('#homeOverlay');
      if (homeOverlay) homeOverlay.classList.add('hidden');
      if (hud) hud.hideGameOver();
      state.paused = false;
      state._gameOverShown = false;
      console.log('[dev] Classic mode started');
    },

    /** Show current session status. */
    status() {
      return {
        active: session.isActive(),
        mode: state.mode,
        levelId: state.levelId,
        objective: state.objective,
        score: state.score,
        linesCleared: state.linesCleared,
        pieceCount: state.pieceCount,
        combo: state.combo,
        maxCombo: state.maxCombo,
        elapsedSec: state.elapsedSec,
        objectiveComplete: state.objectiveComplete,
        objectiveFailed: state.objectiveFailed,
        bossHP: state.bossHP,
        modifiers: state.modifiers,
        result: session.getResult(),
      };
    },

    /** Force-complete the current level (for testing results flow). */
    completeLevel() {
      if (state.mode !== 'adventure') {
        console.warn('[dev] Not in adventure mode');
        return;
      }
      state.objectiveComplete = true;
      console.log('[dev] Objective force-completed. Session will resolve next tick.');
    },

    /**
     * List all levels in a world.
     * @param {number} worldId
     */
    async listLevels(worldId) {
      try {
        const world = await loadWorldData(worldId);
        console.table(
          world.levels.map((l) => ({
            id: l.id,
            name: l.name,
            objective: l.objective.type,
            target: l.objective.target,
            boss: l.boss?.type ?? '-',
          })),
        );
      } catch (err) {
        console.error(`[dev] Failed to load world ${worldId}:`, err);
      }
    },

    /** Dump a snapshot of the current game state. */
    inspect() {
      const snap = {};
      for (const key of Object.keys(state)) {
        const val = state[key];
        // Skip large typed arrays, just show length
        if (val instanceof Uint8Array || val instanceof Int8Array) {
          snap[key] = `[${val.constructor.name}(${val.length})]`;
        } else {
          snap[key] = val;
        }
      }
      console.log('[dev] State snapshot:', snap);
      return snap;
    },
  };

  window.stackr = stackr;
  console.log('[dev] Stackr Quest dev harness loaded. Type `stackr` in console for commands.');
}
