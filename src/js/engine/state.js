export function createInitialState() {
    const cellCount = 10 * 20;

    return {
        paused: false,
        timeSec: 0,
        score: 0,
        lives: 3,
        prevBoard: new Array(cellCount).fill(0),
        nextBoard: new Array(cellCount).fill(0),
    };
}

export function resetGame(state) {
    state.timeSec = 0;
    state.score = 0;
    state.lives = 3;
    //    state.paused = false;
    state.prevBoard.fill(0);
    state.nextBoard.fill(0);
}