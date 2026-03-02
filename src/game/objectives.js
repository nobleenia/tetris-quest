/**
 * Stackr Quest — Objective System
 *
 * Tracks level objective progress and evaluates win/fail conditions.
 * Called every tick during adventure mode to check if the player
 * has completed or failed the current level objective.
 *
 * Objective types (from GDD):
 *   clearLines  — Clear N lines
 *   reachScore  — Reach X points
 *   survive     — Survive N seconds
 *   digDown     — Clear pre-placed garbage to reveal target row
 *   comboChain  — Achieve a combo of N consecutive line clears
 *   pieceLimit  — Complete goal using only N pieces
 *   clearBoard  — Remove all blocks from the board
 *   timed       — Clear 40 lines as fast as possible (star = time-based)
 */

/**
 * Check objective progress. Returns an object describing the current status.
 *
 * @param {object} state — game state (must have objective + tracking counters)
 * @returns {{ progress: number, target: number, ratio: number, complete: boolean, failed: boolean }}
 */
export function checkObjective(state) {
  const obj = state.objective;
  if (!obj) return { progress: 0, target: 0, ratio: 0, complete: false, failed: false };

  const result = { progress: 0, target: obj.target, ratio: 0, complete: false, failed: false };

  switch (obj.type) {
    case 'clearLines':
      result.progress = state.linesCleared;
      break;

    case 'reachScore':
      result.progress = state.score;
      break;

    case 'survive':
      result.progress = state.elapsedSec;
      break;

    case 'digDown':
      // Progress = garbage rows cleared. Target row is the bottom-most
      // that had pre-placed blocks. We track this as lines cleared
      // since garbage starts from bottom.
      result.progress = state.linesCleared;
      break;

    case 'comboChain':
      result.progress = state.maxCombo;
      break;

    case 'pieceLimit':
      // Objective: clear N lines using limited pieces.
      // Progress = lines cleared. Fail = ran out of pieces before target.
      result.progress = state.linesCleared;
      break;

    case 'clearBoard':
      result.progress = countFilledCells(state) === 0 ? 1 : 0;
      result.target = 1; // binary: cleared or not
      break;

    case 'timed':
      // Sprint mode: clear target lines, star rating based on time.
      result.progress = state.linesCleared;
      break;

    default:
      // Unknown objective type — treat as incomplete
      break;
  }

  result.ratio = result.target > 0 ? Math.min(result.progress / result.target, 1) : 0;
  result.complete = result.progress >= result.target;

  return result;
}

/**
 * Check if the player has failed the level (constraint violations).
 *
 * @param {object} state
 * @returns {{ failed: boolean, reason: string|null }}
 */
export function checkFailConditions(state) {
  // Time limit exceeded
  if (state.timeLimit > 0 && state.elapsedSec >= state.timeLimit) {
    // Exception: for 'survive' objective, reaching the time limit is success
    if (state.objective?.type === 'survive') {
      return { failed: false, reason: null };
    }
    return { failed: true, reason: 'timeUp' };
  }

  // Piece limit exceeded without completing objective
  if (state.pieceLimit > 0 && state.pieceCount >= state.pieceLimit) {
    const obj = checkObjective(state);
    if (!obj.complete) {
      return { failed: true, reason: 'piecesExhausted' };
    }
  }

  // Game over (top-out with no lives)
  if (state.gameOver) {
    return { failed: true, reason: 'topOut' };
  }

  return { failed: false, reason: null };
}

/**
 * Run a full objective + fail check. Updates state flags.
 * Call this once per tick (or after significant events like line clears).
 *
 * @param {object} state
 * @returns {{ complete: boolean, failed: boolean, reason: string|null, progress: number, target: number }}
 */
export function tickObjective(state) {
  if (state.mode !== 'adventure' || !state.objective) {
    return { complete: false, failed: false, reason: null, progress: 0, target: 0 };
  }

  // Already resolved
  if (state.objectiveComplete || state.objectiveFailed) {
    return {
      complete: state.objectiveComplete,
      failed: state.objectiveFailed,
      reason: null,
      progress: 0,
      target: 0,
    };
  }

  // Check completion
  const obj = checkObjective(state);
  if (obj.complete) {
    state.objectiveComplete = true;
    return { ...obj, failed: false, reason: null };
  }

  // Check failure
  const fail = checkFailConditions(state);
  if (fail.failed) {
    state.objectiveFailed = true;
    return { ...obj, failed: true, reason: fail.reason };
  }

  return { ...obj, failed: false, reason: null };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Count non-empty cells in the visible board area.
 * Used for clearBoard objective.
 *
 * @param {object} state
 * @returns {number}
 */
function countFilledCells(state) {
  const { cols, rows, hiddenRows, lockedBoard } = state;
  let count = 0;
  for (let y = hiddenRows; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (lockedBoard[y * cols + x] !== 0) count++;
    }
  }
  return count;
}
