import { countHoles } from "./board.js";
import { lockActivePiece } from "./lock.js";
import { clearFullLines } from "./lines.js";
import { addLineClearScore } from "./score.js";
import { reducePressureOnClear } from "./pressure.js";
import { spawnFromQueue } from "./spawn.js";
import { handleTopOut } from "./lives.js";

// tryMove est dans main.js, donc on le reçoit en paramètre
export function hardDrop(state, tryMove, hud) {
    if (!state.active) return;

    // 1. Descendre jusqu'à collision
    while (tryMove(state, 0, 1)) {
        // avance tant que possible
    }

    // 2. Compter les trous avant lock (pour la règle "misplaced")
    const holesBefore = countHoles(state.lockedBoard, state.cols, state.rows);

    // 3. Verrouiller la pièce
    lockActivePiece(state);

    // 4. Clear des lignes
    const cleared = clearFullLines(state);
    addLineClearScore(state, cleared);
    reducePressureOnClear(state, cleared);

    // 5. Reset du hold
    state.holdUsed = false;

    // 6. Spawn de la prochaine pièce
    const ok = spawnFromQueue(state);

    // 7. Règle "misplaced"
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

    // 8. Top-out
    if (!ok) {
        handleTopOut(state);
    }
}
