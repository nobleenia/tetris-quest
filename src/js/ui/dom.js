export function createBoardDOM({ boardEl, cols = 10, rows = 20 }) {
	// Clear existing content 
	boardEl.innerHTML = "";

	// Create a container grid inside #board
	const grid = document.createElement("div");
	grid.className = "board__grid";
	grid.style.setProperty("--cols", cols);
	grid.style.setProperty("--rows", rows);
	boardEl.appendChild(grid);

	const cellCount = cols * rows;
	const cells = new Array(cellCount);

	// Build all cells in a DocumentFragment (fast) 
	const frag = document.createDocumentFragment();

	// Create 200 divs once and store references
	for (let i = 0; i < cellCount; i++) {
		const cell = document.createElement("div");
		cell.className = "cell";
		cell.dataset.v = "0"; // initial empty
		cells[i] = cell;
		frag.appendChild(cell);
	}
	grid.appendChild(frag);

	return { cells, cols, rows, cellCount };
}

export function createPreviewDOM({ previewEl, size = 4 }) {
	if (!previewEl) {
		console.warn("createPreviewDOM: previewEl is null");
		return { cells: [], size, cellCount: 0 };
	}
	// Clear existing content
	previewEl.innerHTML = "";

	// create a small square grid for preview (size x size)
	const grid = document.createElement('div');
	grid.className = 'preview__grid';
	grid.style.setProperty("--size", size);
	previewEl.appendChild(grid);

	const cellCount = size * size;
	const cells = new Array(cellCount);

	const frag = document.createDocumentFragment();

	for (let i = 0; i < cellCount; i++) {
		const cell = document.createElement('div');
		cell.className = 'cell';
		cell.dataset.v = "0";	
		cells[i] = cell;
		frag.appendChild(cell);
	}
	grid.appendChild(frag);

	return { cells, size, cellCount };
}
