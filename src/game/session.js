/**
 * Stackr Quest — Game Session Manager
 *
 * Orchestrates the lifecycle of a level play session:
 *   1. init   — reset state, apply config, start objective tracker
 *   2. tick   — per-frame update (objectives, boss, speed events, modifiers)
 *   3. end    — calculate stars, build result object
 *
 * Works for both adventure mode (levels) and classic mode (endless).
 */

import { resetGame, initializeVisibleViews } from '../engine/state.js';
import { applyLevelConfig, applyClassicConfig, tickSpeedEvents } from './levelConfig.js';
import { tickObjective } from './objectives.js';
import { calculateStars } from './stars.js';
import { initBoss, tickBoss, damageBoss, isBossDefeated } from './boss.js';
import { tickGravityShift, hasModifier } from './modifiers.js';
import { create7Bag } from './bag.js';

/**
 * Create a game session manager.
 *
 * @param {object} state — shared mutable game state
 * @returns {object} — session API
 */
export function createSession(state) {
  /** @type {ReturnType<typeof create7Bag> | null} */
  let bag = null;

  /** @type {object|null} — result from endSession */
  let result = null;

  /** @type {((result: object) => void)|null} */
  let onCompleteCallback = null;

  /** @type {((result: object) => void)|null} */
  let onFailCallback = null;

  /** Whether a session is currently active */
  let active = false;

  // ── Public API ───────────────────────────────────────────────────

  return {
    /**
     * Start a new adventure mode session for a specific level.
     *
     * @param {object} levelCfg — single level config from JSON
     * @param {object} [worldCfg] — parent world config
     */
    startLevel(levelCfg, worldCfg = {}) {
      resetGame(state);
      initializeVisibleViews(state);
      applyLevelConfig(state, levelCfg, worldCfg);
      initBoss(state);

      bag = create7Bag();
      state._bag = bag;
      result = null;
      active = true;
      state.paused = false;
      state.gameOver = false;
    },

    /**
     * Start a new classic / endless mode session.
     */
    startClassic() {
      resetGame(state);
      initializeVisibleViews(state);
      applyClassicConfig(state);

      bag = create7Bag();
      state._bag = bag;
      result = null;
      active = true;
      state.paused = false;
      state.gameOver = false;
    },

    /**
     * Per-tick update. Call from the simulation loop.
     * Handles speed events, modifiers, boss, and objective checks.
     *
     * @param {number} dt — delta time in seconds
     * @returns {{ complete: boolean, failed: boolean }|null}
     */
    tick(dt) {
      if (!active) return null;

      // Speed events (scheduled gravity changes)
      tickSpeedEvents(state);

      // Gravity shift modifier (oscillating gravity)
      if (hasModifier(state, 'gravityShift')) {
        tickGravityShift(state, dt);
      }

      // Boss attacks
      if (state.boss) {
        tickBoss(state, dt);

        // Boss defeated = level complete (override objective)
        if (isBossDefeated(state) && !state.objectiveComplete) {
          state.objectiveComplete = true;
          return endSession('complete');
        }
      }

      // Objective check (adventure only)
      if (state.mode === 'adventure') {
        const status = tickObjective(state);

        if (status.complete && !result) {
          return endSession('complete');
        }
        if (status.failed && !result) {
          return endSession('failed');
        }
      }

      // Classic mode: game over is the only end condition
      if (state.mode === 'classic' && state.gameOver && !result) {
        return endSession('gameOver');
      }

      return null;
    },

    /**
     * Notify the session that lines were cleared.
     * Updates counters, combo, boss damage.
     *
     * @param {number} linesCleared
     */
    onLinesCleared(linesCleared) {
      if (!active || linesCleared <= 0) return;

      state.linesCleared += linesCleared;

      // Combo tracking
      if (linesCleared > 0) {
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
      }

      // Boss damage
      if (state.boss) {
        damageBoss(state, linesCleared);
      }
    },

    /**
     * Notify the session that a piece was spawned.
     * Tracks piece count for piece-limit objectives.
     */
    onPieceSpawned() {
      if (!active) return;
      state.pieceCount += 1;
    },

    /**
     * Notify that a piece was placed without clearing any lines.
     * Resets the combo counter.
     */
    onPieceLocked(linesCleared) {
      if (linesCleared === 0) {
        state.combo = 0;
      }
    },

    /**
     * Get the 7-bag piece generator (null if no session active).
     * @returns {{ next: () => string, peek: () => string }|null}
     */
    getBag() {
      return bag;
    },

    /** Whether a session is currently running. */
    isActive() {
      return active;
    },

    /** Get the last session result (null if still running). */
    getResult() {
      return result;
    },

    /**
     * Register callbacks for session end events.
     * @param {{ onComplete?: function, onFail?: function }} cbs
     */
    on({ onComplete, onFail } = {}) {
      if (onComplete) onCompleteCallback = onComplete;
      if (onFail) onFailCallback = onFail;
    },

    /** Force-end the current session. */
    abort() {
      active = false;
      result = null;
    },
  };

  // ── Internal ─────────────────────────────────────────────────────

  /**
   * End the session: calculate stars, build result, fire callbacks.
   * @param {'complete'|'failed'|'gameOver'} outcome
   */
  function endSession(outcome) {
    active = false;

    const starResult =
      state.mode === 'adventure' ? calculateStars(state) : { stars: 0, details: {} };

    result = {
      outcome,
      levelId: state.levelId,
      worldId: state.worldId,
      levelNum: state.levelNum,
      mode: state.mode,
      score: state.score,
      linesCleared: state.linesCleared,
      pieceCount: state.pieceCount,
      elapsedSec: state.elapsedSec,
      maxCombo: state.maxCombo,
      stars: starResult.stars,
      starDetails: starResult.details,
    };

    if (outcome === 'complete' && onCompleteCallback) {
      onCompleteCallback(result);
    } else if ((outcome === 'failed' || outcome === 'gameOver') && onFailCallback) {
      onFailCallback(result);
    }

    return result;
  }
}
