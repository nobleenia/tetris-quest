import { canPlace } from "./board.js";

const KICKS = [0, -1, 1, -2, 2];

export function tryRotateCW(state) {
  const a = state.active;
  if (!a) return false;

  // O piece doesn’t need rotation handling (same shape), but it's harmless.
  const nextRot = (a.rot + 1) & 3;

  for (const dx of KICKS) {
    const nx = a.x + dx;
    const ny = a.y;

    const ok = canPlace(
      state.lockedBoard,
      state.cols,
      state.rows,
      a.id,
      nextRot,
      nx,
      ny
    );

    if (ok) {
      a.rot = nextRot;
      a.x = nx;
      return true;
    }
  }

  return false;
}
