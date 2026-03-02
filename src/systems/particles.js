/**
 * Stackr Quest — Particle System (Overhauled)
 *
 * Canvas-based particle renderer for high-performance effects.
 * Supports multiple simultaneous emitters and blending modes.
 *
 * Effects:
 * - Line clear burst (from cleared row)
 * - Tetris celebration (screen-wide)
 * - Combo particles (intensity scales)
 * - Level complete confetti
 * - Boss defeat explosion
 * - Star earn sparkle
 * - Hard drop impact
 *
 * Usage:
 *   import { particles } from './systems/particles.js';
 *   particles.init();
 *   particles.lineClear(rowY, lines);
 */

/** @type {HTMLCanvasElement|null} */
let _canvas = null;
/** @type {CanvasRenderingContext2D|null} */
let _ctx = null;
let _enabled = true;
let _rafId = null;
let _lastTime = 0;

/** @type {Particle[]} */
const _pool = [];
const MAX_PARTICLES = 500;

// Theme-aware colors
let _colors = ['#ff0', '#0ff', '#f0f', '#0f0', '#f00', '#00f', '#fa0'];

class Particle {
  constructor() {
    this.alive = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.color = '#fff';
    this.gravity = 0;
    this.friction = 1;
    this.shape = 'square'; // 'square' | 'circle' | 'star' | 'confetti'
    this.rotation = 0;
    this.rotSpeed = 0;
    this.fadeOut = true;
    this.shrink = false;
  }

  reset(opts) {
    this.alive = true;
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.vx = opts.vx ?? 0;
    this.vy = opts.vy ?? 0;
    this.life = opts.life ?? 0.6;
    this.maxLife = this.life;
    this.size = opts.size ?? 4;
    this.color = opts.color ?? '#fff';
    this.gravity = opts.gravity ?? 200;
    this.friction = opts.friction ?? 0.98;
    this.shape = opts.shape ?? 'square';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 8;
    this.fadeOut = opts.fadeOut !== false;
    this.shrink = opts.shrink ?? false;
  }

  update(dt) {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
  }

  draw(ctx) {
    if (!this.alive) return;
    const progress = 1 - this.life / this.maxLife;
    const alpha = this.fadeOut ? Math.max(0, 1 - progress) : 1;
    const size = this.shrink ? this.size * (1 - progress * 0.7) : this.size;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'star':
        drawStar(ctx, 0, 0, 5, size / 2, size / 4);
        break;
      case 'confetti':
        ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        break;
      default: // square
        ctx.fillRect(-size / 2, -size / 2, size, size);
        break;
    }
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

// ─── Pool management ─────────────────────────────────────────────────

function getParticle() {
  // Reuse dead particle
  for (let i = 0; i < _pool.length; i++) {
    if (!_pool[i].alive) return _pool[i];
  }
  // Create new if under limit
  if (_pool.length < MAX_PARTICLES) {
    const p = new Particle();
    _pool.push(p);
    return p;
  }
  // Steal the oldest
  return _pool[0];
}

function emit(opts) {
  const p = getParticle();
  p.reset(opts);
}

// ─── Animation loop ──────────────────────────────────────────────────

function frame(now) {
  if (!_canvas || !_ctx) return;
  const dt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime = now;

  // Resize canvas if needed
  if (_canvas.width !== _canvas.clientWidth || _canvas.height !== _canvas.clientHeight) {
    _canvas.width = _canvas.clientWidth;
    _canvas.height = _canvas.clientHeight;
  }

  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

  let anyAlive = false;
  for (let i = 0; i < _pool.length; i++) {
    const p = _pool[i];
    if (!p.alive) continue;
    p.update(dt);
    if (p.alive) {
      p.draw(_ctx);
      anyAlive = true;
    }
  }

  if (anyAlive) {
    _rafId = requestAnimationFrame(frame);
  } else {
    _rafId = null;
  }
}

function ensureRunning() {
  if (!_rafId) {
    _lastTime = performance.now();
    _rafId = requestAnimationFrame(frame);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function randomColor() {
  return _colors[Math.floor(Math.random() * _colors.length)];
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// ─── Public API ──────────────────────────────────────────────────────

export const particles = {
  /**
   * Initialize the particle system.
   * Creates or reuses the canvas overlay.
   */
  init() {
    _canvas = document.getElementById('particle-canvas');
    if (!_canvas) {
      _canvas = document.createElement('canvas');
      _canvas.id = 'particle-canvas';
      _canvas.className = 'particle-canvas';
      document.body.appendChild(_canvas);
    }
    _ctx = _canvas.getContext('2d');
  },

  /** Enable/disable particles. */
  setEnabled(on) {
    _enabled = !!on;
    if (!on) this.clear();
  },

  /** @returns {boolean} */
  isEnabled() {
    return _enabled;
  },

  /** Set theme colors for particles. */
  setColors(colors) {
    if (Array.isArray(colors) && colors.length > 0) {
      _colors = colors;
    }
  },

  /**
   * Line clear burst — particles explode from cleared row(s).
   * @param {number} y — vertical position (px) of the cleared row
   * @param {number} lines — number of lines cleared (1-4)
   */
  lineClear(y, lines = 1) {
    if (!_enabled) return;
    const count = 8 + lines * 6;
    const boardRect = document.getElementById('boardGrid')?.getBoundingClientRect();
    const cx = boardRect ? boardRect.left + boardRect.width / 2 : window.innerWidth / 2;
    const py = boardRect ? boardRect.top + y : y;

    for (let i = 0; i < count; i++) {
      emit({
        x: cx + randomRange(-boardRect?.width / 2 || -80, boardRect?.width / 2 || 80),
        y: py,
        vx: randomRange(-200, 200),
        vy: randomRange(-300, -50),
        life: randomRange(0.4, 0.8),
        size: randomRange(3, 6),
        color: randomColor(),
        gravity: 400,
        shape: 'square',
      });
    }
    ensureRunning();
  },

  /**
   * Tetris celebration — screen-wide burst.
   */
  tetrisCelebration() {
    if (!_enabled) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(200, 500);
      emit({
        x: cx + randomRange(-50, 50),
        y: cy + randomRange(-50, 50),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.6, 1.2),
        size: randomRange(4, 8),
        color: randomColor(),
        gravity: 200,
        shape: 'square',
        shrink: true,
      });
    }
    ensureRunning();
  },

  /**
   * Combo particles — intensity scales with combo count.
   * @param {number} combo
   * @param {number} y — board Y position
   */
  combo(combo, y) {
    if (!_enabled || combo < 2) return;
    const count = Math.min(4 + combo * 3, 30);
    const boardRect = document.getElementById('boardGrid')?.getBoundingClientRect();
    const cx = boardRect ? boardRect.left + boardRect.width / 2 : window.innerWidth / 2;
    const py = boardRect ? boardRect.top + y : y;

    for (let i = 0; i < count; i++) {
      emit({
        x: cx + randomRange(-30, 30),
        y: py,
        vx: randomRange(-150, 150),
        vy: randomRange(-250, -100),
        life: randomRange(0.3, 0.6),
        size: randomRange(2, 5),
        color: '#ffd166',
        gravity: 300,
        shape: 'circle',
        shrink: true,
      });
    }
    ensureRunning();
  },

  /**
   * Level complete confetti — falls from the top.
   */
  levelComplete() {
    if (!_enabled) return;
    const w = window.innerWidth;

    for (let i = 0; i < 80; i++) {
      emit({
        x: randomRange(0, w),
        y: randomRange(-50, -10),
        vx: randomRange(-60, 60),
        vy: randomRange(100, 300),
        life: randomRange(1.5, 3),
        size: randomRange(5, 10),
        color: randomColor(),
        gravity: 50,
        friction: 0.99,
        shape: 'confetti',
        fadeOut: true,
      });
    }
    ensureRunning();
  },

  /**
   * Boss defeat explosion — intense burst from center.
   */
  bossDefeat() {
    if (!_enabled) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.4;

    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(300, 700);
      emit({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.5, 1.5),
        size: randomRange(4, 10),
        color: randomColor(),
        gravity: 100,
        shape: Math.random() > 0.5 ? 'star' : 'square',
        shrink: true,
      });
    }
    ensureRunning();
  },

