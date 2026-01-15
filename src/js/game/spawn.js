import { PIECE_IDS } from "./pieces.js";

// Simple random for now (Phase 3.5 we’ll replace with 7-bag RNG)
export function randomPieceId() {
  return PIECE_IDS[Math.floor(Math.random() * PIECE_IDS.length)];
}

export function spawnPiece(state, pieceId = randomPieceId()) {
  // Spawn near top-middle
  const x = 3; // works for most pieces in our definitions
  const y = 0;

  state.active = { id: pieceId, rot: 0, x, y };
}
