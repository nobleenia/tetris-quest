/**
 * Stackr Quest — Score Popups
 *
 * Floating "+100" text that rises and fades from the cleared area.
 * Larger/flashier for bigger clears. Shows combo multiplier.
 * Uses CSS animations for performance (no JS animation loop).
 *
 * Usage:
 *   import { scorePopups } from './systems/scorePopups.js';
 *   scorePopups.spawn({ points: 800, x: 150, y: 200, label: 'TETRIS!' });
 */

/** @type {HTMLElement|null} */
let _container = null;
let _enabled = true;

const SIZE_CLASSES = {
  small: 'popup--sm',   // 100 pts
  medium: 'popup--md',  // 300 pts
  large: 'popup--lg',   // 500 pts
  epic: 'popup--epic',  // 800+ pts (Tetris)
};

function getContainerEl() {
  if (!_container) {
    _container = document.getElementById('score-popups');
    if (!_container) {
      _container = document.createElement('div');
      _container.id = 'score-popups';
      _container.className = 'score-popups';
      document.body.appendChild(_container);
    }
  }
  return _container;
}

export const scorePopups = {
  /** Enable/disable popups. */
  setEnabled(on) {
    _enabled = !!on;
  },

  /**
   * Spawn a score popup.
   * @param {object} opts
   * @param {number} opts.points — score value
   * @param {number} [opts.x] — horizontal position (px, viewport)
   * @param {number} [opts.y] — vertical position (px, viewport)
   * @param {string} [opts.label] — override text (e.g., 'TETRIS!')
   * @param {number} [opts.combo] — combo count to display
   */
  spawn({ points, x, y, label, combo } = {}) {
    if (!_enabled) return;
    const container = getContainerEl();

    const el = document.createElement('div');
    el.className = 'score-popup';

    // Size class based on points
    if (points >= 800) {
      el.classList.add(SIZE_CLASSES.epic);
    } else if (points >= 500) {
      el.classList.add(SIZE_CLASSES.large);
    } else if (points >= 300) {
      el.classList.add(SIZE_CLASSES.medium);
    } else {
      el.classList.add(SIZE_CLASSES.small);
    }

    // Text
    let text = label || `+${points}`;
    if (combo && combo > 1) {
      text += ` ×${combo}`;
    }
    el.textContent = text;

    // Position — default to center of board area
    const posX = x ?? (window.innerWidth / 2);
    const posY = y ?? (window.innerHeight * 0.4);
    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;

    // Random horizontal drift
    const drift = (Math.random() - 0.5) * 40;
    el.style.setProperty('--drift', `${drift}px`);

    container.appendChild(el);

    // Remove after animation completes
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // Fallback removal
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
  },

  /**
   * Spawn a label popup (non-score text like "TETRIS!" or "COMBO x5").
   */
  spawnLabel({ text, x, y, size: _size = 'large' } = {}) {
    if (!_enabled) return;
    this.spawn({ points: 0, x, y, label: text });
  },

  /** Remove all active popups. */
  clear() {
    const container = getContainerEl();
    container.innerHTML = '';
  },
};
