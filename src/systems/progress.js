/**
 * Stackr Quest — Progress Manager
 *
 * Tracks all persistent player progress:
 *   - Stars earned per level (adventure mode)
 *   - Current world / level unlocked
 *   - Total stars
 *   - Coins, lives, power-up inventory
 *   - Achievements
 *   - Settings
 *
 * Serialises to LocalStorage. Handles save / load / reset.
 * Single source of truth for all progression data.
 */

const STORAGE_KEY = 'stackr_progress';

/** Schema version — bump when save format changes */
const SCHEMA_VERSION = 1;

// ─── Default save shape ──────────────────────────────────────────────

function createDefaultSave() {
  return {
    version: SCHEMA_VERSION,

    // Stars per level — keyed by level id (e.g. '1-5')
    stars: {}, // { '1-1': 3, '1-2': 2, ... }

    // Best score per level
    bestScore: {}, // { '1-1': 4200, ... }

    // Retry count per level
    retries: {}, // { '1-1': 2, ... }

    // Highest world + level reached
    highestWorld: 1,
    highestLevel: 1,

    // Economy
    coins: 0,

    // Lives
    lives: 5,
    maxLives: 5,
    lastLifeRegenTimestamp: Date.now(),
    lifeRegenMs: 30 * 60 * 1000, // 30 minutes

    // Power-up inventory — count of each type owned
    powerups: {
      extraTime: 0,
      lineBlast: 0,
      piecePeek: 0,
      slowMotion: 0,
      bomb: 0,
      shuffle: 0,
    },

    // Achievements — set of unlocked achievement ids
    achievements: [],

    // Settings
    settings: {
      theme: 'modern',
      soundEnabled: true,
      musicEnabled: true,
      reducedMotion: false,
      misplacedPenalty: true,
    },

    // Classic mode best
    classicBestScore: 0,
    classicBestLines: 0,
    classicBestTimeSec: 0,

    // Stats
    totalStars: 0,
    totalLinesCleared: 0,
    totalPiecesPlaced: 0,
    totalLevelsCompleted: 0,
    totalBossesDefeated: 0,
  };
}

// ─── Singleton ───────────────────────────────────────────────────────

let _save = null;

/** Load save from LocalStorage (or create a fresh one). */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === SCHEMA_VERSION) {
        _save = { ...createDefaultSave(), ...parsed };
        // Ensure nested objects merge correctly
        _save.powerups = { ...createDefaultSave().powerups, ...parsed.powerups };
        _save.settings = { ...createDefaultSave().settings, ...parsed.settings };
        return;
      }
    }
  } catch {
    // Corrupted data — start fresh
  }
  _save = createDefaultSave();
}

/** Persist current state to LocalStorage. */
function save() {
  if (!_save) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_save));
  } catch {
    // Storage full or blocked — degrade gracefully
  }
}

/** Reset all progress. */
export function resetProgress() {
  _save = createDefaultSave();
  save();
}

// Auto-load on import
load();

// ─── Stars & levels ──────────────────────────────────────────────────

/**
 * Record a level result. Only overwrites if stars improve.
 * @param {string} levelId — e.g. '1-5'
 * @param {number} stars — 0-3
 * @param {number} score
 * @param {boolean} isFirstClear
 * @returns {{ coinsEarned: number, starsGained: number, isNewBest: boolean }}
 */
export function recordLevelResult(levelId, stars, score, isFirstClear = false) {
  if (!_save) load();

  const previousStars = _save.stars[levelId] || 0;
  const previousScore = _save.bestScore[levelId] || 0;
  let starsGained = 0;
  let isNewBest = false;

  // Only upgrade stars, never downgrade
  if (stars > previousStars) {
    starsGained = stars - previousStars;
    _save.stars[levelId] = stars;
    _save.totalStars += starsGained;
  }

  // Best score
  if (score > previousScore) {
    _save.bestScore[levelId] = score;
    isNewBest = true;
  }

  // Coins — based on stars earned THIS attempt (not cumulative)
  let coinsEarned = 0;
  if (stars >= 1) coinsEarned += 50;
  if (stars >= 2) coinsEarned += 50; // total 100
  if (stars >= 3) coinsEarned += 50; // total 150
  if (isFirstClear && previousStars === 0) coinsEarned += 50; // first-time bonus

  _save.coins += coinsEarned;
  _save.totalLevelsCompleted += 1;

  save();
  return { coinsEarned, starsGained, isNewBest };
}

