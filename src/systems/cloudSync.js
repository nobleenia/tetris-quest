/**
 * Stackr Quest — Cloud Save / Progress Sync
 *
 * Bidirectional sync between localStorage and Supabase.
 * - On login: pull cloud data, merge with local, push merged result
 * - On level complete: push updated progress
 * - Merge strategy: per-level, keep highest stars & best score
 *
 * Degrades gracefully when offline or Supabase not configured.
 */

import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { getUserId, isAuthenticated } from './auth.js';
import {
  getSaveSnapshot,
  recordLevelResult,
  advanceHighest,
  getHighestReached,
  getTotalStars,
} from './progress.js';

/** @type {boolean} */
let _syncing = false;

/** @type {number} Last successful sync timestamp */
let _lastSyncAt = 0;

// ─── Full Sync (bidirectional merge) ─────────────────────────────────

/**
 * Pull cloud progress and merge with local.
 * Should be called after sign-in or on app startup.
 * @returns {{ merged: number, pulled: number, pushed: number } | null}
 */
export async function syncProgress() {
  if (!isSupabaseConfigured || !isAuthenticated() || _syncing) return null;
  _syncing = true;

  try {
    const sb = getSupabase();
    if (!sb) return null;

    const userId = getUserId();
    const local = getSaveSnapshot();

    // 1. Pull all cloud progress for this user
    const { data: cloudRows, error } = await sb
      .from('player_progress')
      .select('level_id, stars, best_score, best_time, retries')
      .eq('user_id', userId);

    if (error) {
      console.warn('[cloudSync] Pull failed:', error.message);
      return null;
    }

    // 2. Build cloud map
    const cloudMap = {};
    for (const row of cloudRows || []) {
      cloudMap[row.level_id] = row;
    }

    // 3. Merge: for each level, keep the best of local vs cloud
    const toPush = []; // levels where local is better
    let pulled = 0;
    let pushed = 0;
    let merged = 0;

    // All known level IDs (union of local + cloud)
    const allLevelIds = new Set([
      ...Object.keys(local.stars),
      ...Object.keys(cloudMap),
    ]);

    for (const levelId of allLevelIds) {
      const localStars = local.stars[levelId] || 0;
      const localScore = local.bestScore[levelId] || 0;
      const localRetries = local.retries[levelId] || 0;

      const cloud = cloudMap[levelId];
      const cloudStars = cloud?.stars || 0;
      const cloudScore = cloud?.best_score || 0;

      const bestStars = Math.max(localStars, cloudStars);
      const bestScore = Math.max(localScore, cloudScore);

      merged++;

      // If cloud has better data, update local
      if (cloudStars > localStars || cloudScore > localScore) {
        recordLevelResult(levelId, bestStars, bestScore, false);
        pulled++;
      }

      // If local has better data, push to cloud
      if (localStars > cloudStars || localScore > cloudScore) {
        toPush.push({
          user_id: userId,
          level_id: levelId,
          stars: bestStars,
          best_score: bestScore,
          retries: localRetries,
        });
        pushed++;
      }
    }

    // 4. Push merged results to cloud
    if (toPush.length > 0) {
      const { error: pushError } = await sb
        .from('player_progress')
        .upsert(toPush, { onConflict: 'user_id,level_id' });

      if (pushError) {
        console.warn('[cloudSync] Push failed:', pushError.message);
      }
    }

    // 5. Sync profile summary
    await _syncProfileSummary();

    _lastSyncAt = Date.now();
    return { merged, pulled, pushed };
  } catch (err) {
    console.error('[cloudSync] Sync error:', err);
    return null;
  } finally {
    _syncing = false;
  }
}

// ─── Push a single level result ──────────────────────────────────────

/**
 * Push a single level result to cloud (call after recordLevelResult).
 * @param {string} levelId
 * @param {number} stars
 * @param {number} score
 * @param {number} [timeSec]
 */
export async function pushLevelResult(levelId, stars, score, timeSec = null) {
  if (!isSupabaseConfigured || !isAuthenticated()) return;

  const sb = getSupabase();
  if (!sb) return;

  const userId = getUserId();

  try {
    const { error } = await sb.from('player_progress').upsert(
      {
        user_id: userId,
        level_id: levelId,
        stars,
        best_score: score,
        best_time: timeSec,
      },
      { onConflict: 'user_id,level_id' },
    );
    if (error) console.warn('[cloudSync] Push level failed:', error.message);

    // Update profile summary
    await _syncProfileSummary();
  } catch (err) {
    console.warn('[cloudSync] Push level error:', err);
  }
}

// ─── Sync profile summary ────────────────────────────────────────────

async function _syncProfileSummary() {
  const sb = getSupabase();
  if (!sb || !isAuthenticated()) return;

  const userId = getUserId();
  const totalStars = getTotalStars();
  const { world, level } = getHighestReached();

  await sb
    .from('profiles')
    .update({
      total_stars: totalStars,
      highest_world: world,
      highest_level: level,
    })
    .eq('id', userId);
}

// ─── Status ──────────────────────────────────────────────────────────

/** Check if a sync is in progress. */
export function isSyncing() {
  return _syncing;
}

/** Get last sync timestamp (0 if never synced). */
export function getLastSyncAt() {
  return _lastSyncAt;
}
