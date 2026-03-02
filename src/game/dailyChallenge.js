/**
 * Daily Challenge System
 *
 * Generates a unique, deterministic challenge each day using a seeded RNG.
 * Tracks streaks (3-day, 7-day, 30-day), best scores, and completion status.
 * Challenge parameters: objective type, target, gravity, modifiers, constraints.
 */

const STORAGE_PREFIX = 'stackr:daily';

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────
function mulberry32(seed) {
  let t = seed | 0;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Date utilities ──────────────────────────────────────────────────
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToSeed(dateStr) {
  // Simple hash of YYYY-MM-DD string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Challenge Generation ────────────────────────────────────────────
const OBJECTIVE_TYPES = ['clearLines', 'reachScore', 'survive', 'comboChain'];
const MODIFIER_POOL = ['iceBlocks', 'bombBlocks', 'darkBlocks', 'stoneBlocks', 'comboMultiplier', 'gravityShift'];
const THEMES = ['modern', 'gameboy', 'deepsea', 'neon', 'volcano', 'vaporwave', 'storm', 'arctic', 'cosmos', 'nexus'];
const THEME_CSS = ['style-modern', 'style-gameboy', 'style-deepsea', 'style-neon', 'style-volcano', 'style-vaporwave', 'style-storm', 'style-arctic', 'style-cosmos', 'style-nexus'];
const CHALLENGE_NAMES = [
  'Daily Dash', 'Block Blitz', 'Stack Attack', 'Line Rush', 'Speed Run',
  'Combo Craze', 'Survival Sprint', 'Point Pursuit', 'Power Hour', 'Quick Clear',
  'Chain Reaction', 'Pressure Test', 'Time Trial', 'Endurance Run', 'Score Chase',
];

/**
 * Generate today's daily challenge level config.
 * Deterministic — same date always produces the same challenge.
 */
export function generateDailyChallenge(dateStr = todayKey()) {
  const seed = dateToSeed(dateStr);
  const rng = mulberry32(seed);

  // Pick theme
  const themeIdx = Math.floor(rng() * THEMES.length);
  const theme = THEMES[themeIdx];
  const cssClass = THEME_CSS[themeIdx];

  // Pick objective
  const objIdx = Math.floor(rng() * OBJECTIVE_TYPES.length);
  const objType = OBJECTIVE_TYPES[objIdx];

  // Pick name
  const nameIdx = Math.floor(rng() * CHALLENGE_NAMES.length);
  const name = CHALLENGE_NAMES[nameIdx];

  // Generate difficulty (moderate — accessible but not trivial)
  const difficulty = 0.4 + rng() * 0.4; // 0.4 – 0.8 range

  let objective, constraints;
  switch (objType) {
    case 'clearLines': {
      const target = Math.round(10 + difficulty * 20); // 10-30
      objective = { type: 'clearLines', target, description: `Clear ${target} lines!` };
      const timeLimit = Math.round(90 + (1 - difficulty) * 90); // 90-180s
      constraints = { timeLimit };
      break;
    }
    case 'reachScore': {
      const target = Math.round((1000 + difficulty * 3000) / 100) * 100; // 1000-4000
      objective = { type: 'reachScore', target, description: `Score ${target.toLocaleString()} points!` };
      const timeLimit = Math.round(120 + (1 - difficulty) * 60); // 120-180s
      constraints = { timeLimit };
      break;
    }
    case 'survive': {
      const target = Math.round(60 + difficulty * 60); // 60-120s
      objective = { type: 'survive', target, description: `Survive for ${target} seconds!` };
      constraints = {};
      break;
    }
    case 'comboChain': {
      const target = Math.round(3 + difficulty * 4); // 3-7
      objective = { type: 'comboChain', target, description: `Achieve a ${target}× combo chain!` };
      constraints = { timeLimit: Math.round(120 + (1 - difficulty) * 60) };
      break;
    }
  }

  // Gravity
  const baseInterval = +(0.6 + (1 - difficulty) * 0.5).toFixed(2); // 0.6–1.1
  const minInterval = +(0.2 + (1 - difficulty) * 0.2).toFixed(2);  // 0.2–0.4
  const pressureRate = +(0.3 + difficulty * 0.8).toFixed(1);        // 0.3–1.1

  // Maybe add a modifier (50% chance)
  const modifiers = [];
  if (rng() > 0.5) {
    const modIdx = Math.floor(rng() * MODIFIER_POOL.length);
    modifiers.push(MODIFIER_POOL[modIdx]);
  }

  // Speed events for harder challenges
  const speedEvents = [];
  if (difficulty > 0.6) {
    speedEvents.push({ atSeconds: 40, newBaseInterval: +(baseInterval * 0.7).toFixed(2) });
    if (difficulty > 0.7) {
      speedEvents.push({ atSeconds: 80, newBaseInterval: +(baseInterval * 0.5).toFixed(2) });
    }
  }

  // Star thresholds
  let stars;
  switch (objType) {
    case 'clearLines':
      stars = {
        one: 'objective',
        two: { type: 'time', value: Math.round((constraints.timeLimit || 120) * 0.6) },
        three: { type: 'time', value: Math.round((constraints.timeLimit || 120) * 0.35) },
      };
      break;
    case 'reachScore':
      stars = {
        one: 'objective',
        two: { type: 'score', value: Math.round(objective.target * 1.5) },
        three: { type: 'score', value: Math.round(objective.target * 2.2) },
      };
      break;
    case 'survive':
      stars = {
        one: 'objective',
        two: { type: 'score', value: Math.round(800 + difficulty * 600) },
        three: { type: 'score', value: Math.round(1500 + difficulty * 1000) },
      };
      break;
    case 'comboChain':
      stars = {
        one: 'objective',
        two: { type: 'score', value: Math.round(1000 + difficulty * 800) },
        three: { type: 'score', value: Math.round(2000 + difficulty * 1200) },
      };
      break;
  }

  return {
    id: `daily-${dateStr}`,
    world: 0,
    level: 0,
    name,
    isDaily: true,
    dateStr,
    theme,
    cssClass,
    objective,
    constraints: Object.keys(constraints).length ? constraints : undefined,
    gravity: {
      baseInterval,
      minInterval,
      pressureRate,
    },
    modifiers: modifiers.length ? modifiers : undefined,
    speedEvents: speedEvents.length ? speedEvents : undefined,
    stars,
  };
}

// ─── Streak & Progress Tracking ──────────────────────────────────────
function loadDailyData() {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:data`);
    return raw ? JSON.parse(raw) : { completions: {}, streak: 0, lastPlayDate: null, bestStreak: 0 };
  } catch {
    return { completions: {}, streak: 0, lastPlayDate: null, bestStreak: 0 };
  }
}

function saveDailyData(data) {
  localStorage.setItem(`${STORAGE_PREFIX}:data`, JSON.stringify(data));
}

/**
 * Record a daily challenge completion.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {number} score - final score
 * @param {number} starsEarned - 1-3
 */
export function recordDailyCompletion(dateStr, score, starsEarned) {
  const data = loadDailyData();

  // Save best result for this date
  const prev = data.completions[dateStr];
  if (!prev || score > prev.score) {
    data.completions[dateStr] = { score, stars: starsEarned, completedAt: Date.now() };
  }

  // Update streak
  const today = todayKey();
  const yesterday = getYesterday();

  if (dateStr === today) {
    if (data.lastPlayDate === yesterday) {
      data.streak += 1;
    } else if (data.lastPlayDate !== today) {
      data.streak = 1;
    }
    data.lastPlayDate = today;
    data.bestStreak = Math.max(data.bestStreak, data.streak);
  }

  saveDailyData(data);
  return data;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get current daily challenge status.
 */
export function getDailyStatus() {
  const data = loadDailyData();
  const today = todayKey();
  const yesterday = getYesterday();

  // Check if streak is still active
  let activeStreak = data.streak;
  if (data.lastPlayDate && data.lastPlayDate !== today && data.lastPlayDate !== yesterday) {
    activeStreak = 0; // Streak broken
  }

  const todayResult = data.completions[today] || null;

  return {
    completedToday: !!todayResult,
    todayResult,
    streak: activeStreak,
    bestStreak: data.bestStreak || 0,
    totalCompleted: Object.keys(data.completions).length,
  };
}

/**
 * Get bonus coins for daily streak milestones.
 */
export function getStreakBonus(streak) {
  if (streak >= 30) return 100;
  if (streak >= 7) return 50;
  if (streak >= 3) return 25;
  return 10;
}
