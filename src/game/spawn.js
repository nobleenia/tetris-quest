import { PIECE_IDS } from './pieces.js';
import { canPlace } from './board.js';

// --- Legacy random (fallback when no 7-bag is configured) ----------------
export function randomPieceId() {
  return PIECE_IDS[Math.floor(Math.random() * PIECE_IDS.length)];
}

/**
 * Pull the next piece ID from the session bag (7-bag) if available,
 * otherwise fall back to pure random.
 *
 * @param {object|null} bag - 7-bag instance from session.getBag()
 * @returns {string} piece ID
 */
function nextPieceId(bag) {
  return bag ? bag.next() : randomPieceId();
}

/**
 * Ensure state.nextId is always set.
 *
 * @param {object} state
 * @param {object|null} [bag] - 7-bag instance
 */
export function initQueue(state, bag = null) {
  const b = bag || state._bag || null;
  if (!state.nextId) state.nextId = nextPieceId(b);
}

/**
 * Spawn the next piece from the queue. Pulls from 7-bag when available.
 *
 * @param {object} state
 * @param {object|null} [bag] - 7-bag instance
 * @returns {boolean} true if spawn succeeded
 */
export function spawnFromQueue(state, bag = null) {
  const b = bag || state._bag || null;
  initQueue(state, b);

  const pieceId = state.nextId;
  state.nextId = nextPieceId(b);

  const x = 3;
  // spawn at top of hidden area so pieces can rotate into visible space
  const y = state.hiddenRows || 0;

  const candidate = { id: pieceId, rot: 0, x, y };

  // If blocked, still set active (we'll use this for top-out/lives later)
  if (
    !canPlace(
      state.lockedBoard,
      state.cols,
      state.rows,
      candidate.id,
      candidate.rot,
      candidate.x,
      candidate.y,
    )
  ) {
    state.active = candidate; // shows the failure visually
    return false;
  }

  state.active = candidate;
  return true;
}
