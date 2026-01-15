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

Input (keys) ──> Actions ──> Game State ──> Renderer ──> DOM
| ^
└──── Rules ──┘

---


- **State is numeric/data-first.** DOM is a view.
- Renderer reads state → updates DOM by diff.

---

## Timing model

### rAF loop (always running)
- The rAF loop continues even during pause to keep the browser scheduling stable.
- Pause **gates simulation** (update), not the rAF itself.

### Two clocks
1) **Frame clock** (rAF)
- Updates performance metrics and HUD at ~60 Hz.

2) **Simulation tick** (gravity)
- Uses an accumulator:
  - `acc += dt`
  - while `acc >= tickMs`: apply one gravity step, `acc -= tickMs`
- Tick speed decreases with level (faster gravity).

### Why this passes audits
- rAF cadence remains stable even when paused (no rAF stop/start spikes).
- Movement remains consistent regardless of frame rate fluctuations.

---

## Rendering strategy (DOM performance)

### Board representation
- Board is **10×20 = 200 cells**.
- Store board state as a 1D array:
  - `board[200]` where each entry is `0..7` (empty or piece id)

### DOM grid creation (once)
- Create 200 `<div class="cell">` elements once.
- Store references in an array `cells[200]`.

### Diff rendering (minimal paint)
- Keep `prevBoard[200]`.
- After simulation step, compute `nextBoard[200]` (board + active piece overlay).
- Renderer loops indices 0..199 and only updates DOM when:
  - `prevBoard[i] !== nextBoard[i]`
- DOM update is class change (e.g. `cell--t`, `cell--i`) rather than styles.

### Avoid layout thrash
- No `getBoundingClientRect()` in update loop.
- No reading computed styles.
- No changing `top/left` per frame; grid is static.

### CSS containment
- Apply to board container:
  - `contain: layout paint;`
  - isolates board rendering from rest of page.

---

## Layers strategy (minimal but not zero)

- Keep layers minimal:
  - One main board container `#board`
  - One overlay for pause `#pauseOverlay`
- Avoid `will-change` on every cell (would explode layers).
- Overlay may be composited; board remains a single paint area.
- Any optional animations must be limited and not per-cell.

---

## Controls (smooth key hold, no spamming)

- Use `keydown`/`keyup` to maintain a `Set` of pressed keys.
- Left/right movement uses DAS/ARR:
  - Immediate move on press
  - After delay (DAS), repeat at interval (ARR) while held
- Soft drop continues while held
- Hard drop is a single action on press
- Pause toggled with `Esc`

---

## Game rules (Tetris + audit “Lives”)

### Standard Tetris behaviours
- Tetromino spawn, movement, rotation
- Collision checks
- Lock on contact (with optional lock delay)
- Line clear and scoring
- Next piece queue (from 7-bag RNG)

### Lives (audit requirement)
- Player starts with **3 lives**.
- On **top-out** (cannot spawn piece):
  - `lives -= 1`
  - board resets
  - if `lives === 0` → game over (pause overlay can show end state)

### Timer
- Default: **countdown 3:00**
- On `timer <= 0` → end the game (freeze state + show overlay)

---

## Performance guardrails (non-negotiable)
- No DOM querying in the rAF loop (cache refs once).
- No per-frame allocations that scale with board size.
- No full-board rebuilds.
- Only changed cells update.
- Keep logic tight: integer maths where possible, precomputed rotations.

---

## DevTools verification plan (what you’ll capture)
- Performance recording (10–20 seconds):
  - normal play + pause + continue
  - show rAF stability
- Rendering tools:
  - Paint flashing (confirm small updates)
  - Layers (confirm minimal layers)
- Save screenshots in: `src/assets/screenshots/`
- Write notes in: `docs/PERFORMANCE-NOTES.md`
a