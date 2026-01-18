import { canPlace } from "./board.js";

export function tryHold(state) {
  if (!state.active) return false;
  if (state.holdUsed) return false;

  const currentId = state.active.id;

  // If hold is empty: store current, and signal "spawn new"
  if (!state.holdId) {
    state.holdId = currentId;
    state.active = null;
    state.holdUsed = true;
    return true;
  }

  // Swap
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
    candidate.y
  );

  // If swap would immediately collide, reject hold
  if (!ok) {
    // revert
    state.holdId = swappedId;
    return false;
  }

  state.active = candidate;
  state.holdUsed = true;
  return true;
}
