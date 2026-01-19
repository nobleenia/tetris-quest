import { getBlocks, PIECE_VALUE } from "./pieces.js";
import { indexOf, inBounds } from "./board.js";

export function lockActivePiece(state) {
  const a = state.active;
  if (!a) return;

  const v = PIECE_VALUE[a.id];
  const blocks = getBlocks(a.id, a.rot);

  for (const [dx, dy] of blocks) {
    const x = a.x + dx;
    const y = a.y + dy;
    if (!inBounds(x, y, state.cols, state.rows)) continue;
    state.lockedBoard[indexOf(x, y, state.cols)] = v;
  }
}
