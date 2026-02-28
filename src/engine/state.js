export function createInitialState() {
  const cols = 10;
  const visibleRows = 20; // rows visible to the player
  const hiddenRows = 4; // hidden spawn rows above the visible area
  const rows = visibleRows + hiddenRows; // total rows used internally
  const cellCount = cols * rows;

  return {
    paused: false,
    timeSec: 0,
    score: 0,
    lives: 3,

    cols,
    visibleRows,
    hiddenRows,
    rows,

    lockedBoard: new Uint8Array(cellCount).fill(0),

    // Rendering buffers (full size: hidden + visible)
    prevBoard: new Uint8Array(cellCount).fill(0),
    nextBoard: new Uint8Array(cellCount).fill(0),
    // Views into visible area for rendering
    prevVisible: null,
    nextVisible: null,

    // Active falling piece
    active: null,

    nextId: null,
    holdId: null,
    holdUsed: false,

    pressure: 0, // 0..100
    pressureRate: 1.0, // per second (tune)
    gameOver: false,

    elapsedSec: 0, // total time played

    dropAcc: 0, // seconds accumulated since last auto-drop
    dropInterval: 0.7, // seconds per row drop

    baseInterval: 0.85, // seconds at pressure 0
    minInterval: 0.1, // seconds at pressure 100 (cap)

    // ── Level / Adventure mode (Phase 2) ──────────────────────────
    mode: 'classic', // 'classic' | 'adventure'
    levelId: null, // e.g. '1-5'
    worldId: null, // 1–10
    levelNum: null, // 1–20

    // Objective tracking
    objective: null, // { type, target, description }
    objectiveComplete: false,
    objectiveFailed: false,
    starConfig: null, // { one, two, three }

    // Constraints
    timeLimit: 0, // seconds (0 = no limit)
    pieceLimit: 0, // max pieces (0 = no limit)
    levelLives: 0, // lives within a single level attempt

    // Speed events
    speedEvents: [], // [{ atSeconds, newBaseInterval }]
    speedEventIdx: 0,

    // Modifiers
    modifiers: [], // ['iceBlocks', 'bombBlocks', ...]

    // Boss
    boss: null, // boss config object
    bossHP: 0,
    bossPhaseIdx: 0,
    bossAttackTimer: 0,

    // Counters
    pieceCount: 0,
    linesCleared: 0,
    combo: 0,
    maxCombo: 0,
  };
}

export function resetGame(state) {
  state.timeSec = 0;
  state.score = 0;
  state.lives = 3;
  //    state.paused = false;

  state.lockedBoard.fill(0);
  // Force a difference so the diff renderer will clear DOM cells next frame.
  // Set prevBoard to a non-zero value (1..n), while nextBoard is zeroed below.
  state.prevBoard.fill(1);
  state.nextBoard.fill(0);

  // Recreate visible views (they are views into the typed arrays)
  const offset = state.hiddenRows * state.cols;
  state.prevVisible = state.prevBoard.subarray(offset, offset + state.visibleRows * state.cols);
  state.nextVisible = state.nextBoard.subarray(offset, offset + state.visibleRows * state.cols);

  state.active = null;
  state.nextId = null;
  state.holdId = null;
  state.holdUsed = false;

  state.pressure = 0;
  state.gameOver = false;
  state.elapsedSec = 0;

  state.dropAcc = 0;

  // ── Level / Adventure mode resets ──
  state.objectiveComplete = false;
  state.objectiveFailed = false;
  state.speedEventIdx = 0;
  state.bossPhaseIdx = 0;
  state.bossAttackTimer = 0;
  state.pieceCount = 0;
  state.linesCleared = 0;
  state.combo = 0;
  state.maxCombo = 0;
}

// If called after createInitialState, setup visible views
export function initializeVisibleViews(state) {
  const offset = state.hiddenRows * state.cols;
  state.prevVisible = state.prevBoard.subarray(offset, offset + state.visibleRows * state.cols);
  state.nextVisible = state.nextBoard.subarray(offset, offset + state.visibleRows * state.cols);
}
