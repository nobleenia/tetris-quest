/**
 * Stackr Quest — Engine Constants
 *
 * All tunable game constants in one place.
 * These values are used by state.js and various game modules.
 */

// ─── Board Dimensions ────────────────────────────────────────────────
export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 4;
export const TOTAL_ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

// ─── Lives ───────────────────────────────────────────────────────────
export const STARTING_LIVES = 3;

// ─── Gravity / Drop ──────────────────────────────────────────────────
export const BASE_DROP_INTERVAL = 0.85; // seconds at pressure 0
export const MIN_DROP_INTERVAL = 0.1; // seconds at pressure 100
export const SOFT_DROP_MULTIPLIER = 0.08; // fraction of base interval

// ─── Pressure ────────────────────────────────────────────────────────
export const PRESSURE_RATE = 1.0; // units per second
export const PRESSURE_MAX = 100;
export const PRESSURE_REDUCTION = [0, 10, 22, 36, 52]; // per lines cleared (1-4)

// ─── Scoring ─────────────────────────────────────────────────────────
export const SCORE_TABLE = [0, 100, 300, 500, 800]; // per lines cleared (1-4)

// ─── Input ───────────────────────────────────────────────────────────
export const DAS = 0.15; // Delayed Auto Shift (seconds)
export const ARR = 0.05; // Auto Repeat Rate (seconds)

// ─── Simulation ──────────────────────────────────────────────────────
export const SIM_STEP = 1 / 60; // Fixed timestep (60 Hz)
export const DT_CLAMP = 0.05; // Max delta-time per frame (seconds)

// ─── Spawn ───────────────────────────────────────────────────────────
export const SPAWN_X = 3;

// ─── Wall Kicks ──────────────────────────────────────────────────────
export const WALL_KICKS = [0, -1, 1, -2, 2]; // Horizontal offsets to try
