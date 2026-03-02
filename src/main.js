/**
 * Stackr Quest — Main Entry Point
 *
 * Bootstraps the game engine, wires UI, and starts the main loop.
 * Phase 2: Session manager orchestrates level / classic play.
 */

// --- CSS imports (Vite handles these) ---
import './styles/base.css';
import './styles/hud.css';
import './styles/board.css';
import './styles/overlay.css';
import './styles/scenes.css';

// --- Engine ---
import { createInitialState, initializeVisibleViews } from './engine/state.js';
import { createLoop } from './engine/loop.js';
import { createInput } from './engine/input.js';
import { createControls } from './engine/controls.js';
import { createTouchInput } from './engine/touch.js';
import { createViewport } from './engine/viewport.js';

// --- Scenes ---
import { createSceneManager } from './scenes/manager.js';
import { createRouter } from './scenes/router.js';
import { homeScene } from './scenes/home.js';
import { mapScene } from './scenes/map.js';
import { briefingScene } from './scenes/briefing.js';
import { gameScene } from './scenes/game.js';
import { resultsScene } from './scenes/results.js';
import { shopScene } from './scenes/shop.js';

// --- UI ---
import { bindPauseUI } from './ui/pause.js';
import { createHUD } from './ui/hud.js';
import { createBoardDOM, createPreviewDOM } from './ui/dom.js';
import { renderBoardDiff, renderPreview } from './ui/render.js';
import { tickSlowMotion } from './game/powerups.js';

// --- Game Logic ---
import { initQueue, spawnFromQueue } from './game/spawn.js';
import { canPlace, buildNextBoard, countHoles } from './game/board.js';
import { lockActivePiece } from './game/lock.js';
import { tryRotateCW, tryRotateCCW } from './game/rotate.js';
import { hardDrop } from './game/harddrop.js';
import { clearFullLines } from './game/lines.js';
import { addLineClearScore } from './game/score.js';
import { tryHold } from './game/hold.js';
import {
  tickPressure,
  gravityIntervalFromPressure,
  reducePressureOnClear,
} from './game/pressure.js';
import { handleTopOut } from './game/lives.js';
import { recordClassicResult } from './systems/progress.js';

// --- Session (Phase 2) ---
import { createSession } from './game/session.js';
import { installDevHarness } from './game/devHarness.js';

// ─── Boot ────────────────────────────────────────────────────────────
const state = createInitialState();
const input = createInput();

// Touch input — attach to the game root for full-board gesture capture
const gameRoot = document.querySelector('#gameRoot');
const touch = gameRoot ? createTouchInput(gameRoot) : null;

const controls = createControls(input, touch);

// Viewport manager (orientation, wake lock, CSS vars)
const viewport = createViewport();
viewport.start();

// Session manager — orchestrates level / classic play
const session = createSession(state);

// HUD (timer/score/lives + perf)
const hud = createHUD();

// Scene manager + router — Phase 3: fully scene-driven
const sceneCtx = { state, input, controls, touch, viewport, session, hud, router: null };
const sceneManager = createSceneManager({
  scenes: [homeScene, mapScene, briefingScene, gameScene, resultsScene, shopScene],
  container: document.body,
  ctx: sceneCtx,
});
const router = createRouter(sceneManager);
sceneCtx.router = router;

// Session callbacks — navigate to results scene on complete/fail
session.on({
  onComplete: (result) => {
    // eslint-disable-next-line no-console
    console.log('[session] Level complete!', result);
    state.paused = true;
    sceneCtx._lastResult = result;
    router.navigate('#/results');
  },
  onFail: (result) => {
    // eslint-disable-next-line no-console
    console.log('[session] Level failed.', result);
    state.paused = true;
    // For classic mode, record the result
    if (result.mode === 'classic') {
      recordClassicResult(result.score, result.linesCleared, result.elapsedSec);
    }
    sceneCtx._lastResult = result;
    router.navigate('#/results');
  },
});

