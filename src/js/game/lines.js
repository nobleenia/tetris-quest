import { indexOf } from "./board.js";
import { flashTetris } from "../ui/tetrisflash.js";


// Returns number of cleared lines
export function clearFullLines(state) {
	const { cols, rows, lockedBoard } = state;

	let writeRow = rows - 1;
	let cleared = 0;

	// Scan from bottom up
	for (let y = rows - 1; y >= 0; y--) {
		let full = true;

		for (let x = 0; x < cols; x++) {
			if (lockedBoard[indexOf(x, y, cols)] === 0) {
				full = false;
				break;
			}
		}

		if (full) {
			cleared += 1;
			continue; // skip copying this row (it disappears)
		}

		// Copy this row down to writeRow (if needed)
		if (writeRow !== y) {
			for (let x = 0; x < cols; x++) {
				lockedBoard[indexOf(x, writeRow, cols)] =
				lockedBoard[indexOf(x, y, cols)];
			}
		}
		writeRow -= 1;
	}

	if (cleared === 4) {
		flashTetris();
	}

	// Fill remaining rows at the top with 0
	for (let y = writeRow; y >= 0; y--) {
		for (let x = 0; x < cols; x++) {
			lockedBoard[indexOf(x, y, cols)] = 0;
		}
	}

	return cleared;
}
