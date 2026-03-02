/**
 * Stackr Quest — Achievement System
 *
 * Defines all achievements, their conditions, and evaluation logic.
 * Achievements are evaluated after each level complete, level fail,
 * or periodically against global stats.
 *
 * Unlocked achievements are stored in progress.achievements[].
 */

import {
  unlockAchievement,
  isAchievementUnlocked,
  getStats,
  getTotalStars,
  getUnlockedAchievements,
} from '../systems/progress.js';

// ─── Achievement Definitions ─────────────────────────────────────────

/**
 * Each achievement:
 *   id       — unique string key
 *   name     — display name
 *   desc     — human-readable description
 *   icon     — emoji or icon reference
 *   coins    — coin reward on unlock
 *   check(ctx) — returns true if condition met
 *
 * ctx is: { state, result, stats, totalStars }
 * `result` is the session result object (null when checking cumulative stats).
 */
export const ACHIEVEMENTS = [
  // ── First milestones ─────────────────────────
  {
    id: 'first_steps',
    name: 'First Steps',
    desc: 'Complete level 1-1',
    icon: '👣',
    coins: 100,
    check: ({ result }) => result?.outcome === 'complete' && result?.levelId === '1-1',
  },
  {
    id: 'first_star',
    name: 'Rising Star',
    desc: 'Earn your first star',
    icon: '⭐',
    coins: 50,
    check: ({ totalStars }) => totalStars >= 1,
  },
  {
    id: 'ten_stars',
    name: 'Star Collector',
    desc: 'Earn 10 stars',
    icon: '🌟',
    coins: 100,
    check: ({ totalStars }) => totalStars >= 10,
  },
  {
    id: 'fifty_stars',
    name: 'Constellation',
    desc: 'Earn 50 stars',
    icon: '✨',
    coins: 200,
    check: ({ totalStars }) => totalStars >= 50,
  },
  {
    id: 'hundred_stars',
    name: 'Galaxy',
    desc: 'Earn 100 stars',
    icon: '🌌',
    coins: 300,
    check: ({ totalStars }) => totalStars >= 100,
  },

  // ── Line milestones ──────────────────────────
  {
    id: 'lines_100',
    name: 'Line Crusher',
    desc: 'Clear 100 total lines',
    icon: '📏',
    coins: 200,
    check: ({ stats }) => stats.totalLinesCleared >= 100,
  },
  {
    id: 'lines_500',
    name: 'Line Legend',
    desc: 'Clear 500 total lines',
    icon: '📐',
    coins: 300,
    check: ({ stats }) => stats.totalLinesCleared >= 500,
  },
  {
    id: 'lines_1000',
    name: 'Line God',
    desc: 'Clear 1000 total lines',
    icon: '⚡',
    coins: 500,
    check: ({ stats }) => stats.totalLinesCleared >= 1000,
  },

  // ── Perfect play ─────────────────────────────
  {
    id: 'perfect_clear',
    name: 'Perfect Clear',
    desc: 'Earn 3 stars on any level',
    icon: '💎',
    coins: 100,
    check: ({ result }) => result?.stars >= 3,
  },
  {
    id: 'three_star_world',
    name: 'World Master',
    desc: '3-star all levels in a world',
    icon: '🏆',
    coins: 500,
    // Checked by the evaluateWorldMaster function separately
    check: () => false,
  },

  // ── Combo achievements ───────────────────────
  {
    id: 'combo_3',
    name: 'Combo Starter',
    desc: 'Achieve a 3× combo',
    icon: '🔥',
    coins: 100,
    check: ({ result, state }) => (result?.maxCombo ?? state?.maxCombo ?? 0) >= 3,
  },
  {
    id: 'combo_5',
    name: 'Combo Master',
    desc: 'Achieve a 5× combo',
    icon: '🔥',
    coins: 200,
    check: ({ result, state }) => (result?.maxCombo ?? state?.maxCombo ?? 0) >= 5,
  },
  {
    id: 'combo_10',
    name: 'Combo King',
    desc: 'Achieve a 10× combo',
    icon: '👑',
    coins: 300,
    check: ({ result, state }) => (result?.maxCombo ?? state?.maxCombo ?? 0) >= 10,
  },

  // ── Boss achievements ────────────────────────
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    desc: 'Defeat any boss',
    icon: '🐉',
    coins: 300,
    check: ({ stats }) => stats.totalBossesDefeated >= 1,
  },
  {
    id: 'boss_veteran',
    name: 'Boss Veteran',
    desc: 'Defeat 5 bosses',
    icon: '⚔️',
    coins: 500,
    check: ({ stats }) => stats.totalBossesDefeated >= 5,
  },

  // ── World progression ────────────────────────
  {
    id: 'world_2',
    name: 'Explorer',
    desc: 'Unlock World 2',
    icon: '🗺️',
    coins: 100,
    check: ({ totalStars }) => totalStars >= 20,
  },
  {
    id: 'world_5',
    name: 'Adventurer',
    desc: 'Unlock World 5',
    icon: '🏔️',
    coins: 200,
    check: ({ totalStars }) => totalStars >= 110,
  },
  {
    id: 'world_10',
    name: 'World Traveler',
    desc: 'Unlock World 10',
    icon: '🌍',
    coins: 500,
    check: ({ totalStars }) => totalStars >= 360,
  },

  // ── Classic mode ─────────────────────────────
  {
    id: 'classic_1000',
    name: 'Classic Contender',
    desc: 'Score 1000 in Classic Mode',
    icon: '🎮',
    coins: 100,
    check: ({ stats }) => stats.classicBestScore >= 1000,
  },
  {
    id: 'classic_5000',
    name: 'Classic Champion',
    desc: 'Score 5000 in Classic Mode',
    icon: '🏅',
    coins: 300,
    check: ({ stats }) => stats.classicBestScore >= 5000,
  },

  // ── Pieces placed ────────────────────────────
  {
    id: 'pieces_500',
    name: 'Stacker',
    desc: 'Place 500 pieces total',
    icon: '🧱',
    coins: 200,
    check: ({ stats }) => stats.totalPiecesPlaced >= 500,
  },
  {
    id: 'pieces_2000',
    name: 'Master Builder',
    desc: 'Place 2000 pieces total',
    icon: '🏗️',
    coins: 400,
    check: ({ stats }) => stats.totalPiecesPlaced >= 2000,
  },

  // ── Speed ────────────────────────────────────
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    desc: 'Complete a timed level under the target time',
    icon: '⚡',
    coins: 200,
    check: ({ result, state }) =>
      result?.outcome === 'complete' &&
      state?.objective?.type === 'timed' &&
      result?.stars >= 2,
  },

  // ── Levels completed ─────────────────────────
  {
    id: 'levels_10',
    name: 'Getting Started',
    desc: 'Complete 10 levels',
    icon: '📖',
    coins: 100,
    check: ({ stats }) => stats.totalLevelsCompleted >= 10,
  },
  {
    id: 'levels_50',
    name: 'Dedicated',
    desc: 'Complete 50 levels',
    icon: '📚',
    coins: 300,
    check: ({ stats }) => stats.totalLevelsCompleted >= 50,
  },
  {
    id: 'levels_200',
    name: 'Completionist',
    desc: 'Complete all 200 levels',
    icon: '🎯',
    coins: 1000,
    check: ({ stats }) => stats.totalLevelsCompleted >= 200,
  },
];

