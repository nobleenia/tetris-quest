import { getBlocks, PIECE_VALUE, PIECE_OFFSETS } from "./pieces.js";

export function indexOf(x, y, cols) {
  return y * cols + x;
}

export function inBounds(x, y, cols, rows) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

export function canPlace(locked, cols, rows, pieceId, rot, px, py) {
  const blocks = PIECE_OFFSETS && PIECE_OFFSETS[pieceId] ? PIECE_OFFSETS[pieceId][rot] : getBlocks(pieceId, rot);
  if (blocks instanceof Int8Array) {
    for (let i = 0; i < blocks.length; i += 2) {
      const dx = blocks[i], dy = blocks[i + 1];
      const x = px + dx, y = py + dy;
      if (!inBounds(x, y, cols, rows)) return false;
      if (locked[indexOf(x, y, cols)] !== 0) return false;
    }
    return true;
  } else {
    for (const [dx, dy] of blocks) {
      const x = px + dx, y = py + dy;
      if (!inBounds(x, y, cols, rows)) return false;
      if (locked[indexOf(x, y, cols)] !== 0) return false;
    }
    return true;
  }
}

// next = locked + active piece overlay
export function buildNextBoard(locked, next, cols, rows, active) {
  if (next.set) next.set(locked);
  else copyInto(next, locked);

  if (!active) return;

  const { id, rot, x: px, y: py } = active;
  const v = PIECE_VALUE[id];

  // If PIECE_OFFSETS is available, iterate it (flat Int8Array) for speed.
  const blocks = PIECE_OFFSETS && PIECE_OFFSETS[id] ? PIECE_OFFSETS[id][rot] : getBlocks(id, rot);

  if (blocks instanceof Int8Array) {
    for (let i = 0; i < blocks.length; i += 2) {
      const dx = blocks[i], dy = blocks[i + 1];
      const x = px + dx, y = py + dy;
      if (!inBounds(x, y, cols, rows)) continue;
      next[indexOf(x, y, cols)] = v;
    }
  } else {
    for (let i = 0; i < blocks.length; i++) {
      const dx = blocks[i][0], dy = blocks[i][1];
      const x = px + dx, y = py + dy;
      if (!inBounds(x, y, cols, rows)) continue;
      next[indexOf(x, y, cols)] = v;
    }
  }
}

function copyInto(dst, src) {
  for (let i = 0; i < src.length; i++) dst[i] = src[i];
}
