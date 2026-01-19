# make--your-game — DOM Tetris at 60 FPS

Single-player **Tetris** implemented using **plain JavaScript + DOM** (no canvas, no frameworks).
Built around a `requestAnimationFrame` loop and performance-first rendering (minimal paints / minimal layers).

## Features (Audit Targets)
- Animation loop uses `requestAnimationFrame`
- Smooth keyboard controls (key-hold; no spamming)
- Pause menu: Continue / Restart
- HUD: Timer, Score, Lives, FPS + frame time (ms)
- DOM diff rendering: only changed cells update

## Controls
- Move: ← / → (and A / D)
- Rotate: ↑ (and W)
- Soft drop: ↓ (and S)
- Hard drop: Space
- Pause: Esc

## Run
Open `src/index.html` in Chrome/Firefox.

## Documentation
- Audit checklist: `docs/AUDIT-CHECKLIST.md`
- Performance notes: `docs/PERFORMANCE-NOTES.md`
- Design/architecture: `docs/DESIGN.md`
