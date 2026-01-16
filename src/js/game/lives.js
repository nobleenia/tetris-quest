export function handleTopOut(state) {
  state.lives -= 1;

  // reset-style: clear board and reset pacing
  state.lockedBoard.fill(0);
  state.prevBoard.fill(0);
  state.nextBoard.fill(0);

  state.active = null;

  state.pressure = 0;
  state.dropAcc = 0;
  
  state.holdId = null;
  state.holdUsed = false;

  if (state.lives <= 0) {
    state.gameOver = true;
  }
}
