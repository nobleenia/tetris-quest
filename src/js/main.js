import { createInitialState, resetGame } from './engine/state.js';
import { createLoop } from './engine/loop.js';
import { createInput } from './engine/input.js';
import { bindPauseUI } from './ui/pause.js';
import { createHUD } from './ui/hud.js';

// Phase 1 boot
const state = createInitialState();
const input = createInput();

// HUD (timer/score/lives + perf)
const hud = createHUD();

// Pause overlay
bindPauseUI({
    onContinue: () => {
        state.paused = false;
    },
    onRestart: () => {
        resetGame(state);
        state.paused = false;
    },
});

// Toggle Pause with Escape (input module tracks keys; we just need to react here)
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        state.paused = !state.paused;
    }
});

// Main loop
const loop = createLoop({
    onUpdate: (dt) => {
        // Update game time

        // Phase 1 placeholder update: just track time while running
        // (In Phase 2/3 we’ll run simulation here)
        state.timeSec += dt;

        // Here would go game update logic (movement, collisions, etc)

        // Example: if you hold Space, add score (just to prove key-hold works)
        // Remove this in Phase 2.
        if (input.isDown("Space")) state.score += 1;
    },
    onRender: () => {
        // Here would go rendering logic (drawing to canvas, etc)
        
        // Phase 1 render does not touch the board yet.
        // We still update HUD even when paused (required).
        hud.setTime(state.timeSec);
        hud.setScore(state.score);
        hud.setLives(state.lives);

        // Show/hide pause overlay (UI responds every frame based on state)
        hud.setPaused(state.paused);
    },
    onPerf: (perf) => {
        hud.setPerf(perf.fps, perf.frameMs);
    },
    isPaused: () => state.paused,
});

// Start
loop.start();