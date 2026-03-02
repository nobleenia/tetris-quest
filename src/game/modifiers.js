/**
 * Stackr Quest — Special Block Modifiers
 *
 * Cell value scheme:
 *   0     = empty
 *   1–7   = normal piece colors (I, O, T, S, Z, J, L)
 *   8     = ice block (frozen — requires 2 line clears to remove)
 *   9     = stone block (immovable — never cleared by line clears)
 *   10    = bomb block (explodes 3×3 when part of a cleared line)
 *   11    = dark block (hidden until adjacent cell is cleared)
 *
 * Modifier IDs (from schema.json):
 *   iceBlocks, stoneBlocks, bombBlocks, darkBlocks,
 *   gravityFlip, gravityShift, comboMultiplier, pieceLimited
 */

// ─── Cell Type Constants ─────────────────────────────────────────────
export const CELL_EMPTY = 0;
export const CELL_ICE = 8;
export const CELL_STONE = 9;
export const CELL_BOMB = 10;
export const CELL_DARK = 11;

/**
 * Check if a cell value represents a special block.
 * @param {number} v — cell value
 * @returns {boolean}
 */
export function isSpecialBlock(v) {
  return v >= 8 && v <= 11;
}

/**
 * Check if a cell is clearable by a normal line clear.
 * Stone blocks are never cleared. Ice blocks partially clear.
 *
 * @param {number} v — cell value
 * @returns {boolean} — true if this cell can participate in line-clear removal
 */
export function isClearable(v) {
  if (v === CELL_STONE) return false; // stone: immovable
  return v !== CELL_EMPTY;
}

/**
 * Check if a row is "full" (eligible for clearing).
 * Stone blocks count as filled but rows containing ONLY stone can't clear.
 * A row must have at least one non-stone filled cell to be clearable.
 *
 * @param {Uint8Array} board
 * @param {number} y — row index
 * @param {number} cols
 * @returns {boolean}
 */
export function isRowFull(board, y, cols) {
  let hasNonStone = false;

  for (let x = 0; x < cols; x++) {
    const v = board[y * cols + x];
    if (v === CELL_EMPTY) return false; // gap → not full
    if (v !== CELL_STONE) hasNonStone = true;
  }

  return hasNonStone; // full, and at least one clearable cell
}

/**
 * Process ice blocks in a cleared row.
 * Instead of removing ice cells, demote them: ice → normal color (random 1-7).
 * The ice needs a _second_ line clear to actually remove.
 *
 * We represent first-hit ice by converting CELL_ICE to a random normal value.
 * On the next clear, it's just a normal cell and clears normally.
 *
 * @param {Uint8Array} board
 * @param {number} y — the row being cleared
 * @param {number} cols
 * @returns {boolean} true if any ice was found (row shouldn't fully clear)
 */
export function processIceInRow(board, y, cols) {
  let hadIce = false;
  for (let x = 0; x < cols; x++) {
    const idx = y * cols + x;
    if (board[idx] === CELL_ICE) {
      // Demote ice to random normal color
      board[idx] = Math.floor(Math.random() * 7) + 1;
      hadIce = true;
    }
  }
  return hadIce;
}

/**
 * Find and trigger bomb explosions in a cleared row.
 * Each bomb clears a 3×3 area around itself.
 *
 * @param {Uint8Array} board
 * @param {number} y — the row being cleared
 * @param {number} cols
 * @param {number} rows — total rows
 * @returns {number} total additional cells cleared by bombs
 */
export function processBombsInRow(board, y, cols, rows) {
  let additionalClears = 0;
  const bombPositions = [];

  // Find all bombs in this row
  for (let x = 0; x < cols; x++) {
    if (board[y * cols + x] === CELL_BOMB) {
      bombPositions.push(x);
    }
  }

  // Explode each bomb (3×3 area, excluding stone)
  for (const bx of bombPositions) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = bx + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const idx = ny * cols + nx;
        const v = board[idx];
        if (v !== CELL_EMPTY && v !== CELL_STONE) {
          board[idx] = CELL_EMPTY;
          additionalClears++;
        }
      }
    }
  }

  return additionalClears;
}

/**
 * Reveal dark blocks adjacent to a cleared cell.
 * Dark blocks become normal colored when a neighboring cell is cleared.
 *
 * @param {Uint8Array} board
 * @param {number} x — cleared cell x
 * @param {number} y — cleared cell y
 * @param {number} cols
 * @param {number} rows
 */
export function revealAdjacentDarkBlocks(board, x, y, cols, rows) {
  const neighbors = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
    const idx = ny * cols + nx;
    if (board[idx] === CELL_DARK) {
      // Reveal: convert to random normal color
      board[idx] = Math.floor(Math.random() * 7) + 1;
    }
  }
}

/**
 * Check if a modifier is active in the current state.
 *
 * @param {object} state
 * @param {string} modifier — modifier ID
 * @returns {boolean}
 */
export function hasModifier(state, modifier) {
  return state.modifiers?.includes(modifier) ?? false;
}

/**
 * Apply gravity shift effect: oscillate base interval on a timer.
 * The gravity oscillates between fast and slow on a sine wave.
 *
 * @param {object} state
 * @param {number} dt — delta time in seconds
 */
export function tickGravityShift(state, _dt) {
  if (!hasModifier(state, 'gravityShift')) return;

  // Oscillate between baseInterval and minInterval on a 10-second cycle
  const cycle = 10; // seconds per full oscillation
  const phase = (state.elapsedSec % cycle) / cycle;
  const sin = Math.sin(phase * Math.PI * 2);
  const mid = (state.baseInterval + state.minInterval) / 2;
  const amp = (state.baseInterval - state.minInterval) / 2;

  state.dropInterval = mid + amp * sin;
}

/**
 * Get CSS class for a cell value (for render).
 * Used to apply special block styling.
 *
 * @param {number} v — cell value
 * @returns {string} — CSS class suffix
 */
export function getCellClass(v) {
  switch (v) {
    case CELL_ICE:
      return 'cell-ice';
    case CELL_STONE:
      return 'cell-stone';
    case CELL_BOMB:
      return 'cell-bomb';
    case CELL_DARK:
      return 'cell-dark';
    default:
      return '';
  }
}