// Legacy home overlay — hide immediately (Phase 3: home scene replaces it)
const homeOverlay = document.querySelector('#homeOverlay');
if (homeOverlay) homeOverlay.classList.add('hidden');

// Start the router — this resolves the initial URL and shows the right scene
router.start();

// Board DOM
const boardEl = document.querySelector('#boardGrid');
const boardDOM = createBoardDOM({ boardEl, cols: state.cols, rows: state.visibleRows });

// Initialize visible views for rendering
initializeVisibleViews(state);

// Previews DOM
const previewEl = document.querySelector('#nextPreview');
const previewDOM = createPreviewDOM({ previewEl, size: 4 });

const holdEl = document.querySelector('#holdPreview');
const holdDOM = createPreviewDOM({ previewEl: holdEl, size: 4 });

// Wire sidebar stats
const sidebarLivesEl = document.querySelector('#sidebarLives');
const sidebarPressureSideEl = document.querySelector('#sidebarPressureSide');
const sidebarTimeEl = document.querySelector('#sidebarTime');
const sidebarScoreEl = document.querySelector('#sidebarScore');
const sidebarPressureStat = document.querySelector('.sidebar__stat--pressure');
const sidebarLivesStat = document.querySelector('.sidebar__stat--lives');

let prevLives = state.lives;
let prevPressureHigh = false;

// ─── Helper: get bag from active session ─────────────────────────────
function getBag() {
  return session.isActive() ? session.getBag() : null;
}

// ─── Pause Overlay ───────────────────────────────────────────────────
bindPauseUI({
  onContinue: () => {
    state.paused = false;
  },
  onRestart: () => {
    hud.hideGameOver();
    state._gameOverShown = false;

    // Navigate back to map (adventure) or restart classic
    if (session.isActive() && session.getMode && session.getMode() === 'level') {
      router.navigate('#/map');
    } else {
      // Classic mode — restart via session
      session.startClassic();
      const bag = getBag();
      initQueue(state, bag);
      const ok = spawnFromQueue(state, bag);
      if (ok) session.onPieceSpawned();
      if (!ok) handleTopOut(state);
      state.paused = false;
    }
  },
});

// ─── Simulation ──────────────────────────────────────────────────────
const SIM_STEP = 1 / 60;
let simAcc = 0;
let simStepsThisSec = 0;
let lastSimReport = performance.now();

// ─── Helper ──────────────────────────────────────────────────────────
function tryMove(st, dx, dy) {
  const a = st.active;
  const nx = a.x + dx;
  const ny = a.y + dy;
  const ok = canPlace(st.lockedBoard, st.cols, st.rows, a.id, a.rot, nx, ny);
  if (!ok) return false;
  a.x = nx;
  a.y = ny;
  return true;
}

