/**
 * Stackr Quest — Level Config Loader
 *
 * Loads world/level JSON data and applies it to the game state.
 * Handles gravity profiles, starting boards, constraints, and modifiers.
 */

import {
  VISIBLE_ROWS,
  BASE_DROP_INTERVAL,
  MIN_DROP_INTERVAL,
  PRESSURE_RATE,
  STARTING_LIVES,
} from '../engine/constants.js';

// ─── World Data Cache ────────────────────────────────────────────────
const worldCache = new Map();

/**
 * Load a world's level data. Caches after first fetch.
 * @param {number} worldId — 1–10
 * @returns {Promise<object>} — the parsed world JSON
 */
export async function loadWorldData(worldId) {
  if (worldCache.has(worldId)) return worldCache.get(worldId);

  const url = new URL(`../data/levels/world-${worldId}.json`, import.meta.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load world ${worldId}: ${res.status}`);

  const data = await res.json();
  worldCache.set(worldId, data);
  return data;
}

/**
 * Get a specific level config from a world.
 * @param {object} worldData — parsed world JSON
 * @param {number} levelNum — 1–20
 * @returns {object|null} — level config or null if not found
 */
export function getLevelConfig(worldData, levelNum) {
  return worldData.levels?.find((l) => l.level === levelNum) ?? null;
}

/**
 * Load a single level config by world + level number.
 * @param {number} worldId
 * @param {number} levelNum
 * @returns {Promise<object>}
 */
export async function loadLevel(worldId, levelNum) {
  const world = await loadWorldData(worldId);
  const level = getLevelConfig(world, levelNum);
  if (!level) throw new Error(`Level ${worldId}-${levelNum} not found`);
  return { world, level };
}

// ─── Apply Config to State ───────────────────────────────────────────

/**
 * Apply a level config to the game state, overriding defaults.
 * Call this after resetGame() and before the first spawn.
 *
 * @param {object} state — mutable game state
 * @param {object} levelCfg — single level config from JSON
 * @param {object} worldCfg — parent world config (for theme, modifiers)
 */
export function applyLevelConfig(state, levelCfg, worldCfg = {}) {
  // ── Mode flag ──
  state.mode = 'adventure';
  state.levelId = levelCfg.id;
  state.worldId = levelCfg.world;
  state.levelNum = levelCfg.level;

  // ── Gravity ──
  const g = levelCfg.gravity ?? {};
  state.baseInterval = g.baseInterval ?? BASE_DROP_INTERVAL;
  state.minInterval = g.minInterval ?? MIN_DROP_INTERVAL;
  state.pressureRate = g.pressureRate ?? PRESSURE_RATE;
  state.dropInterval = state.baseInterval;
  state.speedEvents = g.speedEvents ?? [];
  state.speedEventIdx = 0;

  // ── Constraints ──
  const c = levelCfg.constraints ?? {};
  state.timeLimit = c.timeLimit ?? 0; // 0 = no limit
  state.pieceLimit = c.pieceLimit ?? 0; // 0 = no limit
  state.levelLives = c.lives ?? 1; // lives within a level attempt
  state.lives = STARTING_LIVES; // global lives (meta)

  // ── Objective ──
  state.objective = { ...levelCfg.objective };
  state.objectiveComplete = false;
  state.objectiveFailed = false;

  // ── Star thresholds ──
  state.starConfig = levelCfg.stars ?? null;

  // ── Modifiers ──
  state.modifiers = levelCfg.modifiers ?? [];
  // Inherit world mechanic if not already listed
  if (worldCfg.mechanic && !state.modifiers.includes(worldCfg.mechanic)) {
    state.modifiers.push(worldCfg.mechanic);
  }

  // ── Boss ──
  state.boss = levelCfg.boss ?? null;
  state.bossHP = state.boss?.hp ?? 0;
  state.bossPhaseIdx = 0;
  state.bossAttackTimer = 0;

  // ── Tracking counters ──
  state.pieceCount = 0;
  state.linesCleared = 0;
  state.combo = 0;
  state.maxCombo = 0;

  // ── Starting board ──
  if (levelCfg.startingBoard) {
    applyStartingBoard(state, levelCfg.startingBoard);
  }
}

/**
 * Apply starting board state from level config.
 * Supports both explicit rows and random garbage rows.
 *
 * @param {object} state
 * @param {object} boardCfg — { rows?: number[][], garbageRows?: number }
 */
export function applyStartingBoard(state, boardCfg) {
  const { cols, rows: totalRows } = state;

  // Explicit rows (bottom-up array of 10-cell rows)
  if (boardCfg.rows && boardCfg.rows.length > 0) {
    const rowData = boardCfg.rows;
    for (let i = 0; i < rowData.length; i++) {
      const boardY = totalRows - 1 - i; // bottom-up
      for (let x = 0; x < cols; x++) {
        state.lockedBoard[boardY * cols + x] = rowData[i][x] ?? 0;
      }
    }
  }

  // Random garbage rows
  if (boardCfg.garbageRows && boardCfg.garbageRows > 0) {
    const garbageCount = Math.min(boardCfg.garbageRows, VISIBLE_ROWS - 2);
    for (let i = 0; i < garbageCount; i++) {
      const boardY = totalRows - 1 - i;
      const gapX = Math.floor(Math.random() * cols);
      for (let x = 0; x < cols; x++) {
        if (x === gapX) continue; // one gap per row
        // Random piece color (1-7)
        state.lockedBoard[boardY * cols + x] = Math.floor(Math.random() * 7) + 1;
      }
    }
  }
}

/**
 * Configure state for classic / endless mode (no level, no objectives).
 * Preserves backward compatibility with the current game.
 *
 * @param {object} state
 */
export function applyClassicConfig(state) {
  state.mode = 'classic';
  state.levelId = null;
  state.worldId = null;
  state.levelNum = null;

  state.baseInterval = BASE_DROP_INTERVAL;
  state.minInterval = MIN_DROP_INTERVAL;
  state.pressureRate = PRESSURE_RATE;
  state.dropInterval = state.baseInterval;
  state.speedEvents = [];
  state.speedEventIdx = 0;

  state.timeLimit = 0;
  state.pieceLimit = 0;
  state.levelLives = 0;

  state.objective = null;
  state.objectiveComplete = false;
  state.objectiveFailed = false;
  state.starConfig = null;

  state.modifiers = [];
  state.boss = null;
  state.bossHP = 0;
  state.bossPhaseIdx = 0;
  state.bossAttackTimer = 0;

  state.pieceCount = 0;
  state.linesCleared = 0;
  state.combo = 0;
  state.maxCombo = 0;
}

/**
 * Apply scheduled speed events based on elapsed time.
 * Call this each tick to check if a speed event should trigger.
 *
 * @param {object} state
 */
export function tickSpeedEvents(state) {
  const events = state.speedEvents;
  if (!events || events.length === 0) return;

  while (
    state.speedEventIdx < events.length &&
    state.elapsedSec >= events[state.speedEventIdx].atSeconds
  ) {
    const evt = events[state.speedEventIdx];
    state.baseInterval = evt.newBaseInterval;
    state.speedEventIdx++;
  }
}

/** Clear the world data cache (useful for testing). */
export function clearWorldCache() {
  worldCache.clear();
}
