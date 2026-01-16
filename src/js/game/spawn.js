import { PIECE_IDS } from "./pieces.js";
import { canPlace } from "./board.js";

// Simple random for now (Phase 3.5 we’ll replace with 7-bag RNG)
export function randomPieceId() {
    return PIECE_IDS[Math.floor(Math.random() * PIECE_IDS.length)];
}

// Ensure state.nextId is always set
export function initQueue(state) {
    if (!state.nextId) state.nextId = randomPieceId();
}

// Spawns using state.nextId, then rolls a new nextId
export function spawnFromQueue(state) {
    initQueue(state);

    const pieceId = state.nextId;
    state.nextId = randomPieceId();

    const x = 3;
    const y = 0;

    const candidate = { id: pieceId, rot: 0, x, y };

    // If blocked, still set active (we’ll use this for top-out/lives later)
    if (!canPlace({
        locked: state.lockedBoard,
        cols: state.cols,
        rows: state.rows,
        pieceId: candidate.id,
        rot: candidate.rot,
        px: candidate.x,
        py: candidate.y,
    })) {
        state.active = candidate; // shows the failure visually
        return false;
    }

    state.active = candidate;
    return true;
}
