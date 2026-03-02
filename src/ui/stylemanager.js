/**
 * All supported CSS theme classes — one per world.
 * Adding a new world = add its class here + define CSS rules.
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
 * Apply a visual theme by setting the body's CSS class.
 * @param {string} style - Theme name (e.g., 'modern', 'neon', 'deepsea')
 */
export function applyStyle(style) {
  // Remove all theme classes
  document.body.classList.remove(...THEME_CLASSES);

  const cls = `style-${style}`;
  if (THEME_CLASSES.includes(cls)) {
    document.body.classList.add(cls);
  } else {
    // Fallback to modern
    document.body.classList.add('style-modern');
  }
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
 * Apply the theme for a specific world.
 * @param {number} worldId - World number (1-10)
 */
export function applyWorldTheme(worldId) {
  const cls = getWorldThemeClass(worldId);
  document.body.classList.remove(...THEME_CLASSES);
  document.body.classList.add(cls);
}
