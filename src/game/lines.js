import { indexOf } from './board.js';
import { flashTetris } from '../ui/tetrisflash.js';
import { burstParticles } from '../ui/particles.js';
import {
  CELL_EMPTY,
  CELL_STONE,
  isRowFull,
  processIceInRow,
  processBombsInRow,
  revealAdjacentDarkBlocks,
  hasModifier,
} from './modifiers.js';

/**
 * Clear full lines from the board.
 * Now handles special block types:
 *   - Stone blocks: rows with only stone can't clear; stone cells remain
 *   - Ice blocks: demoted to normal on first clear (need 2nd clear to remove)
 *   - Bomb blocks: explode 3x3 when part of a cleared line
 *   - Dark blocks: revealed when adjacent cells are cleared
 *
 * @param {object} state
 * @returns {number} number of cleared lines
 */
export function clearFullLines(state) {
  const { cols, rows, lockedBoard, modifiers } = state;
  const hasSpecials = modifiers && modifiers.length > 0;

  // ── Phase 1: Identify full rows ──────────────────────────────────
  const fullRows = [];
  for (let y = rows - 1; y >= 0; y--) {
    if (hasSpecials ? isRowFull(lockedBoard, y, cols) : isRowFullSimple(lockedBoard, y, cols)) {
      fullRows.push(y);
    }
  }

  if (fullRows.length === 0) return 0;

  // ── Phase 2: Process special blocks in full rows ─────────────────
  if (hasSpecials) {
    for (const y of fullRows) {
      // Ice: demote instead of removing
      if (hasModifier(state, 'iceBlocks')) {
        processIceInRow(lockedBoard, y, cols);
      }

      // Bombs: explode 3x3
      if (hasModifier(state, 'bombBlocks')) {
        processBombsInRow(lockedBoard, y, cols, rows);
      }
    }
  }

  // ── Phase 3: Remove cleared rows (compact board) ─────────────────
  let writeRow = rows - 1;
  let cleared = 0;

  for (let y = rows - 1; y >= 0; y--) {
    // Re-check: ice processing may have un-fulled some rows
    const isFull = hasSpecials
      ? isRowFull(lockedBoard, y, cols)
      : isRowFullSimple(lockedBoard, y, cols);

    if (isFull) {
      // Reveal dark blocks adjacent to every cell in this row before clearing
      if (hasSpecials && hasModifier(state, 'darkBlocks')) {
        for (let x = 0; x < cols; x++) {
          revealAdjacentDarkBlocks(lockedBoard, x, y, cols, rows);
        }
      }

      // Clear non-stone cells in the row
      for (let x = 0; x < cols; x++) {
        const idx = indexOf(x, y, cols);
        if (lockedBoard[idx] !== CELL_STONE) {
          lockedBoard[idx] = CELL_EMPTY;
        }
      }

      cleared += 1;
      continue; // skip copying this row
    }

    // Copy this row down to writeRow (if needed)
    if (writeRow !== y) {
      for (let x = 0; x < cols; x++) {
        lockedBoard[indexOf(x, writeRow, cols)] = lockedBoard[indexOf(x, y, cols)];
      }
    }
    writeRow -= 1;
  }

  // Fill remaining rows at the top with 0
  for (let y = writeRow; y >= 0; y--) {
    for (let x = 0; x < cols; x++) {
      lockedBoard[indexOf(x, y, cols)] = CELL_EMPTY;
    }
  }

  // ── Juice ────────────────────────────────────────────────────────
  if (cleared === 4) {
    flashTetris();
    burstParticles();
  }

  return cleared;
}

/**
 * Simple row-full check (no special blocks).
 * Preserved for performance in classic mode.
 */
function isRowFullSimple(board, y, cols) {
  for (let x = 0; x < cols; x++) {
    if (board[y * cols + x] === 0) return false;
  }
  return true;
}
