function classForValue(v) {
  // 0 = empty, 1..n = filled types
  if (v === 0) return "cell";
  return `cell cell--${v}`;
}

export function renderBoardDiff({ cells, prevBoard, nextBoard }) {
  // Compare element by element
  for (let i = 0; i < nextBoard.length; i++) {
    if (prevBoard[i] === nextBoard[i]) continue; // no change -> no DOM work

    // Update only changed cells
    cells[i].className = classForValue(nextBoard[i]);

    // Sync prev so next diff compares correctly
    prevBoard[i] = nextBoard[i];
  }
}
