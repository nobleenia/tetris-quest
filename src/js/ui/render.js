import { PIECE_VALUE, getBlocks, PIECE_OFFSETS } from "../game/pieces.js";

const CLASS_FOR_VALUE = [
  "cell",
  "cell cell--1",
  "cell cell--2",
  "cell cell--3",
  "cell cell--4",
  "cell cell--5",
  "cell cell--6",
  "cell cell--7",
];

function classForValue(v) {
  // 0 = empty, 1..n = filled types
  if (v === 0) return "cell";
  return `cell cell--${v}`;
}

export function renderBoardDiff(cells, prevBoard, nextBoard) {
  const len = nextBoard.length;
  const cellsLocal = cells;
  const prev = prevBoard;
  const next = nextBoard;

  for (let i = 0; i < len; i++) {
    const nv = next[i];
    if (prev[i] === nv) continue;
    cellsLocal[i].className = nv === 0 ? "cell" : CLASS_FOR_VALUE[nv];
    prev[i] = nv;
  }
}

export function renderPreview(cellsObj, pieceId, rot) {
  if (!cellsObj || !cellsObj.cells) return;
  const cells = cellsObj.cells;
  const size = cellsObj.size || 4;
  // Clear grid
  for (let i = 0; i < cellsObj.cellCount; i++) cells[i].className = 'cell';

  if (!pieceId) return;
  const v = PIECE_VALUE[pieceId];
  const blocks = PIECE_OFFSETS && PIECE_OFFSETS[pieceId] ? PIECE_OFFSETS[pieceId][rot] : getBlocks(pieceId, rot);

  // Map piece blocks into preview grid
  if (blocks instanceof Int8Array) {
    for (let i = 0; i < blocks.length; i += 2) {
      const dx = blocks[i], dy = blocks[i + 1];
      const x = dx;
      const y = dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const idx = y * size + x;
      cells[idx].className = CLASS_FOR_VALUE[v];
    }
  } else {
    for (let i = 0; i < blocks.length; i++) {
      const dx = blocks[i][0], dy = blocks[i][1];
      const x = dx;
      const y = dy;
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const idx = y * size + x;
      cells[idx].className = CLASS_FOR_VALUE[v];
    }
  }
}