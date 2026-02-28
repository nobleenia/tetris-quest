function todayKey() {
  // Local date YYYY-MM-DD
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function storageKey() {
  return `make-your-game:dailyBest:${todayKey()}`;
}

export function loadDailyBestSec() {
  const raw = localStorage.getItem(storageKey());
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function saveDailyBestSec(seconds) {
  const sec = Math.max(0, Math.floor(seconds));
  localStorage.setItem(storageKey(), String(sec));
  return sec;
}

// Call this when a run ends (life lost / restart / game over)
export function updateDailyBest(state) {
  const current = Math.floor(state.elapsedSec);
  const best = loadDailyBestSec();
  if (current > best) return saveDailyBestSec(current);
  return best;
}
