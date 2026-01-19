import { createInitialState, resetGame } from './engine/state.js';
import { createLoop } from './engine/loop.js';
import { createInput } from './engine/input.js';
import { createControls } from './engine/controls.js';
import { bindPauseUI } from './ui/pause.js';
import { createHUD } from './ui/hud.js';
import { createBoardDOM } from './ui/dom.js';
import { renderBoardDiff } from './ui/render.js';
import { createPreviewDOM } from './ui/dom.js';
import { renderPreview } from './ui/render.js';
import { initQueue, spawnFromQueue } from "./game/spawn.js";
import { canPlace, buildNextBoard } from "./game/board.js";
import { countHoles } from "./game/board.js";
import { lockActivePiece } from "./game/lock.js";
import { tryRotateCW, tryRotateCCW } from "./game/rotate.js";
import { hardDrop } from "./game/harddrop.js";
import { clearFullLines } from "./game/lines.js";
import { addLineClearScore } from "./game/score.js";
import { tryHold } from "./game/hold.js";
import { tickPressure, gravityIntervalFromPressure, reducePressureOnClear } from "./game/pressure.js";
import { handleTopOut } from "./game/lives.js";
import { loadDailyBestSec, updateDailyBest } from "./game/dailyBest.js";

// Phase 1 boot
const state = createInitialState();
const input = createInput();
const controls = createControls(input);


// HUD (timer/score/lives + perf)
const hud = createHUD();

hud.setDailyBest(loadDailyBestSec());

const boardEl = document.querySelector("#board");
// createBoardDOM should use visibleRows only
const boardDOM = createBoardDOM({ boardEl, cols: state.cols, rows: state.visibleRows });

// initialize visible views for rendering
import { initializeVisibleViews } from './engine/state.js';
initializeVisibleViews(state);

// Preview DOM
const previewEl = document.querySelector('#nextPreview');
const previewDOM = createPreviewDOM({ previewEl, size: 4 });

// wire sidebar stats to keep in sync with HUD
const sidebarLivesEl = document.querySelector('#sidebarLives');
const sidebarPressureSideEl = document.querySelector('#sidebarPressureSide');
const sidebarTimeEl = document.querySelector('#sidebarTime');
const sidebarScoreEl = document.querySelector('#sidebarScore');
const sidebarPressureStat = document.querySelector('.sidebar__stat--pressure');
const sidebarLivesStat = document.querySelector('.sidebar__stat--lives');

let prevLives = state.lives;
let prevPressureHigh = false;

// Home overlay / start flow
const homeOverlay = document.querySelector('#homeOverlay');
const btnStart = document.querySelector('#btnStart');
const cfgMisplaced = document.querySelector('#cfgMisplacedRule');

// Start paused until user clicks Start
state.paused = true;

btnStart.addEventListener('click', () => {
    // Read config
    state.misplacedPlacementRule = !!cfgMisplaced.checked;

    // initialize queue and spawn first piece
    initQueue(state);
    const ok = spawnFromQueue(state);
    if (!ok) {
        const best = updateDailyBest(state);
        hud.setDailyBest(best);
        handleTopOut(state);
    }

    // Hide home overlay and unpause simulation
    if (homeOverlay) homeOverlay.classList.add('hidden');
    state.paused = false;
});

// Board rendering (diff-based)
// Pause overlay
bindPauseUI({
    onContinue: () => {
        state.paused = false;
    },
    onRestart: () => {
        const best = updateDailyBest(state);
        hud.setDailyBest(best);

        // If a game-over overlay was shown, hide it
        hud.hideGameOver();
        state._gameOverShown = false;

        resetGame(state);
        initQueue(state); // important because reset cleared nextId
        const ok = spawnFromQueue(state);
        if (!ok) handleTopOut(state);
        state.paused = false;
    },
});



// Fixed simulation step for 60Hz gameplay logic
const SIM_STEP = 1 / 60;
let simAcc = 0;
// Instrumentation: count simulation steps per second for verification
let simStepsThisSec = 0;
let lastSimReport = performance.now();

