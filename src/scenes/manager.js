/**
 * Stackr Quest — Scene Manager
 *
 * A lightweight state machine for managing app screens (scenes).
 * Each scene is a plain object with lifecycle hooks:
 *
 *   {
 *     id: 'home',
 *     enter(ctx)  — called when scene becomes active (mount DOM, start loops)
 *     exit(ctx)   — called when leaving (cleanup, stop loops)
 *     onRoute(params, ctx) — called when route params change while scene is active
 *   }
 *
 * The manager handles:
 * - Scene transitions with enter/exit lifecycle
 * - Passing shared context (state, DOM refs) to all scenes
 * - Optional transition hooks (for animations later)
 *
 * Usage:
 *   const mgr = createSceneManager({ scenes, container, ctx });
 *   mgr.go('game', { world: 1, level: 3 });
 */

/**
 * @param {object} opts
 * @param {Array<object>} opts.scenes - Array of scene descriptors
 * @param {HTMLElement} opts.container - DOM element that holds scene containers
 * @param {object} opts.ctx - Shared context passed to every scene lifecycle hook
 * @returns {{ go: Function, current: Function, destroy: Function }}
 */
export function createSceneManager({ scenes, container, ctx }) {
  const sceneMap = new Map();
  let currentScene = null;
  let currentParams = null;

  // Index scenes by id
  for (const scene of scenes) {
    if (!scene.id) throw new Error('Scene missing id');
    sceneMap.set(scene.id, scene);
  }

  /**
   * Transition to a new scene.
   * @param {string} sceneId
   * @param {object} [params={}] - Route/level params passed to enter()
   */
  function go(sceneId, params = {}) {
    const next = sceneMap.get(sceneId);
    if (!next) {
      console.warn(`[SceneManager] Unknown scene: "${sceneId}"`);
      return;
    }

    // Exit current scene
    if (currentScene) {
      if (typeof currentScene.exit === 'function') {
        currentScene.exit(ctx);
      }
      // Hide current scene's DOM
      const currentEl = container.querySelector(`[data-scene="${currentScene.id}"]`);
      if (currentEl) currentEl.classList.remove('active');
    }

    // Show next scene's DOM
    const nextEl = container.querySelector(`[data-scene="${sceneId}"]`);
    if (nextEl) nextEl.classList.add('active');

    currentScene = next;
    currentParams = params;

    // Juice feedback for scene change
    if (ctx.juice && typeof ctx.juice.onSceneChange === 'function') {
      ctx.juice.onSceneChange(sceneId);
    }

    // Enter new scene
    if (typeof next.enter === 'function') {
      next.enter(params, ctx);
    }
  }

  /**
   * Notify current scene of a route change without full transition.
   * Used by the hash router when params change within the same scene.
   */
  function routeUpdate(params) {
    currentParams = params;
    if (currentScene && typeof currentScene.onRoute === 'function') {
      currentScene.onRoute(params, ctx);
    }
  }

  /** @returns {string|null} Current scene id */
  function current() {
    return currentScene ? currentScene.id : null;
  }

  /** @returns {object|null} Current route params */
  function params() {
    return currentParams;
  }

  /** Cleanup — exit current scene */
  function destroy() {
    if (currentScene && typeof currentScene.exit === 'function') {
      currentScene.exit(ctx);
    }
    currentScene = null;
    currentParams = null;
  }

  return { go, routeUpdate, current, params, destroy };
}
