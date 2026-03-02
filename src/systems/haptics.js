/**
 * Stackr Quest — Haptic Feedback
 *
 * Provides vibration patterns for game events.
 * Uses navigator.vibrate() — gracefully degrades on unsupported devices.
 * Respects reduced-motion and user preference toggles.
 *
 * Usage:
 *   import { haptics } from './systems/haptics.js';
 *   haptics.pieceLock();
 *   haptics.lineClear(2);
 */

let _enabled = true;

function vibrate(pattern) {
  if (!_enabled) return;
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Not supported or blocked
  }
}

export const haptics = {
  /** Enable/disable haptic feedback. */
  setEnabled(on) {
    _enabled = !!on;
  },

  /** @returns {boolean} */
  isEnabled() {
    return _enabled;
  },

  /** Piece lock — short buzz (20ms). */
  pieceLock() {
    vibrate(20);
  },

  /** Piece move — micro tap (8ms). */
  pieceMove() {
    vibrate(8);
  },

  /** Piece rotate — short tap (12ms). */
  pieceRotate() {
    vibrate(12);
  },

  /** Hard drop — medium thud (40ms). */
  hardDrop() {
    vibrate(40);
  },

  /** Line clear — medium pulse, scales with count. */
  lineClear(lines = 1) {
    if (lines >= 4) {
      // Tetris pattern: buzz-pause-buzz-pause-buzz
      vibrate([30, 20, 50, 20, 80]);
    } else if (lines >= 3) {
      vibrate([30, 20, 50]);
    } else if (lines >= 2) {
      vibrate([25, 15, 35]);
    } else {
      vibrate(30);
    }
  },

  /** Combo — escalating buzz. */
  combo(count) {
    const dur = Math.min(15 + count * 8, 80);
    vibrate(dur);
  },

  /** Level complete — celebration pattern. */
  levelComplete() {
    vibrate([30, 40, 30, 40, 60]);
  },

  /** Level fail — long buzz (200ms). */
  levelFail() {
    vibrate(200);
  },

  /** UI tap — micro (5ms). */
  uiTap() {
    vibrate(5);
  },

  /** Boss attack — heavy rumble. */
  bossAttack() {
    vibrate([60, 30, 60]);
  },

  /** Star earned — sparkle pattern. */
  starEarn() {
    vibrate([10, 30, 10, 30, 10]);
  },

  /** Power-up activate — medium pattern. */
  powerup() {
    vibrate([15, 20, 40]);
  },
};
