/**
 * Stackr Quest — Scene Helpers
 *
 * Shared utilities for scene lifecycle management.
 * Game-only DOM elements (#gameRoot, #hud) must be hidden
 * when the player is on menu/overlay scenes.
 */

/** Hide the game board, sidebar, and HUD header. */
export function hideGameUI() {
  const gameRoot = document.querySelector('#gameRoot');
  if (gameRoot) gameRoot.style.display = 'none';
  const hud = document.querySelector('#hud');
  if (hud) hud.style.display = 'none';
}

/** Restore the game board, sidebar, and HUD header. */
export function showGameUI() {
  const gameRoot = document.querySelector('#gameRoot');
  if (gameRoot) gameRoot.style.display = '';
  const hud = document.querySelector('#hud');
  if (hud) hud.style.display = '';
}
