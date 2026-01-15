export function createInitialState() {
    return {
        paused: false,
        timeSec: 0,
        score: 0,
        lives: 3,
    }
}

export function resetGame(state) {
    state.timeSec = 0;
    state.score = 0;
    state.lives = 3;
//    state.paused = false;
}