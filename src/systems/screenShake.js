/**
 * Stackr Quest — Screen Shake
 *
 * Applies CSS transform-based shake to the board container.
 * No layout thrash — uses transform only.
 * Configurable intensity. Respects reduced-motion preference.
 *
 * Usage:
 *   import { screenShake } from './systems/screenShake.js';
 *   screenShake.shake('medium');
 */

/** @type {HTMLElement|null} */
let _target = null;
let _enabled = true;
let _intensity = 1.0; // 0..2 multiplier
let _shakeTimer = 0;
let _shakeStrength = 0;
let _rafId = null;

const PRESETS = {
  light: { strength: 2, duration: 100 },
  medium: { strength: 4, duration: 180 },
  heavy: { strength: 8, duration: 300 },
  hardDrop: { strength: 3, duration: 120 },
  tetris: { strength: 5, duration: 250 },
  bossAttack: { strength: 10, duration: 400 },
};

function tick() {
  if (_shakeTimer <= 0 || !_target) {
    if (_target) _target.style.transform = '';
    _rafId = null;
    return;
  }

  const progress = _shakeTimer / 300; // normalize to ~[0,1]
  const decay = Math.min(1, progress);
  const str = _shakeStrength * decay * _intensity;

  const x = (Math.random() * 2 - 1) * str;
  const y = (Math.random() * 2 - 1) * str;
  _target.style.transform = `translate(${x}px, ${y}px)`;

  _shakeTimer -= 16; // ~60fps step
  _rafId = requestAnimationFrame(tick);
}

export const screenShake = {
  /**
   * Set the DOM element to shake (the board container).
   * @param {HTMLElement} el
   */
  setTarget(el) {
    _target = el;
  },

  /** Enable or disable shake. */
  setEnabled(on) {
    _enabled = !!on;
    if (!on && _target) {
      _target.style.transform = '';
      _shakeTimer = 0;
    }
  },

  /** @returns {boolean} */
  isEnabled() {
    return _enabled;
  },

  /**
   * Set shake intensity multiplier.
   * @param {number} mult — 0..2
   */
  setIntensity(mult) {
    _intensity = Math.max(0, Math.min(2, mult));
  },

  /**
   * Trigger a shake.
   * @param {string|object} preset — 'light'|'medium'|'heavy'|'hardDrop'|'tetris'|'bossAttack'
   *                                  or { strength: number, duration: number }
   */
  shake(preset = 'medium') {
    if (!_enabled || !_target) return;

    const cfg = typeof preset === 'string' ? PRESETS[preset] || PRESETS.medium : preset;
    // Stack shakes: pick the stronger of the current vs new
    _shakeStrength = Math.max(_shakeStrength, cfg.strength);
    _shakeTimer = Math.max(_shakeTimer, cfg.duration);

    if (!_rafId) {
      _rafId = requestAnimationFrame(tick);
    }
  },

  /** Immediately stop any active shake. */
  stop() {
    _shakeTimer = 0;
    _shakeStrength = 0;
    if (_target) _target.style.transform = '';
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },
};
