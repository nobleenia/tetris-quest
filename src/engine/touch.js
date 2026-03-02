/**
 * Stackr Quest — Touch Input System
 *
 * Translates touch gestures (swipes, taps) into the same semantic
 * actions that keyboard produces. Works alongside createInput() —
 * both feed into the same control flow.
 *
 * Design decisions:
 * - Swipe thresholds are in px, not relative, because piece movement
 *   maps to discrete grid cells (1 swipe = 1 move).
 * - We track "virtual keys" in a Set, consumed by controls.js the
 *   same way keyboard keys are.
 * - Continuous swipe: finger held → repeated moves (like DAS/ARR).
 * - Single quick swipe up = hard drop, down = soft drop toggle.
 */

/**
 * @param {HTMLElement} targetEl - The element to attach touch listeners to (usually #boardGrid or #gameRoot)
 * @returns {{ actions: Set<string>, update: () => void, destroy: () => void }}
 */
export function createTouchInput(targetEl) {
  // ─── Config ──────────────────────────────────────────────────────
  const SWIPE_THRESHOLD = 20; // px — minimum distance for a swipe
  const TAP_MAX_DURATION = 200; // ms — max touch duration to count as tap
  const TAP_MAX_DISTANCE = 12; // px — max finger movement to count as tap
  const _REPEAT_DELAY = 150; // ms — DAS equivalent for held swipes
  const _REPEAT_RATE = 50; // ms — ARR equivalent for held swipes

  // ─── State ───────────────────────────────────────────────────────
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let lastEmitX = 0; // tracks how far we've "consumed" in the swipe
  let lastEmitY = 0;
  let isSwiping = false;
  let repeatTimer = null;
  let _softDropping = false;

  // Virtual action queue — consumed per frame like keyboard pressedOnce
  const actions = new Set();
  // Held actions (continuous, like soft drop)
  const held = new Set();

  // ─── Handlers ────────────────────────────────────────────────────

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    lastEmitX = startX;
    lastEmitY = startY;
    startTime = performance.now();
    isSwiping = false;
    _softDropping = false;
    clearRepeat();
    e.preventDefault();
  }

  function onTouchMove(e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - lastEmitX;
    const dy = t.clientY - lastEmitY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine swipe direction if threshold met
    if (absDx >= SWIPE_THRESHOLD || absDy >= SWIPE_THRESHOLD) {
      isSwiping = true;

      if (absDx > absDy) {
        // Horizontal swipe — emit one move per threshold distance
        if (dx > 0) {
          actions.add('moveRight');
          lastEmitX += SWIPE_THRESHOLD;
        } else {
          actions.add('moveLeft');
          lastEmitX -= SWIPE_THRESHOLD;
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          // Swipe down — enable soft drop
          _softDropping = true;
          held.add('softDrop');
          lastEmitY += SWIPE_THRESHOLD;
        }
        // Swipe up is handled on touchEnd (hard drop)
      }
    }

    e.preventDefault();
  }

  function onTouchEnd(e) {
    const elapsed = performance.now() - startTime;
    clearRepeat();

    // Stop soft drop
    _softDropping = false;
    held.delete('softDrop');

    if (e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!isSwiping && dist < TAP_MAX_DISTANCE && elapsed < TAP_MAX_DURATION) {
      // It's a tap — rotate
      const tapX = t.clientX;
      const rect = targetEl.getBoundingClientRect();
      const relX = (tapX - rect.left) / rect.width;

      if (relX < 0.35) {
        // Left third — rotate CCW
        actions.add('rotateCCW');
      } else if (relX > 0.65) {
        // Right third — rotate CW
        actions.add('rotateCW');
      } else {
        // Center — hard drop
        actions.add('hardDrop');
      }
    } else if (isSwiping && dy < -SWIPE_THRESHOLD * 2 && Math.abs(dy) > Math.abs(dx)) {
      // Quick swipe up — hard drop
      actions.add('hardDrop');
    }

    isSwiping = false;
    e.preventDefault();
  }

  function onTouchCancel() {
    clearRepeat();
    _softDropping = false;
    held.delete('softDrop');
    isSwiping = false;
  }

  function clearRepeat() {
    if (repeatTimer) {
      clearInterval(repeatTimer);
      repeatTimer = null;
    }
  }

  // ─── Attach ──────────────────────────────────────────────────────

  targetEl.addEventListener('touchstart', onTouchStart, { passive: false });
  targetEl.addEventListener('touchmove', onTouchMove, { passive: false });
  targetEl.addEventListener('touchend', onTouchEnd, { passive: false });
  targetEl.addEventListener('touchcancel', onTouchCancel);

  return {
    /** One-shot actions (consumed each frame) */
    actions,

    /** Continuous held actions */
    held,

    /** Call once per sim tick to clear consumed one-shot actions */
    endFrame() {
      actions.clear();
    },

    /** Remove all listeners (cleanup) */
    destroy() {
      clearRepeat();
      targetEl.removeEventListener('touchstart', onTouchStart);
      targetEl.removeEventListener('touchmove', onTouchMove);
      targetEl.removeEventListener('touchend', onTouchEnd);
      targetEl.removeEventListener('touchcancel', onTouchCancel);
    },
  };
}
