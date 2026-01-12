# PERFORMANCE NOTES — make--your-game (DevTools Evidence)

This doc is used to **prove** performance targets during audit:
- rAF loop stability
- ~60 FPS (50–60+ acceptable)
- minimal paints
- minimal layers
- no layout thrash

Add screenshots to: `src/assets/screenshots/`

---

## What we measure (and why)
- **FPS / frame time (ms):** verifies smooth rendering.
- **Long tasks:** identifies frame drops and jank sources.
- **Paint flashing:** confirms we update only a small region, not repaint the whole board.
- **Layers:** confirms we aren’t accidentally promoting too many layers.

---

## In-game perf HUD
The HUD displays:
- FPS (approx)
- Frame time (ms)
- Timer / Score / Lives

This provides a quick sanity check before DevTools recordings.

---

## Chrome DevTools — Performance recording

### Steps (baseline play)
1. Open DevTools → **Performance**
2. Enable: **Screenshots** (optional)
3. Click **Record**
4. Play 10 seconds:
   - move left/right
   - rotate
   - soft drop
   - hard drop
5. Click **Stop**

### What to confirm
- FPS is stable around **50–60+**
- No frequent “Long task” blocks
- Scripting + rendering stays below ~16.7ms per frame most of the time

### Screenshot to capture
- Timeline overview showing stable frame pacing  
Save as: `src/assets/screenshots/perf-baseline.png`

---

## Chrome DevTools — Pause stability test (important)

### Steps
1. Performance → Record
2. Play 5 seconds
3. Press **Esc** to pause, wait 3 seconds
4. Press **Esc** or click Continue, play 5 seconds
5. Stop recording

### What to confirm
- rAF callback cadence continues regularly during pause
- No new jank spikes introduced by opening overlay
- Frame pacing remains consistent

### Screenshot to capture
Save as: `src/assets/screenshots/perf-pause.png`

---

## Rendering — Paint flashing (minimal paint)

### Steps
1. DevTools → **More tools** → **Rendering**
2. Enable **Paint flashing**
3. Play for 10 seconds

### What to confirm
- Only a small number of cells flash on updates
- No full-board flashes during normal play
- Pause overlay may flash once when shown/hidden (acceptable)

### Screenshot to capture
Save as: `src/assets/screenshots/paint-flashing.png`

---

## Layers — Layer count sanity check

### Steps
1. DevTools → **More tools** → **Layers**
2. Inspect while game is running and while paused

### What to confirm
- Minimal layers (board + overlay at most)
- No accidental layer explosion from per-cell `will-change` or transforms

### Screenshot to capture
Save as: `src/assets/screenshots/layers.png`

---

## Common performance pitfalls (and how we avoid them)

### Pitfall: Layout thrashing
**Symptoms:** frequent “Recalculate Style / Layout” in Performance  
**Avoidance:**
- No `getBoundingClientRect()` inside the loop
- No reading computed styles during gameplay
- Cache DOM references once

### Pitfall: Rebuilding the DOM
**Symptoms:** heavy scripting + paint spikes  
**Avoidance:**
- Board cells created once
- Diff renderer updates only changed cells (class toggles)

### Pitfall: Too many layers
**Symptoms:** compositor overhead, memory usage  
**Avoidance:**
- No `will-change` on all cells
- Minimal overlay compositing only

---

## Final evidence checklist (for audit day)
- [ ] Baseline performance recording screenshot
- [ ] Pause stability recording screenshot
- [ ] Paint flashing screenshot
- [ ] Layers screenshot
- [ ] Short notes: what was optimised + why it matters
