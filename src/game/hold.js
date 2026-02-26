import { canPlace } from './board.js';
import { spawnFromQueue } from './spawn.js';
import { handleTopOut } from './lives.js';

export function tryHold(state) {
  if (!state.active) return false;
  if (state.holdUsed) return false;

  const currentId = state.active.id;

  // Case1 'hold' is empty: store current, and signal "spawn new"
  if (!state.holdId) {
    state.holdId = currentId;
    state.active = null;
    state.holdUsed = true;

    const ok = spawnFromQueue(state);
    if (!ok) handleTopOut(state);

    return true;
  }

  // Case2 'hold' is filled: Swap
  const swappedId = state.holdId;
  state.holdId = currentId;

  // Reset piece position/rotation
  const x = 3;
  const y = 0;
  const candidate = { id: swappedId, rot: 0, x, y };

  const ok = canPlace(
    state.lockedBoard,
    state.cols,
    state.rows,
    candidate.id,
    candidate.rot,
    candidate.x,
    candidate.y,
  );

  // If swap would immediately collide, reject hold
  if (!ok) {
    // revert
    //state.holdId = swappedId;

    handleTopOut(state); //modern tetris: top-out
    return false;
  }

  state.active = candidate;
  state.holdUsed = true;
  return true;
}
