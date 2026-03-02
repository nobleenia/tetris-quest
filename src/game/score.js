/**
 * Stackr Quest — Scoring System
 *
 * Base scoring:
 *   1 line: 100, 2 lines: 300, 3 lines: 500, 4 lines (Tetris): 800
 *
 * Combo multiplier (when comboMultiplier modifier is active):
 *   Consecutive line clears increase score by 50 * comboCount bonus.
 *   Combo resets when a piece is placed without clearing any lines.
 */

import { hasModifier } from './modifiers.js';

const SCORE_TABLE = [0, 100, 300, 500, 800];

/**
 * Add score from clearing lines.
 * Applies combo bonus when the comboMultiplier modifier is active.
 *
 * @param {object} state
 * @param {number} linesCleared
 */
export function addLineClearScore(state, linesCleared) {
  if (linesCleared <= 0) return;

  // Base score
  let points = SCORE_TABLE[linesCleared] ?? linesCleared * 200;

  // Combo multiplier bonus
  if (hasModifier(state, 'comboMultiplier') && state.combo > 1) {
    points += 50 * state.combo;
  }

  state.score += points;
}
