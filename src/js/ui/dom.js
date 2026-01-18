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

export function createPreviewDOM({ previewEl, size = 4 }) {
  // create a small square grid for preview (size x size)
  const grid = document.createElement('div');
  grid.className = 'preview__grid';
  previewEl.appendChild(grid);

  const cellCount = size * size;
  const cells = new Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    grid.appendChild(cell);
    cells[i] = cell;
  }

  return { cells, size, cellCount };
}
