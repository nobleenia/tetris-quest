/**
 * Stackr Quest — Tutorial Overlay System
 *
 * Levels 1-1 through 1-3 have guided overlays:
 *   - "Swipe left/right to move" (1-1)
 *   - "Tap to rotate" (1-2)
 *   - "Swipe up to hard drop" (1-3)
 *
 * Non-intrusive, dismissable, only shown once per tutorial type.
 */

const STORAGE_KEY = 'stackr_tutorials_seen';

const TUTORIALS = {
  move: {
    id: 'move',
    title: '← Swipe to Move →',
    body: 'Swipe left or right to move the falling piece. Use arrow keys on keyboard.',
    icon: '👆',
  },
  rotate: {
    id: 'rotate',
    title: 'Tap to Rotate',
    body: 'Tap the rotate button or press T to spin pieces clockwise.',
    icon: '🔄',
  },
  harddrop: {
    id: 'harddrop',
    title: 'Swipe Up to Drop',
    body: 'Swipe up or press the up arrow to instantly drop a piece to the bottom.',
    icon: '⬆️',
  },
};

/** @type {Set<string>} */
let seen = null;

function loadSeen() {
  if (seen) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    seen = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    seen = new Set();
  }
}

function saveSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // noop
  }
}

/** @type {HTMLElement|null} */
let overlayEl = null;

/**
 * Show a tutorial overlay if the user hasn't seen it yet.
 * @param {string} tutorialId — key from TUTORIALS
 * @returns {boolean} — true if tutorial was shown
 */
export function showTutorial(tutorialId) {
  loadSeen();
  if (seen.has(tutorialId)) return false;

  const tut = TUTORIALS[tutorialId];
  if (!tut) return false;

  // Create overlay
  overlayEl = document.createElement('div');
  overlayEl.className = 'tutorial-overlay';
  overlayEl.innerHTML = /* html */ `
    <div class="tutorial__card">
      <div class="tutorial__icon">${tut.icon}</div>
      <h3 class="tutorial__title">${tut.title}</h3>
      <p class="tutorial__body">${tut.body}</p>
      <button class="btn tutorial__dismiss">Got it!</button>
    </div>
  `;

  document.body.appendChild(overlayEl);

  // Dismiss on click anywhere or button
  const dismiss = () => {
    seen.add(tutorialId);
    saveSeen();
    overlayEl?.remove();
    overlayEl = null;
  };

  overlayEl.querySelector('.tutorial__dismiss')?.addEventListener('click', dismiss);
  // Also dismiss on tap anywhere after a short delay (prevent accidental immediate dismiss)
  setTimeout(() => {
    overlayEl?.addEventListener('click', (e) => {
      if (e.target === overlayEl) dismiss();
    });
  }, 500);

  return true;
}

/**
 * Dismiss any active tutorial overlay.
 */
export function dismissTutorial() {
  overlayEl?.remove();
  overlayEl = null;
}

/**
 * Check if a tutorial has been seen.
 * @param {string} tutorialId
 */
export function isTutorialSeen(tutorialId) {
  loadSeen();
  return seen.has(tutorialId);
}

/**
 * Reset all tutorial seen status (for testing).
 */
export function resetTutorials() {
  seen = new Set();
  saveSeen();
}
