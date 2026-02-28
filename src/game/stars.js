/**
 * Stackr Quest — Star Rating Calculator
 *
 * Evaluates the player's performance against star thresholds defined
 * in the level config. Always returns 1-3 stars (1 = objective complete).
 *
 * Star config format (from schema.json):
 *   one:   "objective"  (always = complete the objective)
 *   two:   { type: "score"|"time"|"linesExtra"|"piecesUnder", value: N }
 *   three: { type: "score"|"time"|"linesExtra"|"piecesUnder", value: N }
 */

/**
 * Calculate stars earned for a completed level.
 *
 * @param {object} state — game state after level completion
 * @returns {{ stars: number, details: { one: boolean, two: boolean, three: boolean } }}
 */
export function calculateStars(state) {
  const config = state.starConfig;
  const details = { one: false, two: false, three: false };

  // No star config → default to 1 star for completing
  if (!config) {
    return { stars: state.objectiveComplete ? 1 : 0, details: { one: state.objectiveComplete, two: false, three: false } };
  }

  // ⭐ 1 star: objective complete
  details.one = state.objectiveComplete;
  if (!details.one) {
    return { stars: 0, details };
  }

  // ⭐⭐ 2 stars: secondary threshold
  details.two = config.two ? evaluateThreshold(config.two, state) : false;

  // ⭐⭐⭐ 3 stars: tertiary threshold
  details.three = config.three ? evaluateThreshold(config.three, state) : false;

  // Stars are cumulative: 3 includes 2, 2 includes 1
  const stars = details.three ? 3 : details.two ? 2 : 1;

  return { stars, details };
}

/**
 * Evaluate a single star threshold against current state.
 *
 * @param {object} threshold — { type: string, value: number }
 * @param {object} state
 * @returns {boolean}
 */
function evaluateThreshold(threshold, state) {
  switch (threshold.type) {
    case 'score':
      // Player score must be >= threshold value
      return state.score >= threshold.value;

    case 'time':
      // Player must have completed in <= threshold seconds
      return state.elapsedSec <= threshold.value;

    case 'linesExtra':
      // Player must have cleared >= threshold extra lines beyond objective
      return state.linesCleared >= (state.objective?.target ?? 0) + threshold.value;

    case 'piecesUnder':
      // Player must have used <= threshold pieces
      return state.pieceCount <= threshold.value;

    default:
      return false;
  }
}

/**
 * Get a human-readable description of what's needed for each star.
 * Useful for the level briefing popup.
 *
 * @param {object} starConfig — { one, two, three }
 * @param {object} objective — { type, target, description }
 * @returns {{ one: string, two: string, three: string }}
 */
export function getStarDescriptions(starConfig, objective) {
  const desc = {
    one: objective?.description ?? 'Complete the objective',
    two: '',
    three: '',
  };

  if (starConfig?.two) {
    desc.two = describeThreshold(starConfig.two);
  }
  if (starConfig?.three) {
    desc.three = describeThreshold(starConfig.three);
  }

  return desc;
}

/**
 * Human-readable description of a star threshold.
 * @param {object} threshold
 * @returns {string}
 */
function describeThreshold(threshold) {
  switch (threshold.type) {
    case 'score':
      return `Score ${threshold.value.toLocaleString()} points`;
    case 'time':
      return `Complete in ${threshold.value}s or less`;
    case 'linesExtra':
      return `Clear ${threshold.value} extra lines`;
    case 'piecesUnder':
      return `Use ${threshold.value} pieces or fewer`;
    default:
      return '';
  }
}
