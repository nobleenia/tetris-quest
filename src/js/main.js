import { createInitialState, resetGame } from './engine/state.js';
import { createLoop } from './engine/loop.js';
import { createInput } from './engine/input.js';
import { bindPauseUI } from './ui/pause.js';
import { createHUD } from './ui/hud.js';
import { createBoardDOM } from './ui/dom.js';
import { renderBoardDiff } from './ui/render.js';
import { initQueue, spawnFromQueue } from "./game/spawn.js";
import { canPlace, buildNextBoard } from "./game/board.js";
import { lockActivePiece } from "./game/lock.js";
import { tryRotateCW } from "./game/rotate.js";
import { clearFullLines } from "./game/lines.js";
import { addLineClearScore } from "./game/score.js";
import { tryHold } from "./game/hold.js";
import { tickPressure, gravityIntervalFromPressure, reducePressureOnClear } from "./game/pressure.js";
import { handleTopOut } from "./game/lives.js";

// Phase 1 boot
const state = createInitialState();
const input = createInput();

// HUD (timer/score/lives + perf)
const hud = createHUD();

const boardEl = document.querySelector("#board");
const boardDOM = createBoardDOM({ boardEl, cols: 10, rows: 20 });

// boardDOM.cells[0].className = "cell cell--1";

initQueue(state);
const ok = spawnFromQueue(state);
if (!ok) handleTopOut(state);

// Board rendering (diff-based)
// Pause overlay
bindPauseUI({
    onContinue: () => {
        state.paused = false;
    },
    onRestart: () => {
        resetGame(state);
        initQueue(state); // important because reset cleared nextId
        const ok = spawnFromQueue(state);
        if (!ok) handleTopOut(state);
        state.paused = false;
    },
});

// Toggle Pause with Escape (input module tracks keys; we just need to react here)
window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
        e.preventDefault();
        state.paused = !state.paused;
    }
});

// Spawn initial piece
// spawnFromQueue(state);

// Simple key edge detection (rookie-friendly)
let prevLeft = false;
let prevRight = false;

// function demoFillNextBoard(t) {
//     // This proves diff rendering works and paints are minimal.
//     state.nextBoard.fill(0);

//     const idx = Math.floor((t * 10) % state.nextBoard.length);
//     state.nextBoard[idx] = 1;
// }

let prevRotate = false; // for rotation key edge detection

let prevHold = false;

// Main loop
const loop = createLoop({
    onUpdate: (dt) => {
        if (state.gameOver) return;
        // Update game time

        // Phase 1 placeholder update: just track time while running
        // (In Phase 2/3 we’ll run simulation here)
        state.elapsedSec += dt;
        tickPressure(state, dt);

        // If game over, freeze gameplay (but HUD still renders)
        if (state.gameOver) {
            buildNextBoard({
                locked: state.lockedBoard,
                next: state.nextBoard,
                cols: state.cols,
                rows: state.rows,
                active: null,
            });
            return;
        }

        // Move left/right once per press (we’ll upgrade to key-hold DAS/ARR in 3.2)
        const left = input.isDown("ArrowLeft") || input.isDown("KeyA");
        const right = input.isDown("ArrowRight") || input.isDown("KeyD");

        // Rotate once per key press (no spamming)
        const rotate = input.isDown("ArrowUp") || input.isDown("KeyW");

        if (state.active) {
            if (left && !prevLeft) tryMove(state, -1, 0);
            if (right && !prevRight) tryMove(state, 1, 0);
        }

        if (rotate && !prevRotate) {
            tryRotateCW(state);
        }

        prevLeft = left;
        prevRight = right;

        prevRotate = rotate;

        // ----------- Gravity: time-based falling -----------
        // Soft drop: holding down makes it fall faster (smaller interval)
        const softDrop = input.isDown("ArrowDown") || input.isDown("KeyS");
        const base = gravityIntervalFromPressure(state);
        const interval = softDrop ? base * 0.08 : base;

        const hold = input.isDown("KeyC");
        if (hold && !prevHold) {
            const didHold = tryHold(state);

            // If hold consumed the active piece (hold was empty), spawn a new one
            if (didHold && !state.active) {
                const ok = spawnFromQueue(state);
                if (!ok) {
                    handleTopOut(state);
                    return; // stop update this frame
                }
            }
        }
        prevHold = hold;

        state.dropAcc += dt;

        // If enough time passed, attempt to move down by 1 row
        while (state.dropAcc >= interval) {
        state.dropAcc -= interval;

        if (!state.active) break;

        const moved = tryMove(state, 0, 1);
        if (!moved) {
            // Can't move down -> lock it into board
            lockActivePiece(state);

            // Clear lines and score
            const cleared = clearFullLines(state);
            addLineClearScore(state, cleared);
            reducePressureOnClear(state, cleared);

            // Reset hold usage later (Phase 3.5)
            state.holdUsed = false;

            // Spawn next piece
            const ok = spawnFromQueue(state);
            if (!ok) {
                handleTopOut(state);

                // If spawn is blocked (top-out), handle later (lives/game over Phase 4)
                state.dropAcc = 0;
                break;
            }
        }
    }

        // Build nextBoard = lockedBoard + active overlay
        buildNextBoard({
            locked: state.lockedBoard,
            next: state.nextBoard,
            cols: state.cols,
            rows: state.rows,
            active: state.active,
        });
        // demo movement: show one changing cell
        // demoFillNextBoard(state.timeSec);

        // Here would go game update logic (movement, collisions, etc)

        // Example: if you hold Space, add score (just to prove key-hold works)
        // Remove this in Phase 2.
        // if (input.isDown("Space")) state.score += 1;
    },
    onRender: () => {
        // Here would go rendering logic (drawing to canvas, etc)

        // Render board using diff
        renderBoardDiff({
            cells: boardDOM.cells,
            prevBoard: state.prevBoard,
            nextBoard: state.nextBoard,
        });
        
        // Phase 1 render does not touch the board yet.
        // We still update HUD even when paused (required).
        hud.setTime(state.elapsedSec);
        hud.setScore(state.score);
        hud.setLives(state.lives);
        hud.setPressure(state.pressure);

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

function tryMove(state, dx, dy) {
    const a = state.active;
    const nx = a.x + dx;
    const ny = a.y + dy;

    const ok = canPlace({
        locked: state.lockedBoard,
        cols: state.cols,
        rows: state.rows,
        pieceId: a.id,
        rot: a.rot,
        px: nx,
        py: ny,
    });

    if (!ok) return false;

    a.x = nx;
    a.y = ny;
    return true;
}