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