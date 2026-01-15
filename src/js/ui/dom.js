export function createBoardDOM({ boardEl, cols = 10, rows = 20 }) {
  // Create a container grid inside #board
  const grid = document.createElement("div");
  grid.className = "board__grid";
  boardEl.appendChild(grid);

  const cellCount = cols * rows;
  const cells = new Array(cellCount);

  // Create 200 divs once and store references
  for (let i = 0; i < cellCount; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    grid.appendChild(cell);
    cells[i] = cell;
  }

  return { cells, cols, rows, cellCount };
}
