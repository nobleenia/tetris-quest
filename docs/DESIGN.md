# DESIGN — make--your-game (DOM Tetris @ 60 FPS)

## Project goals
- Build a **single-player Tetris** game using **plain JavaScript + DOM**.
- Achieve smooth animation using **requestAnimationFrame** with **stable FPS** (target ~60).
- Minimise rendering cost: **minimal paints** and **minimal layers**.
- Provide required UX: **Pause (Continue/Restart)** + **HUD (Timer/Score/Lives)**.
- Avoid **canvas** and avoid **frameworks**.

---

## High-level architecture

### Modules
**Boot**
- `src/js/main.js`
  - Creates UI + initial state
  - Starts the rAF loop

**Engine**
- `src/js/engine/loop.js`
  - Owns the single `requestAnimationFrame(loop)`
  - Measures `dt` + FPS + frame time
  - Calls `update()` and `render()` (gated by pause)
- `src/js/engine/input.js`
  - Tracks key state (hold behaviour, no spamming)
  - Implements DAS/ARR-like repeat for left/right
- `src/js/engine/state.js`
  - `createInitialState()` / `resetGame()`
  - Holds the full runtime state object
- `src/js/engine/rng.js`
  - 7-bag randomiser (standard Tetris fairness)
- `src/js/engine/constants.js`
  - Grid size, tick rates, scoring, lives, timer length

**Game logic**
- `src/js/game/pieces.js`
  - Tetromino definitions and rotations (precomputed)
- `src/js/game/board.js`
  - Board representation (10×20)
  - Collision checks, locking, line clears
- `src/js/game/actions.js`
  - Movement and rotation actions
  - Hard drop, soft drop, (optional) hold
- `src/js/game/rules.js`
  - Scoring, level speed, timer, lives, end states

**UI**
- `src/js/ui/dom.js`
  - Creates the board grid once (200 cells)
  - Caches DOM references (no querySelector in hot paths)
- `src/js/ui/render.js`
  - Diff renderer: updates only changed cells
  - Applies CSS classes for cell states
- `src/js/ui/hud.js`
  - Updates timer, score, lives, fps/frame-ms
- `src/js/ui/pause.js`
  - Pause overlay toggle + button handlers

---

## Data flow (single source of truth)

