export function createHUD() {
    const elTime = document.querySelector("#hudTime");
    const elScore = document.querySelector("#hudScore");
    const elLives = document.querySelector("#hudLives");
    const elFps = document.querySelector("#hudFps");
    const elMs = document.querySelector("#hudMs");
    const elPressure = document.querySelector("#hudPressure");
    const elDailyBest = document.querySelector("#hudDailyBest");
    const pauseOverlay = document.querySelector("#pauseOverlay");
    const gameOverOverlay = document.querySelector("#gameOverOverlay");
    const elGameOverScore = document.querySelector("#gameOverScore");

    return {
        setTime(sec) { elTime.textContent = sec.toFixed(1); },
        setScore(n) { elScore.textContent = String(n); },
        setLives(n) { elLives.textContent = String(n); },
        setPerf(fps, ms) {
            elFps.textContent = String(fps);
            elMs.textContent = ms.toFixed(2);
        },
        setPressure(pct) {
            elPressure.textContent = `${Math.round(pct)}%`;
        },
        setDailyBest(sec) {
            const s = Math.max(0, Math.floor(sec));
            const m = Math.floor(s / 60);
            const r = s % 60;
            elDailyBest.textContent = `${m}:${r.toString().padStart(2, "0")}`;
        },
        setPaused(paused) {
            pauseOverlay.classList.toggle("hidden", !paused);
        },
        showGameOver(score) {
            if (!gameOverOverlay) return;
            elGameOverScore.textContent = String(score);
            gameOverOverlay.classList.remove("hidden");
        },
        hideGameOver() {
            if (!gameOverOverlay) return;
            gameOverOverlay.classList.add("hidden");
        },
    };
}