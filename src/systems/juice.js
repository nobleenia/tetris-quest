/**
 * Stackr Quest — Juice Coordinator
 *
 * Central hub wiring game events to all feedback systems:
 * audio, particles, screen shake, haptics, score popups, animations.
 *
 * Instead of scattering feedback calls throughout game logic,
 * the main loop calls juice.onXxx() and this module dispatches
 * to all sub-systems based on current preferences.
 *
 * Usage:
 *   import { juice } from './systems/juice.js';
 *   juice.init({ audio, particles, screenShake, haptics, scorePopups, animations });
 *   juice.onLineClear({ lines: 4, combo: 3, y: 200, score: 800 });
 */

import { audio } from './audio.js';
import { particles } from './particles.js';
import { screenShake } from './screenShake.js';
import { haptics } from './haptics.js';
import { scorePopups } from './scorePopups.js';
import { animations } from './animations.js';

let _reducedMotion = false;

export const juice = {
  /**
   * Initialise all sub-systems.
   * @param {object} opts — { settings }
   */
  init(opts = {}) {
    const settings = opts.settings || {};

    // Detect prefers-reduced-motion
    _reducedMotion =
      settings.reducedMotion === true ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Audio
    audio.init(settings);

    // Particles
    particles.init();
    if (_reducedMotion) particles.setEnabled(false);

    // Screen shake
    if (_reducedMotion) screenShake.setEnabled(false);

    // Haptics
    if (settings.hapticsEnabled === false) haptics.setEnabled(false);

    // Score popups
    if (_reducedMotion) scorePopups.setEnabled(false);

    // Animations
    animations.init();
    if (_reducedMotion) animations.setEnabled(false);

    // Listen for media query changes
    window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .addEventListener?.('change', (e) => {
        if (e.matches) this.setReducedMotion(true);
      });
  },

  /** Apply reduced motion mode. */
  setReducedMotion(on) {
    _reducedMotion = on;
    particles.setEnabled(!on);
    screenShake.setEnabled(!on);
    scorePopups.setEnabled(!on);
    animations.setEnabled(!on);
    // Audio and haptics remain available in reduced motion
  },

  /** @returns {boolean} */
  isReducedMotion() {
    return _reducedMotion;
  },

  // ─── Game Event Handlers ────────────────────────────────────────────

  /** Piece moved left/right. */
  onPieceMove() {
    audio.playSfx('move');
  },

  /** Piece rotated. */
  onPieceRotate() {
    audio.playSfx('rotate');
    haptics.pieceRotate();
  },

  /** Piece locked into place. */
  onPieceLock() {
    audio.playSfx('lock');
    haptics.pieceLock();
  },

  /** Soft drop tick. */
  onSoftDrop() {
    // Don't play every frame — too noisy. Handled by controls debounce.
  },

  /**
   * Hard drop.
   * @param {object} opts — { x, y } board pixel position
   */
  onHardDrop(opts = {}) {
    audio.playSfx('harddrop');
    haptics.hardDrop();
    screenShake.shake('hardDrop');
    particles.hardDropImpact(opts.x || 0, opts.y || 0);
  },

  /**
   * Line(s) cleared.
   * @param {object} opts — { lines, combo, y, score }
   */
  onLineClear(opts = {}) {
    const { lines = 1, combo = 0, y = 0, score = 0 } = opts;

    audio.playLineClear(lines, combo);
    haptics.lineClear(lines);

    // Screen shake scales with lines
    if (lines >= 4) {
      screenShake.shake('tetris');
    } else if (lines >= 2) {
      screenShake.shake('medium');
    } else {
      screenShake.shake('light');
    }

    // Particles
    particles.lineClear(y, lines);
    if (lines >= 4) {
      particles.tetrisCelebration();
    }

    // Combo particles
    if (combo > 1) {
      particles.combo(combo, y);
      haptics.combo(combo);
    }

    // Score popup
    if (score > 0) {
      const boardRect = document.getElementById('boardGrid')?.getBoundingClientRect();
      const popX = boardRect ? boardRect.left + boardRect.width / 2 : undefined;
      const popY = boardRect ? boardRect.top + y : undefined;
      scorePopups.spawn({ points: score, x: popX, y: popY, combo });

      if (lines >= 4) {
        scorePopups.spawn({
          points: 0, x: popX, y: popY ? popY - 30 : undefined, label: 'TETRIS!',
        });
      }
    }

    // Line clear animation
    animations.lineClearFlash(y, lines);
  },

  /** Hold piece swapped. */
  onHold() {
    audio.playSfx('hold');
  },

  /** Piece spawned. */
  onPieceSpawn() {
    animations.pieceSpawnScale();
  },

  /**
   * Level complete.
   * @param {object} opts — { stars, score }
   */
  onLevelComplete(_opts = {}) {
    audio.playSfx('levelWin');
    haptics.levelComplete();
    particles.levelComplete();
    particles.boardDissolve();
    animations.levelCompleteDissolve();
  },

  /**
   * Level failed.
   */
  onLevelFail() {
    audio.playSfx('levelFail');
    haptics.levelFail();
    screenShake.shake('heavy');
  },

  /**
   * Star earned during results tally.
   * @param {number} x
   * @param {number} y
   */
  onStarEarn(x, y) {
    audio.playSfx('starEarn');
    haptics.starEarn();
    particles.starSparkle(x, y);
  },

  /** Coin earned. */
  onCoinEarn() {
    audio.playSfx('coinEarn');
  },

  /** Power-up activated. */
  onPowerup() {
    audio.playSfx('powerup');
    haptics.powerup();
    screenShake.shake('light');
  },

  /** Boss attack event. */
  onBossAttack() {
    audio.playSfx('bossAttack');
    haptics.bossAttack();
    screenShake.shake('bossAttack');
  },

  /** Boss defeated. */
  onBossDefeat() {
    audio.playSfx('bossDefeat');
    haptics.levelComplete();
    particles.bossDefeat();
  },

  /** UI button tap. */
  onUiTap() {
    audio.playSfx('uiTap');
    haptics.uiTap();
  },

  /**
   * Scene changed — manage BGM.
   * @param {string} sceneId
   * @param {object} [opts] — { worldTheme }
   */
  onSceneChange(sceneId, opts = {}) {
    switch (sceneId) {
      case 'home':
        audio.playBrandJingle();
        // Start menu BGM after jingle finishes (~1.5s)
        setTimeout(() => audio.playBgm('menu'), 1500);
        break;
      case 'map':
      case 'shop':
        audio.playBgm('menu');
        break;
      case 'game':
        audio.playBgm(opts.worldTheme || 'modern');
        break;
      case 'results':
        // Keep current BGM or fade out
        break;
      default:
        break;
    }
  },

  /** Pause — mute BGM. */
  onPause() {
    audio.pauseBgm();
  },

  /** Resume — restore BGM. */
  onResume() {
    audio.resumeBgm();
  },

  /** Cleanup. */
  destroy() {
    audio.stopBgm();
    particles.destroy();
    screenShake.stop();
    scorePopups.clear();
  },
};