/**
 * Record a level failure (increment retry counter).
 * @param {string} levelId
 */
export function recordLevelFailure(levelId) {
  if (!_save) load();
  _save.retries[levelId] = (_save.retries[levelId] || 0) + 1;
  save();
}

/** Get stars for a specific level. */
export function getLevelStars(levelId) {
  if (!_save) load();
  return _save.stars[levelId] || 0;
}

/** Get best score for a specific level. */
export function getLevelBestScore(levelId) {
  if (!_save) load();
  return _save.bestScore[levelId] || 0;
}

/** Get retry count for a specific level. */
export function getLevelRetries(levelId) {
  if (!_save) load();
  return _save.retries[levelId] || 0;
}

/** Get total stars earned across all levels. */
export function getTotalStars() {
  if (!_save) load();
  return _save.totalStars;
}

/**
 * Check if a world is unlocked based on total stars.
 * @param {number} starsNeeded — from worlds.json starsToUnlock
 */
export function isWorldUnlocked(starsNeeded) {
  if (!_save) load();
  return _save.totalStars >= starsNeeded;
}

/**
 * Get the highest world/level the player has reached.
 * @returns {{ world: number, level: number }}
 */
export function getHighestReached() {
  if (!_save) load();
  return { world: _save.highestWorld, level: _save.highestLevel };
}

/**
 * Advance the highest reached marker if this is further along.
 * @param {number} worldId
 * @param {number} levelNum
 */
export function advanceHighest(worldId, levelNum) {
  if (!_save) load();
  if (
    worldId > _save.highestWorld ||
    (worldId === _save.highestWorld && levelNum > _save.highestLevel)
  ) {
    _save.highestWorld = worldId;
    _save.highestLevel = levelNum;
    save();
  }
}

// ─── Coins ───────────────────────────────────────────────────────────

/** Get current coin balance. */
export function getCoins() {
  if (!_save) load();
  return _save.coins;
}

/**
 * Spend coins. Returns true if successful, false if insufficient.
 * @param {number} amount
 */
export function spendCoins(amount) {
  if (!_save) load();
  if (_save.coins < amount) return false;
  _save.coins -= amount;
  save();
  return true;
}

/**
 * Add coins (quest rewards, achievements, etc.).
 * @param {number} amount
 */
export function addCoins(amount) {
  if (!_save) load();
  _save.coins += amount;
  save();
}

// ─── Lives ───────────────────────────────────────────────────────────

/**
 * Get current lives (with regeneration applied).
 * @returns {{ lives: number, maxLives: number, nextRegenMs: number }}
 */
export function getLives() {
  if (!_save) load();
  _applyLifeRegen();
  const elapsed = Date.now() - _save.lastLifeRegenTimestamp;
  const nextRegenMs =
    _save.lives >= _save.maxLives ? 0 : Math.max(0, _save.lifeRegenMs - elapsed);
  return { lives: _save.lives, maxLives: _save.maxLives, nextRegenMs };
}

/**
 * Spend a life. Returns true if successful.
 */
export function spendLife() {
  if (!_save) load();
  _applyLifeRegen();
  if (_save.lives <= 0) return false;
  _save.lives -= 1;
  if (_save.lives < _save.maxLives && _save.lastLifeRegenTimestamp === 0) {
    _save.lastLifeRegenTimestamp = Date.now();
  }
  save();
  return true;
}

/**
 * Add a single life (used to refund on level success).
 * Won't exceed max lives.
 */
export function addLife() {
  if (!_save) load();
  _applyLifeRegen();
  _save.lives = Math.min(_save.maxLives, _save.lives + 1);
  // If now at max, stop regen timer
  if (_save.lives >= _save.maxLives) {
    _save.lastLifeRegenTimestamp = 0;
  }
  save();
}

/**
 * Refill all lives.
 */
export function refillLives() {
  if (!_save) load();
  _save.lives = _save.maxLives;
  _save.lastLifeRegenTimestamp = Date.now();
  save();
}

