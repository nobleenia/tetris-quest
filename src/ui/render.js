import { PIECE_VALUE, getBlocks, PIECE_OFFSETS } from '../game/pieces.js';

export function renderBoardDiff(cells, prevBoard, nextBoard) {
  const len = nextBoard.length;

  for (let i = 0; i < len; i++) {
    const nv = nextBoard[i];
    if (prevBoard[i] === nv) continue; // no change → skip

    const cell = cells[i];
    // Update dataset instead of className
    // This avoids full style recalculations
    if (nv === 0) {
      // Only clear if previously non-zero
      if (prevBoard[i] !== 0) {
        cell.dataset.v = '0';
      }
    } else {
      cell.dataset.v = String(nv);
    }

    prevBoard[i] = nv;
  }
}

export function renderPreview(cellsObj, pieceId, rot) {
  if (!cellsObj || !cellsObj.cells) return;
  const cells = cellsObj.cells;
  const size = cellsObj.size || 4;

  // Cache previous state to avoid useless DOM work
  if (cellsObj.prevPieceId === pieceId && cellsObj.prevRot === rot) {
    return; // nothing changed → skip
  }
  cellsObj.prevPieceId = pieceId;
  cellsObj.prevRot = rot;

  // Clear grid only when needed
  for (let i = 0; i < cellsObj.cellCount; i++) {
    cells[i].dataset.v = '0';
  }

  if (!pieceId) return;
  const v = PIECE_VALUE[pieceId];
  const blocks = PIECE_OFFSETS?.[pieceId]?.[rot] || getBlocks(pieceId, rot);

  // Collect block coords into an array for bounding-box centering
  const pts = [];
  if (blocks instanceof Int8Array) {
    for (let i = 0; i < blocks.length; i += 2) pts.push([blocks[i], blocks[i + 1]]);
  } else {
    for (let i = 0; i < blocks.length; i++) pts.push([blocks[i][0], blocks[i][1]]);
  }

  // Compute bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [dx, dy] of pts) {
    if (dx < minX) minX = dx;
    if (dy < minY) minY = dy;
    if (dx > maxX) maxX = dx;
    if (dy > maxY) maxY = dy;
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  const offsetX = Math.floor((size - bw) / 2) - minX;
  const offsetY = Math.floor((size - bh) / 2) - minY;

  // Paint blocks
  for (const [dx, dy] of pts) {
    const x = dx + offsetX;
    const y = dy + offsetY;
    if (x < 0 || x >= size || y < 0 || y >= size) continue;
    const idx = y * size + x;
    cells[idx].dataset.v = String(v);
  }
}
