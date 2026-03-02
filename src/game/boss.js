/**
 * Stackr Quest — Boss Level Framework
 *
 * Boss levels have attack patterns that interfere with the player at timed
 * intervals. Bosses escalate through phases as their HP drops.
 *
 * Boss types (from GDD):
 *   garbagePush  — Garbage rows push up periodically
 *   pieceFamine  — Reduced piece supply (tight piece limit)
 *   risingTide   — Accelerating garbage from bottom
 *   speedDemon   — Gravity accelerates every N seconds
 *   lavaFlow     — Random columns get stone blocks
 *   mirage       — Dark blocks appear in waves
 *   blackout     — Board goes dark periodically (visibility modifier)
 *   avalanche    — Ice blocks rain between piece placements
 *   zeroG        — Gravity flips every N seconds
 *   finalBoss    — 3-phase escalation, all mechanics
 */

import { CELL_STONE, CELL_ICE, CELL_DARK } from './modifiers.js';
import { indexOf } from './board.js';

/**
 * Initialize boss state from level config.
 * Called when a boss level starts.
 *
 * @param {object} state — game state
 */
export function initBoss(state) {
  if (!state.boss) return;
  state.bossHP = state.boss.hp ?? 30;
  state.bossPhaseIdx = 0;
  state.bossAttackTimer = 0;
  state.bossBlackout = false;
}

/**
 * Tick the boss system. Handles attack timers, phase transitions.
 * Call once per simulation step.
 *
 * @param {object} state
 * @param {number} dt — delta time in seconds
 */
export function tickBoss(state, dt) {
  if (!state.boss || state.bossHP <= 0) return;

  // Phase transition check
  updateBossPhase(state);

  // Get current attack interval
  const interval = getCurrentAttackInterval(state);

  // Timer
  state.bossAttackTimer += dt;
  if (state.bossAttackTimer >= interval) {
    state.bossAttackTimer -= interval;
    executeBossAttack(state);
  }
}

/**
 * Deal damage to the boss (called when lines are cleared).
 *
 * @param {object} state
 * @param {number} linesCleared
 */
export function damageBoss(state, linesCleared) {
  if (!state.boss || state.bossHP <= 0) return;
  state.bossHP = Math.max(0, state.bossHP - linesCleared);
}

/**
 * Check if the boss is defeated.
 *
 * @param {object} state
 * @returns {boolean}
 */
export function isBossDefeated(state) {
  return state.boss !== null && state.boss !== undefined && state.bossHP <= 0;
}

// ─── Internal ────────────────────────────────────────────────────────

/**
 * Update boss phase based on remaining HP percentage.
 */
function updateBossPhase(state) {
  const phases = state.boss.phases;
  if (!phases || phases.length === 0) return;

  const hpRatio = state.bossHP / (state.boss.hp ?? 30);

  for (let i = phases.length - 1; i >= 0; i--) {
    if (hpRatio <= phases[i].hpThreshold) {
      if (state.bossPhaseIdx !== i) {
        state.bossPhaseIdx = i;
        // Apply phase modifiers
        if (phases[i].modifiers) {
          for (const mod of phases[i].modifiers) {
            if (!state.modifiers.includes(mod)) {
              state.modifiers.push(mod);
            }
          }
        }
      }
      break;
    }
  }
}

/**
 * Get the current boss attack interval (may change per phase).
 */
function getCurrentAttackInterval(state) {
  const phases = state.boss.phases;
  if (phases && phases.length > 0 && state.bossPhaseIdx < phases.length) {
    return phases[state.bossPhaseIdx].attackIntervalSec ?? state.boss.attackIntervalSec ?? 8;
  }
  return state.boss.attackIntervalSec ?? 8;
}

/**
 * Execute a boss attack based on boss type.
 */
function executeBossAttack(state) {
  switch (state.boss.type) {
    case 'garbagePush':
      attackGarbagePush(state);
      break;

    case 'risingTide':
      attackGarbagePush(state); // same mechanic, different interval
      break;

    case 'speedDemon':
      attackSpeedDemon(state);
      break;

    case 'lavaFlow':
      attackLavaFlow(state);
      break;

    case 'mirage':
      attackMirage(state);
      break;

    case 'blackout':
      attackBlackout(state);
      break;

    case 'avalanche':
      attackAvalanche(state);
      break;

    case 'zeroG':
      attackZeroG(state);
      break;

    case 'finalBoss':
      attackFinalBoss(state);
      break;

    case 'pieceFamine':
      // No periodic attack — handled by piece limit constraint
      break;

    default:
      break;
  }
}

