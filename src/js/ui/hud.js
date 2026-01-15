export function createHUD() {
    const elTime = document.querySelector("#hudTime");
    const elScore = document.querySelector("#hudScore");
    const elLives = document.querySelector("#hudLives");
    const elFps = document.querySelector("#hudFps");
    const elMs = document.querySelector("#hudMs");

    const pauseOverlay = document.querySelector("#pauseOverlay");

    return {
        setTime(sec) { elTime.textContent = sec.toFixed(1); },
        setScore(n) { elScore.textContent = String(n); },
        setLives(n) { elLives.textContent = String(n); },
        setPerf(fps, ms) {
            elFps.textContent = String(fps);
            elMs.textContent = ms.toFixed(2);
        },
        setPaused(paused) {
            pauseOverlay.classList.toggle("hidden", !paused);
        },
    };
}