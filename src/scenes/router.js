/**
 * Stackr Quest — Hash Router
 *
 * Maps URL hash fragments to scene manager transitions.
 * Supports browser back/forward buttons and programmatic navigation.
 *
 * Routes:
 *   #/           → home scene
 *   #/map        → world map scene
 *   #/map/:world → world map focused on a specific world
 *   #/play/:id   → game scene (e.g., #/play/1-5 or #/play/classic)
 *   #/results    → results scene
 *   #/shop       → shop scene (Phase 3)
 *
 * Usage:
 *   const router = createRouter(sceneManager);
 *   router.start();                    // begin listening
 *   router.navigate('#/play/1-3');     // programmatic nav
 *   router.destroy();                  // cleanup
 */

/**
 * @param {object} sceneManager - from createSceneManager()
 * @returns {{ start: Function, navigate: Function, destroy: Function }}
 */
export function createRouter(sceneManager) {
  /** Route definitions: regex → { scene, paramParser } */
  const routes = [
    {
      pattern: /^#\/play\/(.+)$/,
      scene: 'game',
      parseParams(match) {
        const id = match[1];
        if (id === 'classic') return { mode: 'classic' };
        if (id === 'daily') return { mode: 'daily' };
        const [world, level] = id.split('-').map(Number);
        return { world, level, id };
      },
    },
    {
      pattern: /^#\/briefing\/(\d+)-(\d+)$/,
      scene: 'briefing',
      parseParams(match) {
        return { world: Number(match[1]), level: Number(match[2]) };
      },
    },
    {
      pattern: /^#\/results(?:\/(.+))?$/,
      scene: 'results',
      parseParams(match) {
        return match[1] ? { resultId: match[1] } : {};
      },
    },
    {
      pattern: /^#\/map(?:\/(\d+))?$/,
      scene: 'map',
      parseParams(match) {
        return match[1] ? { world: Number(match[1]) } : {};
      },
    },
    {
      pattern: /^#\/shop$/,
      scene: 'shop',
      parseParams() {
        return {};
      },
    },
    {
      pattern: /^#\/leaderboard$/,
      scene: 'leaderboard',
      parseParams() {
        return {};
      },
    },
    {
      pattern: /^#\/account$/,
      scene: 'account',
      parseParams() {
        return {};
      },
    },
    {
      pattern: /^#\/play-menu$/,
      scene: 'play-menu',
      parseParams() {
        return {};
      },
    },
    {
      // Catch-all → home
      pattern: /^#?\/?$/,
      scene: 'home',
      parseParams() {
        return {};
      },
    },
  ];

  let currentHash = null; // null so the first onHashChange() always resolves

  function resolve(hash) {
    const normalized = hash || '#/';
    for (const route of routes) {
      const match = normalized.match(route.pattern);
      if (match) {
        return { scene: route.scene, params: route.parseParams(match) };
      }
    }
    // Fallback — go home
    return { scene: 'home', params: {} };
  }

  function onHashChange() {
    const hash = window.location.hash;
    if (hash === currentHash) return;
    currentHash = hash;

    const { scene, params } = resolve(hash);
    const cur = sceneManager.current();

    if (cur === scene) {
      // Same scene, just update params
      sceneManager.routeUpdate(params);
    } else {
      sceneManager.go(scene, params);
    }
  }

  /**
   * Navigate programmatically. Updates hash → triggers scene change.
   * @param {string} hash - e.g., '#/play/1-3'
   */
  function navigate(hash) {
    window.location.hash = hash;
    // hashchange fires automatically, but we call it synchronously
    // in case we need immediate transition (e.g., inside a click handler)
    onHashChange();
  }

  /** Start listening for hash changes and resolve initial route */
  function start() {
    window.addEventListener('hashchange', onHashChange);
    onHashChange(); // resolve initial URL
  }

  /** Stop listening */
  function destroy() {
    window.removeEventListener('hashchange', onHashChange);
  }

  return { start, navigate, destroy };
}