  /**
   * Star earn sparkle.
   * @param {number} x — position
   * @param {number} y — position
   */
  starSparkle(x, y) {
    if (!_enabled) return;
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(50, 150);
      emit({
        x: x + randomRange(-5, 5),
        y: y + randomRange(-5, 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomRange(0.3, 0.7),
        size: randomRange(2, 5),
        color: '#ffd700',
        gravity: -30,
        shape: 'star',
        shrink: true,
      });
    }
    ensureRunning();
  },

  /**
   * Hard drop impact — small burst at landing position.
   * @param {number} x — board X position
   * @param {number} y — board Y position
   */
  hardDropImpact(x, y) {
    if (!_enabled) return;
    const boardRect = document.getElementById('boardGrid')?.getBoundingClientRect();
    const px = boardRect ? boardRect.left + x : x;
    const py = boardRect ? boardRect.top + y : y;

    for (let i = 0; i < 8; i++) {
      emit({
        x: px + randomRange(-10, 10),
        y: py,
        vx: randomRange(-100, 100),
        vy: randomRange(-150, -30),
        life: randomRange(0.2, 0.4),
        size: randomRange(2, 4),
        color: '#fff',
        gravity: 500,
        shape: 'square',
      });
    }
    ensureRunning();
  },

  /**
   * Board dissolve — the whole board dissolves into particles.
   * Used for level-complete transition.
   */
  boardDissolve() {
    if (!_enabled) return;
    const boardRect = document.getElementById('boardGrid')?.getBoundingClientRect();
    if (!boardRect) return;

    for (let i = 0; i < 60; i++) {
      emit({
        x: boardRect.left + randomRange(0, boardRect.width),
        y: boardRect.top + randomRange(0, boardRect.height),
        vx: randomRange(-80, 80),
        vy: randomRange(-200, -50),
        life: randomRange(0.5, 1.2),
        size: randomRange(3, 7),
        color: randomColor(),
        gravity: 150,
        shape: 'square',
        shrink: true,
        fadeOut: true,
      });
    }
    ensureRunning();
  },

  /** Clear all particles. */
  clear() {
    for (let i = 0; i < _pool.length; i++) {
      _pool[i].alive = false;
    }
    if (_ctx && _canvas) {
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }
  },

  /** Destroy — cleanup. */
  destroy() {
    this.clear();
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },
};
