// src/js/game/score.js

// Simple scoring (no levels yet):
// 1 line: 100
// 2 lines: 300
// 3 lines: 500
// 4 lines: 800
export function addLineClearScore(state, linesCleared) {
  if (linesCleared <= 0) return;

  const table = [0, 100, 300, 500, 800];
  state.score += table[linesCleared] ?? (linesCleared * 200);
}
