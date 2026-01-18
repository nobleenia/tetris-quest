export function createInitialState() {
    const cols = 10;
    const rows = 20;
    const cellCount = cols * rows;

    return {
        paused: false,
        timeSec: 0,
        score: 0,
        lives: 3,

        cols,
        rows,

        lockedBoard: new Array(cellCount).fill(0),

        // Rendering buffers
        prevBoard: new Array(cellCount).fill(0),
        nextBoard: new Array(cellCount).fill(0),

        // Active falling piece
        active: null,

        nextId: null,
        holdId: null,
        holdUsed: false,

        pressure: 0,          // 0..100
        pressureRate: 1.0,    // per second (tune)
        gameOver: false,

        elapsedSec: 0,  // total time played

        dropAcc: 0,         // seconds accumulated since last auto-drop
        dropInterval: 0.7,  // seconds per row drop

        baseInterval: 0.85,   // seconds at pressure 0
        minInterval: 0.10,    // seconds at pressure 100 (cap)
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

    state.active = null;
    state.nextId = null;
    state.holdId = null;
    state.holdUsed = false;

    state.pressure = 0;
    state.gameOver = false;
    state.elapsedSec = 0;

    state.dropAcc = 0;
}