// Main loop
const loop = createLoop({
    onUpdate: (dt) => {
        if (state.paused || state.gameOver) return;

        // Accumulate real time and run fixed-size simulation steps at 60Hz.
        simAcc += dt;
        while (simAcc >= SIM_STEP) {
            // Run one simulation step consuming SIM_STEP seconds.
            state.elapsedSec += SIM_STEP;
            // Count simulation steps for reporting (approx. should be ~60)
            simStepsThisSec++;
            tickPressure(state, SIM_STEP);

            // If game over after stepping, build empty nextBoard and stop stepping.
            if (state.gameOver) {
                buildNextBoard(state.lockedBoard, state.nextBoard, state.cols, state.rows, null);
                simAcc = 0;
                return;
            }

            // New CONTROLS -----------------------------
			controls.update();

			// Pause
			if (controls.pauseToggle()) {
				state.paused = !state.paused;
			}

			// Horizontal Movements
			if (state.active) {
				if (controls.moveLeftOnce()) tryMove(state, -1, 0);
				if (controls.moveRightOnce()) tryMove(state, 1, 0);
			}

			// Rotations
			if (controls.rotateCW()) tryRotateCW(state);
			if (controls.rotateCCW()) tryRotateCCW(state);

			// Hard drop
			if (controls.hardDrop()) {
				hardDrop(state, tryMove, hud);
			}

			// Soft drop
			const softDrop = controls.softDrop();
			const base = gravityIntervalFromPressure(state);
			const interval = softDrop ? base * 0.08 : base;

			// Hold
			if (controls.hold()) {
				const didHold = tryHold(state);
				if (didHold && !state.active) {
					const ok = spawnFromQueue(state);
					if (!ok) {
						handleTopOut(state);
						if (state.gameOver) break;
					}
				}
			}
			//-------------------------------------------

            state.dropAcc += SIM_STEP;

            while (state.dropAcc >= interval) {
                state.dropAcc -= interval;

                if (!state.active) break;

                const moved = tryMove(state, 0, 1);
                if (!moved) {
                    // Misplaced-placement detection: count holes before lock
                    const holesBefore = countHoles(state.lockedBoard, state.cols, state.rows);

                    lockActivePiece(state);
                    const cleared = clearFullLines(state);
                    addLineClearScore(state, cleared);
                    reducePressureOnClear(state, cleared);
                    state.holdUsed = false;

                    // Spawn next piece
                    const ok = spawnFromQueue(state);

                    // Recount holes after lock+clear. If rule enabled and holes increased, apply penalty.
                    if (state.misplacedPlacementRule) {
                        const holesAfter = countHoles(state.lockedBoard, state.cols, state.rows);
                        if (holesAfter > holesBefore) {
                            // default: one life per misplaced placement
                            state.lives = Math.max(0, state.lives - 1);
                            hud.setLives(state.lives);
                            if (state.lives <= 0) {
                                state.gameOver = true;
                            }
                        }
                    }

                    if (!ok) {
                        handleTopOut(state);
                        state.dropAcc = 0;
                        break;
                    }
                }
            }

            buildNextBoard(state.lockedBoard, state.nextBoard, state.cols, state.rows, state.active);

            simAcc -= SIM_STEP;

			input.endFrame(); //
        }
    },
    onRender: () => {
        // Render board using diff
        renderBoardDiff(
            boardDOM.cells,
            state.prevVisible,
            state.nextVisible
        );
        // Render next-piece preview (show upcoming piece id)
        renderPreview(previewDOM, state.nextId, 0);
        // Report simHz once per second (console fallback if HUD lacks setter)
        const _now = performance.now();
        if (_now - lastSimReport >= 1000) {
            const simHz = simStepsThisSec;
            if (hud && typeof hud.setSimHz === 'function') {
                hud.setSimHz(simHz);
            } else {
                console.log('simHz', simHz);
            }
            simStepsThisSec = 0;
            lastSimReport += 1000;
        }
        
        // Phase 1 render does not touch the board yet.
        // We still update HUD even when paused (required).
        hud.setTime(state.elapsedSec);
        hud.setScore(state.score);
        hud.setLives(state.lives);
        hud.setPressure(state.pressure);
        if (sidebarScoreEl) sidebarScoreEl.textContent = String(state.score);
        if (sidebarLivesEl) sidebarLivesEl.textContent = String(state.lives);
        if (sidebarPressureSideEl) sidebarPressureSideEl.textContent = `${Math.round(state.pressure)}%`;
        if (sidebarTimeEl) sidebarTimeEl.textContent = state.elapsedSec.toFixed(1);

        // Heart pop when lives change
        if (state.lives !== prevLives && sidebarLivesStat) {
            sidebarLivesStat.classList.remove('heart-pop');
            // trigger reflow to restart animation
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            void sidebarLivesStat.offsetWidth;
            sidebarLivesStat.classList.add('heart-pop');
            prevLives = state.lives;
        }

        // Pressure pulse when pressure >= 50%
        const pressureHigh = state.pressure >= 50;
        if (pressureHigh !== prevPressureHigh && sidebarPressureStat) {
            sidebarPressureStat.classList.toggle('pressure-pulse', pressureHigh);
            prevPressureHigh = pressureHigh;
        }

        // Show/hide pause overlay (do not show while home overlay is visible)
        const homeHidden = !homeOverlay || homeOverlay.classList.contains('hidden');
        hud.setPaused(state.paused && !state.gameOver && homeHidden);

        // Show game-over overlay once when gameOver becomes true
        if (state.gameOver && !state._gameOverShown) {
            hud.showGameOver(state.score);
            state._gameOverShown = true;
        }
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

    const ok = canPlace(
        state.lockedBoard,
        state.cols,
        state.rows,
        a.id,
        a.rot,
        nx,
        ny
    );

    if (!ok) return false;

    a.x = nx;
    a.y = ny;
    return true;
}