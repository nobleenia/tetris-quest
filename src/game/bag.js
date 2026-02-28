/**
 * 7-Bag Randomizer
 *
 * Standard guideline piece generator: shuffles all 7 tetrominoes into a bag,
 * deals them out one by one, then refills. Guarantees every piece appears
 * exactly once per 7 pieces — no drought, no flood.
 */

import { PIECE_IDS } from './pieces.js';

/**
 * Fisher-Yates shuffle (in-place).
 * @param {Array} arr
 * @returns {Array} same array, shuffled
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a 7-bag piece generator.
 *
 * @returns {{ next: () => string, peek: () => string, reset: () => void }}
 */
export function create7Bag() {
  let bag = [];

  function refill() {
    bag = shuffle([...PIECE_IDS]);
  }

  // Start with a full bag
  refill();

  return {
    /** Pull the next piece ID from the bag (refills automatically). */
    next() {
      if (bag.length === 0) refill();
      return bag.pop();
    },

    /** Peek at the next piece without consuming it. */
    peek() {
      if (bag.length === 0) refill();
      return bag[bag.length - 1];
    },

    /** Reset / reshuffle (e.g. on level restart). */
    reset() {
      refill();
    },
  };
}
