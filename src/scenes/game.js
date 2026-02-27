/**
 * Stackr Quest — Game Scene
 *
 * The active gameplay scene. Manages the board, game loop, HUD,
 * and all in-game UI. Receives level params from the router/scene
 * manager and configures the engine accordingly.
 *
 * For now, this wraps the existing classic-mode gameplay.
 * Phase 2 will add level config loading and objective tracking.
 */

export const gameScene = {
  id: 'game',

  enter(_params, _ctx) {
    // params: { world, level } for adventure, or { mode: 'classic' }
    // TODO Phase 2: load level config from params

    // Show the game board
    const boardSection = document.querySelector('#board');
    if (boardSection) boardSection.style.display = '';

    const sidebar = document.querySelector('#sidebar');
    if (sidebar) sidebar.style.display = '';
  },

  exit(_ctx) {
    // Pause the game when leaving
    if (_ctx && _ctx.state) {
      _ctx.state.paused = true;
    }
  },

  onRoute(_params, _ctx) {
    // TODO Phase 2: reload level config when route changes within game
  },
};
