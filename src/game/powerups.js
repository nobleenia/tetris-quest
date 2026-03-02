/**
 * Stackr Quest — Power-ups System
 *
 * Defines all power-ups, their effects, costs, and activation logic.
 * Power-ups are purchased in the shop, stored in progress.powerups,
 * and activated either pre-level (briefing) or in-game (HUD button).
 *
 * Each power-up is single-use per level attempt.
 */

// ─── Power-up Definitions ────────────────────────────────────────────

export const POWERUPS = {
  extraTime: {
    id: 'extraTime',
    name: 'Extra Time',
    icon: '⏱️',
    description: '+30 seconds to time limit',
    cost: 100,
    activateIn: 'pre', // activated before the level starts
    effect(state) {
      if (state.timeLimit > 0) {
        state.timeLimit += 30;
      }
    },
  },

  lineBlast: {
    id: 'lineBlast',
    name: 'Line Blast',
    icon: '💥',
    description: 'Clears the bottom 3 rows instantly',
    cost: 200,
    activateIn: 'game', // activated during gameplay
    effect(state) {
      const { cols, rows, lockedBoard } = state;
      // Clear the bottom 3 visible rows
      for (let y = rows - 3; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          lockedBoard[y * cols + x] = 0;
        }
      }
      // Count as lines cleared
      state.linesCleared += 3;
    },
  },

  piecePeek: {
    id: 'piecePeek',
    name: 'Piece Peek',
    icon: '👁️',
    description: 'Shows next 3 pieces instead of 1',
    cost: 150,
    activateIn: 'pre',
    effect(state) {
      state._piecePeek = 3;
    },
  },

  slowMotion: {
    id: 'slowMotion',
    name: 'Slow Motion',
    icon: '🐌',
    description: 'Halves gravity for 15 seconds',
    cost: 150,
    activateIn: 'game',
    effect(state) {
      state._slowMotionTimer = 15;
      state._slowMotionActive = true;
      // The sim loop will check _slowMotionActive to halve the drop interval
    },
  },

  bomb: {
    id: 'bomb',
    name: 'Bomb',
    icon: '💣',
    description: 'Clears a 3×3 area around a target cell',
    cost: 250,
    activateIn: 'game',
    /**
     * Bomb needs a target location. Call activateBomb(state, cx, cy) directly.
     */
    effect(state) {
      state._bombPending = true;
      // UI will let the player tap a cell to trigger the detonation
    },
  },

  shuffle: {
    id: 'shuffle',
    name: 'Shuffle',
    icon: '🔀',
    description: 'Rearranges bottom rows to fill gaps',
    cost: 200,
    activateIn: 'game',
    effect(state) {
      const { cols, rows, lockedBoard } = state;
      // Compact: for each column, push all filled cells to the bottom
      for (let x = 0; x < cols; x++) {
        const filled = [];
        for (let y = 0; y < rows; y++) {
          const v = lockedBoard[y * cols + x];
          if (v !== 0) filled.push(v);
        }
        // Place from bottom up
        let writeY = rows - 1;
        for (let i = filled.length - 1; i >= 0; i--) {
          lockedBoard[writeY * cols + x] = filled[i];
          writeY--;
        }
        // Clear remaining above
        for (let y = writeY; y >= 0; y--) {
          lockedBoard[y * cols + x] = 0;
        }
      }
    },
  },
};

/** Ordered list of power-up ids for UI rendering. */
export const POWERUP_IDS = Object.keys(POWERUPS);

// ─── Activation ──────────────────────────────────────────────────────

/**
 * Activate a power-up during a level.
 * @param {string} type — power-up id
 * @param {object} state — mutable game state
 * @returns {boolean} — true if activated
 */
export function activatePowerup(type, state) {
  const def = POWERUPS[type];
  if (!def) return false;
  def.effect(state);
  return true;
}

/**
 * Detonate the bomb power-up at a specific board location.
 * @param {object} state
 * @param {number} cx — center column
 * @param {number} cy — center row
 */
export function activateBomb(state, cx, cy) {
  const { cols, rows, lockedBoard } = state;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        lockedBoard[y * cols + x] = 0;
      }
    }
  }
  state._bombPending = false;
}

/**
 * Tick the slow motion timer (call each sim step).
 * @param {object} state
 * @param {number} dt — seconds
 */
export function tickSlowMotion(state, dt) {
  if (!state._slowMotionActive) return;
  state._slowMotionTimer -= dt;
  if (state._slowMotionTimer <= 0) {
    state._slowMotionActive = false;
    state._slowMotionTimer = 0;
  }
}

/**
 * Get the cost of a power-up by id.
 * @param {string} type
 * @returns {number}
 */
export function getPowerupCost(type) {
  return POWERUPS[type]?.cost ?? 0;
}
