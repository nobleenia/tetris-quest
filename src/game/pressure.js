export function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// Map pressure 0..100 to gravity interval base..min
export function gravityIntervalFromPressure(state) {
  const p = clamp(state.pressure, 0, 100) / 100;
  // linear mapping (simple). Later we can use curve for nicer feel.
  return state.baseInterval + (state.minInterval - state.baseInterval) * p;
}

// Update pressure over time (dt in seconds)
export function tickPressure(state, dt) {
  state.pressure = clamp(state.pressure + dt * state.pressureRate, 0, 100);
}

// Reduce pressure after clearing lines
export function reducePressureOnClear(state, linesCleared) {
  if (linesCleared <= 0) return;
  // Tune: 1 line = -10, 2 lines = -22, 3 = -36, 4 = -52
  const table = [0, 10, 22, 36, 52];
  const dec = table[linesCleared] ?? linesCleared * 12;
  state.pressure = clamp(state.pressure - dec, 0, 100);
}