// ─── Attack Implementations ──────────────────────────────────────────

/**
 * Push one garbage row from the bottom.
 * Existing rows shift up by 1. Inserts random garbage with one gap.
 */
function attackGarbagePush(state) {
  const { cols, rows, lockedBoard } = state;

  // Shift all rows up by 1
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      lockedBoard[indexOf(x, y, cols)] = lockedBoard[indexOf(x, y + 1, cols)];
    }
  }

  // Insert garbage row at bottom
  const bottomY = rows - 1;
  const gapX = Math.floor(Math.random() * cols);
  for (let x = 0; x < cols; x++) {
    lockedBoard[indexOf(x, bottomY, cols)] = x === gapX ? 0 : Math.floor(Math.random() * 7) + 1;
  }

  // Push active piece up if it exists
  if (state.active) {
    state.active.y = Math.max(0, state.active.y - 1);
  }
}

/**
 * Speed Demon: accelerate gravity permanently.
 */
function attackSpeedDemon(state) {
  state.baseInterval = Math.max(0.1, state.baseInterval * 0.85);
}

/**
 * Lava Flow: place stone blocks in 1-2 random columns at the bottom.
 */
function attackLavaFlow(state) {
  const { cols, rows, lockedBoard } = state;
  const numCols = Math.random() < 0.5 ? 1 : 2;

  for (let i = 0; i < numCols; i++) {
    const x = Math.floor(Math.random() * cols);
    // Find first empty cell from bottom in this column
    for (let y = rows - 1; y >= 0; y--) {
      if (lockedBoard[indexOf(x, y, cols)] === 0) {
        lockedBoard[indexOf(x, y, cols)] = CELL_STONE;
        break;
      }
    }
  }
}

/**
 * Mirage: spawn a row of dark blocks somewhere in the middle.
 */
function attackMirage(state) {
  const { cols, rows, hiddenRows, lockedBoard } = state;
  // Pick a random row in the visible area (not too high, not too low)
  const minY = hiddenRows + 4;
  const maxY = rows - 4;
  if (minY >= maxY) return;

  const y = minY + Math.floor(Math.random() * (maxY - minY));
  const numDark = 2 + Math.floor(Math.random() * 3); // 2-4 dark blocks

  for (let i = 0; i < numDark; i++) {
    const x = Math.floor(Math.random() * cols);
    if (lockedBoard[indexOf(x, y, cols)] === 0) {
      lockedBoard[indexOf(x, y, cols)] = CELL_DARK;
    }
  }
}

/**
 * Blackout: toggle board visibility periodically.
 * The render layer checks state.bossBlackout to hide/show the board.
 */
function attackBlackout(state) {
  state.bossBlackout = !state.bossBlackout;
}

/**
 * Avalanche: drop ice blocks in random columns.
 */
function attackAvalanche(state) {
  const { cols, hiddenRows, lockedBoard } = state;
  const numIce = 2 + Math.floor(Math.random() * 3); // 2-4 ice blocks

  for (let i = 0; i < numIce; i++) {
    const x = Math.floor(Math.random() * cols);
    // Place ice at the top of the visible area
    const y = hiddenRows;
    if (lockedBoard[indexOf(x, y, cols)] === 0) {
      lockedBoard[indexOf(x, y, cols)] = CELL_ICE;
    }
  }
}

/**
 * Zero-G: flip gravity direction temporarily.
 * Sets a flag that the gravity system reads.
 */
function attackZeroG(state) {
  state.gravityFlipped = !state.gravityFlipped;
}

/**
 * Final Boss: cycles through multiple attack types per phase.
 */
function attackFinalBoss(state) {
  const attacks = [attackGarbagePush, attackSpeedDemon, attackLavaFlow, attackMirage];
  const phase = state.bossPhaseIdx;

  // Phase 0: single random attack
  // Phase 1: two attacks
  // Phase 2+: three attacks
  const numAttacks = Math.min(phase + 1, 3);

  for (let i = 0; i < numAttacks; i++) {
    const atk = attacks[Math.floor(Math.random() * attacks.length)];
    atk(state);
  }
}
