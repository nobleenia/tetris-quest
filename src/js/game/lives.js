import { initQueue, spawnFromQueue } from "./spawn.js";

export function handleTopOut(state) {
  state.lives -= 1;

  // Clear logical board so next frame's nextBoard is empty.
  state.lockedBoard.fill(0);

  // DO NOT clear prevBoard here — keep it so the diff renderer
  // sees prev != next and will update DOM cells to empty.
  // state.prevBoard.fill(0); // <--- removed intentionally

  // Ensure nextBoard is empty so renderer will clear the screen.
  state.nextBoard.fill(0);

  state.active = null;

  state.pressure = 0;
  state.dropAcc = 0;

  state.holdId = null;
  state.holdUsed = false;

  if (state.lives <= 0) {
    // Final end-of-run: flag game over and pause to let UI show overlay.
    state.gameOver = true;
    state.paused = false;
    return;
  }

  // Respawn immediately for the next life so player continues.
  initQueue(state);
  const ok = spawnFromQueue(state);

  // If spawn fails again (rare), count another life loss.
  if (!ok) {
    handleTopOut(state);
  } else {
    // ensure game is unpaused for next life
    state.paused = false;
  }
}