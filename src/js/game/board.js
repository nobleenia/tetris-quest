import { getBlocks, PIECE_VALUE } from "./pieces.js";

export function indexOf(x, y, cols) {
  return y * cols + x;
}

export function inBounds(x, y, cols, rows) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

export function canPlace({ locked, cols, rows, pieceId, rot, px, py }) {
  const blocks = getBlocks(pieceId, rot);
  for (const [dx, dy] of blocks) {
    const x = px + dx;
    const y = py + dy;

    if (!inBounds(x, y, cols, rows)) return false;
    if (locked[indexOf(x, y, cols)] !== 0) return false;
  }
  return true;
}

// next = locked + active piece overlay
export function buildNextBoard({ locked, next, cols, rows, active }) {
  // Copy locked -> next without allocating a new array
  next.set ? next.set(locked) : copyInto(next, locked);

  if (!active) return;

  const { id, rot, x: px, y: py } = active;
  const v = PIECE_VALUE[id];
  const blocks = getBlocks(id, rot);

  for (const [dx, dy] of blocks) {
    const x = px + dx;
    const y = py + dy;
    if (!inBounds(x, y, cols, rows)) continue;
    next[indexOf(x, y, cols)] = v;
  }
}

function copyInto(dst, src) {
  for (let i = 0; i < src.length; i++) dst[i] = src[i];
}
