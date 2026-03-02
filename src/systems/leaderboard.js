/**
 * Stackr Quest — Leaderboards
 *
 * Queries Supabase for ranked data:
 *   - Per-level leaderboard (top 100)
 *   - Global star leaderboard (top 100)
 *   - Daily challenge leaderboard (today, top 100)
 *   - Friends leaderboard overlays
 *
 * Anti-cheat: basic plausibility checks before submission.
 * All functions return empty arrays when offline / Supabase not configured.
 */

import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { getUserId, isAuthenticated } from './auth.js';

// ─── Score plausibility (basic anti-cheat) ───────────────────────────

/** Max theoretical score per line cleared (with combos, T-spins, etc.) */
const MAX_SCORE_PER_LINE = 2000;
/** Max reasonable lines in a single level */
const MAX_LINES_PER_LEVEL = 200;

/**
 * Basic plausibility check. Returns true if score seems legitimate.
 * @param {number} score
 * @param {number} linesCleared
 */
export function isScorePlausible(score, linesCleared) {
  if (score < 0 || linesCleared < 0) return false;
  if (linesCleared > MAX_LINES_PER_LEVEL) return false;
  if (score > linesCleared * MAX_SCORE_PER_LINE + 10000) return false; // 10k buffer for bonuses
  return true;
}

// ─── Per-level leaderboard ───────────────────────────────────────────

/**
 * Get top scores for a specific level.
 * @param {string} levelId — e.g. '1-5'
 * @param {number} [limit=100]
 * @returns {Promise<Array<{ rank: number, displayName: string, score: number, stars: number }>>}
 */
export async function getLevelLeaderboard(levelId, limit = 100) {
  if (!isSupabaseConfigured) return [];

  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('leaderboard_level')
      .select('rank, display_name, score, stars, best_time')
      .eq('level_id', levelId)
      .lte('rank', limit)
      .order('rank', { ascending: true });

    if (error) {
      console.warn('[leaderboard] Level fetch failed:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      rank: row.rank,
      displayName: row.display_name,
      score: row.score,
      stars: row.stars,
      bestTime: row.best_time,
    }));
  } catch (err) {
    console.warn('[leaderboard] Level fetch error:', err);
    return [];
  }
}

/**
 * Get the current user's rank on a specific level.
 * @param {string} levelId
 * @returns {Promise<number|null>} — rank (1-based) or null if not ranked
 */
export async function getUserLevelRank(levelId) {
  if (!isSupabaseConfigured || !isAuthenticated()) return null;

  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('leaderboard_level')
      .select('rank')
      .eq('level_id', levelId)
      .eq('user_id', getUserId())
      .single();

    if (error || !data) return null;
    return data.rank;
  } catch {
    return null;
  }
}

// ─── Global star leaderboard ─────────────────────────────────────────

/**
 * Get top players by total stars.
 * @param {number} [limit=100]
 * @returns {Promise<Array<{ rank: number, displayName: string, totalStars: number, highestWorld: number }>>}
 */
export async function getGlobalLeaderboard(limit = 100) {
  if (!isSupabaseConfigured) return [];

  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('leaderboard_stars')
      .select('rank, display_name, total_stars, highest_world, highest_level')
      .lte('rank', limit)
      .order('rank', { ascending: true });

    if (error) {
      console.warn('[leaderboard] Global fetch failed:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      rank: row.rank,
      displayName: row.display_name,
      totalStars: row.total_stars,
      highestWorld: row.highest_world,
      highestLevel: row.highest_level,
    }));
  } catch (err) {
    console.warn('[leaderboard] Global fetch error:', err);
    return [];
  }
}

/**
 * Get the current user's global rank.
 * @returns {Promise<number|null>}
 */
export async function getUserGlobalRank() {
  if (!isSupabaseConfigured || !isAuthenticated()) return null;

  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('leaderboard_stars')
      .select('rank')
      .eq('user_id', getUserId())
      .single();

    if (error || !data) return null;
    return data.rank;
  } catch {
    return null;
  }
}

// ─── Daily challenge leaderboard ─────────────────────────────────────

/**
 * Get today's daily challenge leaderboard.
 * @param {string} dateStr — YYYY-MM-DD format
 * @param {number} [limit=100]
 * @returns {Promise<Array<{ rank: number, displayName: string, score: number, stars: number, timeSec: number }>>}
 */
export async function getDailyLeaderboard(dateStr, limit = 100) {
  if (!isSupabaseConfigured) return [];

  const sb = getSupabase();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('leaderboard_daily')
      .select('rank, display_name, score, stars, time_sec')
      .eq('challenge_date', dateStr)
      .lte('rank', limit)
      .order('rank', { ascending: true });

    if (error) {
      console.warn('[leaderboard] Daily fetch failed:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      rank: row.rank,
      displayName: row.display_name,
      score: row.score,
      stars: row.stars,
      timeSec: row.time_sec,
    }));
  } catch (err) {
    console.warn('[leaderboard] Daily fetch error:', err);
    return [];
  }
}

/**
 * Submit a daily challenge result.
 * @param {{ date: string, score: number, stars: number, linesCleared: number, timeSec: number }} result
 */
export async function submitDailyResult(result) {
  if (!isSupabaseConfigured || !isAuthenticated()) return { error: 'Not authenticated' };

  if (!isScorePlausible(result.score, result.linesCleared)) {
    return { error: 'Score validation failed' };
  }

  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not available' };

  try {
    const { error } = await sb.from('daily_results').upsert(
      {
        user_id: getUserId(),
        challenge_date: result.date,
        score: result.score,
        stars: result.stars,
        lines_cleared: result.linesCleared,
        time_sec: result.timeSec,
      },
      { onConflict: 'user_id,challenge_date' },
    );

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Friends leaderboard ─────────────────────────────────────────────

/**
 * Get friend scores for a specific level.
 * @param {string} levelId
 * @returns {Promise<Array<{ displayName: string, score: number, stars: number }>>}
 */
export async function getFriendScores(levelId) {
  if (!isSupabaseConfigured || !isAuthenticated()) return [];

  const sb = getSupabase();
  if (!sb) return [];

  const userId = getUserId();

  try {
    // Get friend IDs
    const { data: friends, error: fErr } = await sb
      .from('friendships')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (fErr || !friends?.length) return [];

    const friendIds = friends.map((f) =>
      f.user_a === userId ? f.user_b : f.user_a,
    );
    friendIds.push(userId); // include self

    // Get progress for friends on this level
    const { data, error } = await sb
      .from('player_progress')
      .select('user_id, best_score, stars')
      .eq('level_id', levelId)
      .in('user_id', friendIds)
      .order('best_score', { ascending: false });

    if (error) return [];

    // Resolve display names
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, display_name')
      .in('id', friendIds);

    const nameMap = {};
    for (const p of profiles || []) nameMap[p.id] = p.display_name;

    return (data || []).map((row) => ({
      displayName: nameMap[row.user_id] || 'Player',
      score: row.best_score,
      stars: row.stars,
      isMe: row.user_id === userId,
    }));
  } catch (err) {
    console.warn('[leaderboard] Friends fetch error:', err);
    return [];
  }
}
