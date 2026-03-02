import { triggerLifeFlash } from '../ui/lifeflash.js';

/**
 * Handle a top-out (board filled up).
 *
 * Any top-out immediately ends the current level attempt.
 * The life was already spent when the player entered the level
 * (via spendLife() in the game scene), so we do NOT decrement lives
 * here. We just flag the game as over so the main loop can navigate
 * to the results scene.
 */
export function handleTopOut(state) {
  triggerLifeFlash();

  // Clear logical board so next frame's nextBoard is empty.
  state.lockedBoard.fill(0);
  state.nextBoard.fill(0);

  state.active = null;
  state.pressure = 0;
  state.dropAcc = 0;
  state.holdId = null;
  state.holdUsed = false;

  // End the level attempt immediately.
  state.gameOver = true;
  state.paused = false;
}
