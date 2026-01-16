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
        activePiece: null,

        nextId: null,
        holdId: null,
        holdUsed: false,

        dropAcc: 0,         // seconds accumulated since last auto-drop
        dropInterval: 0.7,  // seconds per row drop
    };
}

export function resetGame(state) {
    state.timeSec = 0;
    state.score = 0;
    state.lives = 3;
    //    state.paused = false;

    state.lockedBoard.fill(0);
    state.prevBoard.fill(0);
    state.nextBoard.fill(0);

    state.activePiece = null;
    state.nextId = null;
    state.holdId = null;
    state.holdUsed = false;

    state.dropAcc = 0;
}