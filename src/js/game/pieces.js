// Build precomputed offsets as Int8Array arrays of length (blocks * 2)
export const PIECE_IDS = ["I", "O", "T", "S", "Z", "J", "L"];
// Map piece ID -> numeric cell value for colouring (1..7)
export const PIECE_VALUE = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7,
};

// Rotations are 0,1,2,3 (clockwise)
export const PIECES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]],
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]],
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]],
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[0,1],[1,1],[0,2]],
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[0,2],[1,2]],
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]],
  ],
};

// Build precomputed offsets as Int8Array arrays of length (blocks * 2)
export const PIECE_OFFSETS = {};
for (const id of PIECE_IDS) {
  PIECE_OFFSETS[id] = PIECES[id].map(rotBlocks => {
    const arr = new Int8Array(rotBlocks.length * 2);
    for (let i = 0; i < rotBlocks.length; i++) {
      arr[i * 2 + 0] = rotBlocks[i][0]; // dx
      arr[i * 2 + 1] = rotBlocks[i][1]; // dy
    }
    return arr;
  });
}

export function getBlocks(pieceId, rot) {
  return PIECES[pieceId][rot];
}
