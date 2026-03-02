/**
 * Stackr Quest — Viewport Manager
 *
 * Handles:
 * - Viewport resize (updates CSS custom properties)
 * - Orientation detection (portrait/landscape)
 * - Landscape warning on mobile (game is portrait-first)
 * - iOS address bar resize compensation (100dvh)
 * - Screen wake lock (keeps screen on during gameplay)
 *
 * Usage:
 *   const viewport = createViewport();
 *   viewport.start();
 *   viewport.destroy();
 */

export function createViewport() {
  let wakeLock = null;
  let orientationWarning = null;

  /** Update CSS custom properties based on actual viewport */
  function updateViewportVars() {
    // Real viewport height (handles iOS address bar)
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);
  }

  /** Check orientation and show/hide warning on mobile */
  function checkOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth < 768;

    if (!orientationWarning) {
      orientationWarning = document.querySelector('#orientationWarning');
    }

    if (orientationWarning) {
      if (isLandscape && isMobile) {
        orientationWarning.classList.remove('hidden');
      } else {
        orientationWarning.classList.add('hidden');
      }
    }
  }

  /** Request screen wake lock (prevents screen dimming during gameplay) */
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch (_err) {
      // Wake lock request failed (e.g., page not visible)
    }
  }

  /** Release wake lock */
  async function releaseWakeLock() {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  }

  /** Re-acquire wake lock when page becomes visible again */
  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  }

  function onResize() {
    updateViewportVars();
    checkOrientation();
  }

  function start() {
    updateViewportVars();
    checkOrientation();
    requestWakeLock();

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function destroy() {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    releaseWakeLock();
  }

  return { start, destroy, requestWakeLock, releaseWakeLock };
}
