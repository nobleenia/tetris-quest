export function createHUD() {
  // Header is simplified; stats are shown in the sidebar. We keep overlays here.
  const elFps = document.querySelector('#hudFps');
  const elMs = document.querySelector('#hudMs');
  const elDailyBest = document.querySelector('#hudDailyBest');
  const pauseOverlay = document.querySelector('#pauseOverlay');
  const gameOverOverlay = document.querySelector('#gameOverOverlay');
  const elGameOverScore = document.querySelector('#gameOverScore');

  return {
    // Sidebar shows the stats; these are kept as no-ops to avoid errors from callers.
    setTime() {},
    setScore() {},
    setLives() {},
    setPerf() {},
    setSimHz() {},
    setPressure() {},
    setDailyBest(sec) {
      if (!elDailyBest) return;
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      elDailyBest.textContent = `${m}:${r.toString().padStart(2, '0')}`;
    },
    setPaused(paused) {
      if (pauseOverlay) {
        pauseOverlay.classList.toggle('hidden', !paused);
        if (paused) pauseOverlay.style.display = '';
      }
    },
    showGameOver(score) {
      if (!gameOverOverlay) return;
      elGameOverScore.textContent = String(score);
      gameOverOverlay.classList.remove('hidden');
      gameOverOverlay.style.display = '';
    },
    hideGameOver() {
      if (!gameOverOverlay) return;
      gameOverOverlay.classList.add('hidden');
    },
  };
}
