/**
 * Stackr Quest — Animations
 *
 * CSS-class-based animations for game events.
 * - Piece spawn (scale-in)
 * - Line clear (rows flash then collapse)
 * - Ghost piece (subtle pulse)
 * - Level complete (board dissolves)
 * - World unlock (gate opens)
 *
 * Uses CSS classes + requestAnimationFrame for timing.
 * No direct style manipulation for performance.
 */

let _enabled = true;

export const animations = {
  init() {
    // Add the animation stylesheet class to body
    document.body.classList.add('animations-enabled');
  },

  setEnabled(on) {
    _enabled = !!on;
    document.body.classList.toggle('animations-enabled', on);
    document.body.classList.toggle('animations-disabled', !on);
  },

  isEnabled() {
    return _enabled;
  },

  /**
   * Piece spawn — subtle scale-in on the active piece cells.
   * We toggle a class on the board briefly.
   */
  pieceSpawnScale() {
    if (!_enabled) return;
    const board = document.getElementById('boardGrid');
    if (!board) return;
    board.classList.add('piece-spawning');
    setTimeout(() => board.classList.remove('piece-spawning'), 150);
  },

  /**
   * Line clear flash — flash the cleared rows, then collapse.
   * @param {number} y — pixel Y of the first cleared row
   * @param {number} lines — number of lines cleared
   */
  lineClearFlash(y, lines) {
    if (!_enabled) return;
    const board = document.getElementById('boardGrid');
    if (!board) return;

    // Add a flash class
    board.classList.add('line-clearing');
    if (lines >= 4) board.classList.add('tetris-clear');

    setTimeout(() => {
      board.classList.remove('line-clearing', 'tetris-clear');
    }, 300);
  },

  /**
   * Level complete — board dissolves effect via CSS class.
   */
  levelCompleteDissolve() {
    if (!_enabled) return;
    const board = document.getElementById('board');
    if (!board) return;
    board.classList.add('dissolving');
    setTimeout(() => board.classList.remove('dissolving'), 1200);
  },

  /**
   * World unlock gate animation.
   * @param {HTMLElement} gateEl — the world node element
   */
  worldUnlock(gateEl) {
    if (!_enabled || !gateEl) return;
    gateEl.classList.add('world-unlocking');
    setTimeout(() => gateEl.classList.remove('world-unlocking'), 800);
  },

  /**
   * Ghost piece pulse — applied via CSS, this just ensures the class exists.
   */
  enableGhostPulse() {
    if (!_enabled) return;
    document.body.classList.add('ghost-pulse');
  },

  disableGhostPulse() {
    document.body.classList.remove('ghost-pulse');
  },
};