/** Map for quick lookup by id. */
const ACHIEVEMENTS_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

// ─── Evaluation ──────────────────────────────────────────────────────

/**
 * Evaluate all achievements and return newly unlocked ones.
 * Call this after each level complete/fail and periodically for stat-based ones.
 *
 * @param {object} ctx — { state, result }
 * @returns {Array<{ id, name, desc, icon, coins }>} — newly unlocked achievements
 */
export function evaluateAchievements(ctx = {}) {
  const stats = getStats();
  const totalStars = getTotalStars();
  const evalCtx = { ...ctx, stats, totalStars };

  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (isAchievementUnlocked(achievement.id)) continue;

    try {
      if (achievement.check(evalCtx)) {
        const didUnlock = unlockAchievement(achievement.id);
        if (didUnlock) {
          newlyUnlocked.push({
            id: achievement.id,
            name: achievement.name,
            desc: achievement.desc,
            icon: achievement.icon,
            coins: achievement.coins,
          });
        }
      }
    } catch {
      // Skip erroring achievements silently
    }
  }

  return newlyUnlocked;
}

/**
 * Get display info for all achievements (with lock status).
 * @returns {Array<{ id, name, desc, icon, coins, unlocked }>}
 */
export function getAllAchievements() {
  const unlocked = new Set(getUnlockedAchievements());
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    name: a.name,
    desc: a.desc,
    icon: a.icon,
    coins: a.coins,
    unlocked: unlocked.has(a.id),
  }));
}

/**
 * Get a single achievement definition.
 * @param {string} id
 */
export function getAchievement(id) {
  return ACHIEVEMENTS_MAP.get(id) || null;
}
