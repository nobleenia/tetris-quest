/**
 * Stackr Quest — Style / Theme Manager (Phase 4 Expansion)
 *
 * Each world has a full visual theme affecting:
 *   - Block colors (CSS custom properties)
 *   - Background (body background)
 *   - Particle colors
 *   - Board border / glow
 *
 * Players can unlock + equip themes earned from 3-starring worlds.
 * Themes are persisted in progress.js settings.
 */

import { particles } from '../systems/particles.js';

/**
 * All supported CSS theme classes — one per world.
 */
const THEME_CLASSES = [
  'style-modern',
  'style-gameboy',
  'style-deepsea',
  'style-neon',
  'style-volcano',
  'style-vaporwave',
  'style-storm',
  'style-arctic',
  'style-cosmos',
  'style-nexus',
];

/**
 * Full theme definitions — colors, particle colors, descriptions.
 * Each world has a distinct visual identity.
 */
const THEME_DEFS = {
  modern: {
    id: 'modern',
    name: 'Modern',
    worldId: 1,
    particleColors: ['#3b82f6', '#60a5fa', '#93c5fd', '#a855f7', '#ec4899', '#fbbf24'],
    blockGlow: false,
    boardBorder: 'rgba(59, 130, 246, 0.2)',
  },
  gameboy: {
    id: 'gameboy',
    name: 'GameBoy',
    worldId: 2,
    particleColors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    blockGlow: false,
    boardBorder: '#0f380f',
  },
  deepsea: {
    id: 'deepsea',
    name: 'Deep Sea',
    worldId: 3,
    particleColors: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#164e63'],
    blockGlow: true,
    boardBorder: 'rgba(6, 182, 212, 0.3)',
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    worldId: 4,
    particleColors: ['#ff00ff', '#00ffff', '#ff0080', '#80ff00', '#ffff00', '#00ff80'],
    blockGlow: true,
    boardBorder: 'rgba(255, 0, 255, 0.3)',
  },
  volcano: {
    id: 'volcano',
    name: 'Volcano',
    worldId: 5,
    particleColors: ['#ef4444', '#f97316', '#fbbf24', '#dc2626', '#b91c1c'],
    blockGlow: true,
    boardBorder: 'rgba(239, 68, 68, 0.3)',
  },
  vaporwave: {
    id: 'vaporwave',
    name: 'Vaporwave',
    worldId: 6,
    particleColors: ['#ff9ecb', '#c59cff', '#8ecbff', '#ffb3d9', '#d4a5ff'],
    blockGlow: false,
    boardBorder: 'rgba(197, 156, 255, 0.3)',
  },
  storm: {
    id: 'storm',
    name: 'Thunderspire',
    worldId: 7,
    particleColors: ['#a5b4fc', '#818cf8', '#6366f1', '#c7d2fe', '#e0e7ff'],
    blockGlow: true,
    boardBorder: 'rgba(99, 102, 241, 0.3)',
  },
  arctic: {
    id: 'arctic',
    name: 'Frozen Peaks',
    worldId: 8,
    particleColors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
    blockGlow: false,
    boardBorder: 'rgba(56, 189, 248, 0.2)',
  },
  cosmos: {
    id: 'cosmos',
    name: 'Starfield',
    worldId: 9,
    particleColors: ['#fbbf24', '#f59e0b', '#d97706', '#fde68a', '#fef3c7'],
    blockGlow: true,
    boardBorder: 'rgba(251, 191, 36, 0.3)',
  },
  nexus: {
    id: 'nexus',
    name: 'The Nexus',
    worldId: 10,
    particleColors: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1'],
    blockGlow: true,
    boardBorder: 'rgba(244, 63, 94, 0.3)',
  },
};

/** Currently active theme id. */
let _activeTheme = 'modern';

/**
 * Apply a visual theme by setting the body's CSS class + updating sub-systems.
 * @param {string} style - Theme name (e.g., 'modern', 'neon', 'deepsea')
 */
export function applyStyle(style) {
  document.body.classList.remove(...THEME_CLASSES);

  const cls = `style-${style}`;
  if (THEME_CLASSES.includes(cls)) {
    document.body.classList.add(cls);
  } else {
    document.body.classList.add('style-modern');
    style = 'modern';
  }

  _activeTheme = style;
  _applyThemeExtras(style);
}

/**
 * Get the CSS class for a world number.
 * @param {number} worldId - World number (1-10)
 * @returns {string} CSS class name
 */
export function getWorldThemeClass(worldId) {
  const map = {
    1: 'style-modern',
    2: 'style-gameboy',
    3: 'style-deepsea',
    4: 'style-neon',
    5: 'style-volcano',
    6: 'style-vaporwave',
    7: 'style-storm',
    8: 'style-arctic',
    9: 'style-cosmos',
    10: 'style-nexus',
  };
  return map[worldId] || 'style-modern';
}

/**
 * Get the theme name for a world number.
 * @param {number} worldId
 * @returns {string}
 */
export function getWorldThemeName(worldId) {
  const names = {
    1: 'modern', 2: 'gameboy', 3: 'deepsea', 4: 'neon', 5: 'volcano',
    6: 'vaporwave', 7: 'storm', 8: 'arctic', 9: 'cosmos', 10: 'nexus',
  };
  return names[worldId] || 'modern';
}

/**
 * Apply the theme for a specific world.
 * @param {number} worldId - World number (1-10)
 */
export function applyWorldTheme(worldId) {
  const name = getWorldThemeName(worldId);
  applyStyle(name);
}

/**
 * Get the full theme definition.
 * @param {string} themeId
 * @returns {object}
 */
export function getThemeDef(themeId) {
  return THEME_DEFS[themeId] || THEME_DEFS.modern;
}

/**
 * Get the active theme id.
 * @returns {string}
 */
export function getActiveTheme() {
  return _activeTheme;
}

/**
 * Get all theme definitions (for the shop / settings UI).
 * @returns {object[]}
 */
export function getAllThemes() {
  return Object.values(THEME_DEFS);
}

// ─── Internal ────────────────────────────────────────────────────────

function _applyThemeExtras(themeId) {
  const def = THEME_DEFS[themeId];
  if (!def) return;

  // Update particle colors
  particles.setColors(def.particleColors);

  // Apply board border glow via CSS custom properties
  document.documentElement.style.setProperty('--board-border-color', def.boardBorder);
  document.body.classList.toggle('theme-glow', !!def.blockGlow);
}