// ─── Main Loop ───────────────────────────────────────────────────────
const loop = createLoop({
  onUpdate: (dt) => {
    if (state.paused || state.gameOver) return;

    simAcc += dt;
    while (simAcc >= SIM_STEP) {
      state.elapsedSec += SIM_STEP;
      simStepsThisSec++;
      tickPressure(state, SIM_STEP);
      tickSlowMotion(state, SIM_STEP);

      // Session tick (objectives, boss, speed events, modifiers)
      if (session.isActive()) {
        const sessionResult = session.tick(SIM_STEP);
        if (sessionResult && sessionResult.outcome) {
          // Session ended — pause and let callback handle transition
          simAcc = 0;
          return;
        }
      }

      if (state.gameOver) {
        buildNextBoard(state.lockedBoard, state.nextBoard, state.cols, state.rows, null);
        simAcc = 0;
        return;
      }

      // Controls
      controls.update(SIM_STEP);

      if (controls.pauseToggle()) {
        state.paused = !state.paused;
      }

      if (state.active) {
        if (controls.moveLeft(SIM_STEP)) tryMove(state, -1, 0);
        if (controls.moveRight(SIM_STEP)) tryMove(state, 1, 0);
      }

      if (controls.rotateCW()) tryRotateCW(state);
      if (controls.rotateCCW()) tryRotateCCW(state);

      if (controls.hardDrop()) {
        const hdCleared = hardDrop(state, tryMove, hud);
        session.onPieceLocked(hdCleared);
        if (hdCleared > 0) session.onLinesCleared(hdCleared);
        if (state.active) session.onPieceSpawned();
      }

      const softDrop = controls.softDrop();
      const base = gravityIntervalFromPressure(state);
      const interval = softDrop ? base * 0.08 : base;

      if (controls.hold()) {
        const didHold = tryHold(state);
        if (didHold) {
          state.dropAcc = 0;
          buildNextBoard(state.lockedBoard, state.nextBoard, state.cols, state.rows, state.active);
        }
        if (didHold && !state.active) {
          const bag = getBag();
          const ok = spawnFromQueue(state, bag);
          if (ok) session.onPieceSpawned();
          if (!ok) handleTopOut(state);
        }
      }

      state.dropAcc += SIM_STEP;

      while (state.dropAcc >= interval) {
        state.dropAcc -= interval;
        if (!state.active) break;

        const moved = tryMove(state, 0, 1);
        if (!moved) {
          const holesBefore = countHoles(state.lockedBoard, state.cols, state.rows);
          lockActivePiece(state);
          const cleared = clearFullLines(state);
          addLineClearScore(state, cleared);
          reducePressureOnClear(state, cleared);
          state.holdUsed = false;

          // Session: notify lines cleared + combo tracking
          if (session.isActive()) {
            session.onLinesCleared(cleared);
            session.onPieceLocked(cleared);
          }

          const bag = getBag();
          const ok = spawnFromQueue(state, bag);
          if (ok) session.onPieceSpawned();

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

          if (!ok) {
            handleTopOut(state);
            state.dropAcc = 0;
            break;
          }
        }
      }

      buildNextBoard(state.lockedBoard, state.nextBoard, state.cols, state.rows, state.active);
      simAcc -= SIM_STEP;
      input.endFrame();
      if (touch) touch.endFrame();
    }
  },

  onRender: () => {
    renderBoardDiff(boardDOM.cells, state.prevVisible, state.nextVisible);
    renderPreview(previewDOM, state.nextId, 0);
    renderPreview(holdDOM, state.holdId, 0);

    // SimHz reporting
    const _now = performance.now();
    if (_now - lastSimReport >= 1000) {
      const simHz = simStepsThisSec;
      if (hud && typeof hud.setSimHz === 'function') {
        hud.setSimHz(simHz);
      }
      simStepsThisSec = 0;
      lastSimReport += 1000;
    }

    // HUD updates
    hud.setTime(state.elapsedSec);
    hud.setScore(state.score);
    hud.setLives(state.lives);
    hud.setPressure(state.pressure);

    if (sidebarScoreEl) sidebarScoreEl.textContent = String(state.score);
    if (sidebarLivesEl) sidebarLivesEl.textContent = String(state.lives);
    if (sidebarPressureSideEl) sidebarPressureSideEl.textContent = `${Math.round(state.pressure)}%`;
    if (sidebarTimeEl) sidebarTimeEl.textContent = state.elapsedSec.toFixed(1);

    // Heart pop animation on life change
    if (state.lives !== prevLives && sidebarLivesStat) {
      sidebarLivesStat.classList.remove('heart-pop');
      void sidebarLivesStat.offsetWidth;
      sidebarLivesStat.classList.add('heart-pop');
      prevLives = state.lives;
    }

    // Pressure pulse when >= 50%
    const pressureHigh = state.pressure >= 50;
    if (pressureHigh !== prevPressureHigh && sidebarPressureStat) {
      sidebarPressureStat.classList.toggle('pressure-pulse', pressureHigh);
      prevPressureHigh = pressureHigh;
    }

    // Pause overlay visibility
    hud.setPaused(state.paused && !state.gameOver);

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

loop.start();

// ─── Dev Harness (development only) ─────────────────────────────────
if (import.meta.env.DEV) {
  installDevHarness({ state, session, hud });
}
