import { countHoles } from './board.js';
import { lockActivePiece } from './lock.js';
import { clearFullLines } from './lines.js';
import { addLineClearScore } from './score.js';
import { reducePressureOnClear } from './pressure.js';
import { spawnFromQueue } from './spawn.js';
import { handleTopOut } from './lives.js';

export function hardDrop(state, tryMove, hud) {
  if (!state.active) return;

  // 1. Descend until collision
  while (tryMove(state, 0, 1)) {
    // while possible
  }

  // 2. Count holes before lock (for "misplaced" rule)
  const holesBefore = countHoles(state.lockedBoard, state.cols, state.rows);

  // 3. Lock the piece
  lockActivePiece(state);

  // 4. Clear lines
  const cleared = clearFullLines(state);
  addLineClearScore(state, cleared);
  reducePressureOnClear(state, cleared);

  // 5. Reset 'hold'
  state.holdUsed = false;

  // 6. Spawn next piece
  const ok = spawnFromQueue(state);

  // 7. "misplaced" rule
  if (state.misplacedPlacementRule) {
    const holesAfter = countHoles(state.lockedBoard, state.cols, state.rows);
    if (holesAfter > holesBefore) {
      state.lives = Math.max(0, state.lives - 1);
      hud.setLives(state.lives);
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    }
  }

  // 8. Top-out
  if (!ok) {
    handleTopOut(state);
  }
}