/** Internal: apply any pending life regeneration. */
function _applyLifeRegen() {
  if (_save.lives >= _save.maxLives) return;
  const now = Date.now();
  const elapsed = now - _save.lastLifeRegenTimestamp;
  const livesGained = Math.floor(elapsed / _save.lifeRegenMs);
  if (livesGained > 0) {
    _save.lives = Math.min(_save.maxLives, _save.lives + livesGained);
    _save.lastLifeRegenTimestamp = now - (elapsed % _save.lifeRegenMs);
    save();
  }
}

// ─── Power-ups ───────────────────────────────────────────────────────

/**
 * Get the player's power-up inventory.
 * @returns {object} — { extraTime: n, lineBlast: n, ... }
 */
export function getPowerups() {
  if (!_save) load();
  return { ..._save.powerups };
}

/**
 * Add a power-up to inventory.
 * @param {string} type
 * @param {number} [count=1]
 */
export function addPowerup(type, count = 1) {
  if (!_save) load();
  if (type in _save.powerups) {
    _save.powerups[type] += count;
    save();
    return true;
  }
  return false;
}

/**
 * Use a power-up (remove from inventory). Returns false if none available.
 * @param {string} type
 */
export function usePowerup(type) {
  if (!_save) load();
  if (type in _save.powerups && _save.powerups[type] > 0) {
    _save.powerups[type] -= 1;
    save();
    return true;
  }
  return false;
}

// ─── Achievements ────────────────────────────────────────────────────

/** @returns {string[]} — list of unlocked achievement ids */
export function getUnlockedAchievements() {
  if (!_save) load();
  return [..._save.achievements];
}

/**
 * Unlock an achievement. Returns true if newly unlocked.
 * @param {string} achievementId
 */
export function unlockAchievement(achievementId) {
  if (!_save) load();
  if (_save.achievements.includes(achievementId)) return false;
  _save.achievements.push(achievementId);
  save();
  return true;
}

/** Check if an achievement is unlocked. */
export function isAchievementUnlocked(achievementId) {
  if (!_save) load();
  return _save.achievements.includes(achievementId);
}

// ─── Classic mode ────────────────────────────────────────────────────

/** Record a classic mode result. */
export function recordClassicResult(score, lines, timeSec) {
  if (!_save) load();
  if (score > _save.classicBestScore) _save.classicBestScore = score;
  if (lines > _save.classicBestLines) _save.classicBestLines = lines;
  if (timeSec > _save.classicBestTimeSec) _save.classicBestTimeSec = timeSec;
  save();
}

/** @returns {{ score: number, lines: number, timeSec: number }} */
export function getClassicBest() {
  if (!_save) load();
  return {
    score: _save.classicBestScore,
    lines: _save.classicBestLines,
    timeSec: _save.classicBestTimeSec,
  };
}

// ─── Stats ───────────────────────────────────────────────────────────

/** Increment global stat counters. */
export function addStats({ lines = 0, pieces = 0, bossesDefeated = 0 } = {}) {
  if (!_save) load();
  _save.totalLinesCleared += lines;
  _save.totalPiecesPlaced += pieces;
  _save.totalBossesDefeated += bossesDefeated;
  save();
}

/** @returns {object} — all stat counters */
export function getStats() {
  if (!_save) load();
  return {
    totalStars: _save.totalStars,
    totalLinesCleared: _save.totalLinesCleared,
    totalPiecesPlaced: _save.totalPiecesPlaced,
    totalLevelsCompleted: _save.totalLevelsCompleted,
    totalBossesDefeated: _save.totalBossesDefeated,
    classicBestScore: _save.classicBestScore,
    classicBestLines: _save.classicBestLines,
    classicBestTimeSec: _save.classicBestTimeSec,
  };
}

// ─── Settings ────────────────────────────────────────────────────────

export function getSettings() {
  if (!_save) load();
  return { ..._save.settings };
}

export function updateSettings(updates) {
  if (!_save) load();
  Object.assign(_save.settings, updates);
  save();
}

// ─── Full save access (for dev harness) ──────────────────────────────

/** Get a read-only snapshot of all save data. */
export function getSaveSnapshot() {
  if (!_save) load();
  return JSON.parse(JSON.stringify(_save));
}
