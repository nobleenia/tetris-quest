/**
 * Stackr Quest — Home / Splash Scene
 *
 * Vibrant landing page with animated tetromino background,
 * large Play button, and Connect (auth) button.
 */

import { hideGameUI, showGameUI } from './helpers.js';
import { getProfile, hasRealAccount } from '../systems/auth.js';
import { isSupabaseConfigured } from '../systems/supabase.js';

let containerEl = null;
let _abort = null;

export const homeScene = {
  id: 'home',

  enter(_params, ctx) {
    const sceneEl = document.querySelector('[data-scene="home"]');
    if (!sceneEl) return;
    containerEl = sceneEl;
    _abort = new AbortController();

    // Hide the legacy overlay if it exists
    const legacyOverlay = document.querySelector('#homeOverlay');
    if (legacyOverlay) legacyOverlay.classList.add('hidden');

    hideGameUI();
    render(ctx);
  },

  exit(_ctx) {
    if (_abort) { _abort.abort(); _abort = null; }
    if (containerEl) containerEl.innerHTML = '';
    showGameUI();
  },
};

/* ─── Tetromino shapes for the background ──────────────────────── */
const TETROMINO_SHAPES = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];
const TETROMINO_COLORS = ['#00e5ff', '#ffd600', '#ab47bc', '#66bb6a', '#ef5350', '#ff9800', '#42a5f5'];

function buildBackgroundTetrominoes(count = 18) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const idx = i % TETROMINO_SHAPES.length;
    const color = TETROMINO_COLORS[idx];
    const size = 24 + Math.random() * 28;
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 14;
    const rotate = Math.floor(Math.random() * 360);
    html += `<div class="splash__tetro" style="
      left:${left}%;
      width:${size}px;height:${size}px;
      background:${color};
      animation-delay:${delay}s;
      animation-duration:${duration}s;
      transform:rotate(${rotate}deg);
      opacity:0.18;
    "></div>`;
  }
  return html;
}

function render(ctx) {
  if (!containerEl) return;

  const isConnected = isSupabaseConfigured && hasRealAccount();
  const connectLabel = isConnected ? `${getProfile().displayName}` : 'Connect';
  const connectIcon = isConnected
    ? '<span class="splash__connect-avatar">👤</span>'
    : `<svg class="splash__connect-google" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8.5h11.3C34 33.3 29.5 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6.4-6.4C34.5 5 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l7 5.1C14.8 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l6.4-6.4C34.5 5 29.6 3 24 3 16.3 3 9.6 7.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.5 36.3 26.9 37 24 37c-5.5 0-10.1-3.7-11.8-8.7l-7 5.4C8.6 40.2 15.7 45 24 45z"/><path fill="#1976D2" d="M43.6 20H24v8.5h11.3c-.8 2.5-2.4 4.6-4.5 6l6.5 5.5C40 37.6 44 32.1 44 24c0-1.3-.1-2.7-.4-4z"/></svg>`;

  containerEl.innerHTML = /* html */ `
    <div class="splash">
      <!-- Animated background -->
      <div class="splash__bg">${buildBackgroundTetrominoes()}</div>

      <!-- Foreground content -->
      <div class="splash__content">
        <div class="splash__logo">
          <h1 class="splash__title">Stackr<br><span class="splash__title-accent">Quest</span></h1>
          <p class="splash__tagline">A block-stacking puzzle adventure</p>
        </div>

        <button class="splash__play" data-action="play">
          <span class="splash__play-text">Play!</span>
        </button>

        <button class="splash__connect" data-action="connect">
          ${connectIcon}
          <span>${connectLabel}</span>
        </button>
      </div>
    </div>
  `;

  wireEvents(ctx);
}

function wireEvents(ctx) {
  if (!containerEl || !_abort) return;
  const signal = _abort.signal;

  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'play') {
      ctx.router.navigate('#/play-menu');
    } else if (action === 'connect') {
      ctx.router.navigate('#/account');
    }
  }, { signal });
}
