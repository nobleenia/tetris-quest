/**
 * Stackr Quest — Home Scene
 *
 * The landing screen. Shows title, play button, classic mode button,
 * settings. This is the default scene on app load.
 */

export const homeScene = {
  id: 'home',

  enter(_params, _ctx) {
    // Show home overlay if it exists (legacy compatibility)
    const overlay = document.querySelector('#homeOverlay');
    if (overlay) overlay.classList.remove('hidden');
  },

  exit(_ctx) {
    const overlay = document.querySelector('#homeOverlay');
    if (overlay) overlay.classList.add('hidden');
  },
};
