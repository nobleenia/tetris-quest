# make--your-game — Audit Checklist (DOM Tetris, 60 FPS)

This document maps the **audit requirements** to **where/how** they are implemented and **how to verify** them in DevTools.

Project: **make--your-game**  
Game: **Tetris (single-player)**  
Tech: **Plain JavaScript + DOM (no canvas, no frameworks)**

---

## Functional

### Try playing the game
**Requirement:** Does the game run without crashing?  
- **Implementation:** Defensive state machine + bounded updates; no layout reads in the loop; minimal allocations.  
- **Where:** `src/js/engine/state.js`, `src/js/engine/loop.js`, `src/js/game/*`  
- **Verify:** Play for 3–5 minutes, rotate/move/drop repeatedly, pause/unpause, restart. No errors in Console.

---

### Animation loop
**Requirement:** Does animation run using RequestAnimationFrame?  
- **Implementation:** Single `requestAnimationFrame(loop)` that runs continuously.  
- **Where:** `src/js/engine/loop.js` (called from `src/js/main.js`)  
- **Verify:** In DevTools Performance recording, confirm frequent rAF callbacks and stable frame cadence.

---

### Single-player
**Requirement:** Is the game single player?  
- **Implementation:** One active board + one active player input stream.  
- **Where:** `src/js/engine/state.js`, `src/js/game/rules.js`  
- **Verify:** No multiplayer UI/state; only one board instance.

---

### No canvas
**Requirement:** Does the game avoid the use of canvas?  
- **Implementation:** Board is a DOM grid (200 div cells). Rendering via class updates/diff.  
- **Where:** `src/index.html`, `src/js/ui/dom.js`, `src/js/ui/render.js`  
- **Verify:** Search repository for `<canvas>` / `getContext(` → none.

---

### No frameworks
**Requirement:** Does the game avoid the use of frameworks?  
- **Implementation:** No React/Vue/etc. No third-party libraries.  
- **Where:** Entire repo  
- **Verify:** No `package.json`; no CDN framework imports in `index.html`.

---

### Pre-approved list
**Requirement:** Is the game chosen from the pre-approved list?  
- **Implementation:** Tetris ruleset: falling tetrominoes, rotation, line clears, scoring.  
- **Where:** `src/js/game/pieces.js`, `src/js/game/board.js`, `src/js/game/rules.js`  
- **Verify:** Gameplay matches Tetris.

---

## Pause menu

### Pause while running
**Requirement:** Try pausing the game while it is running. Does it display Continue/Restart?  
- **Implementation:** Pause overlay toggled with `Esc`, buttons bound to actions.  
- **Where:** `src/js/ui/pause.js`, `src/styles/overlay.css`  
- **Verify:** Press `Esc` mid-game → overlay shows **Continue** and **Restart**.

---

### Continue
**Requirement:** Pause, choose Continue. Does the game continue?  
- **Implementation:** `paused=true` gates simulation updates, but rAF continues. Continue sets `paused=false`.  
- **Where:** `src/js/engine/loop.js`, `src/js/ui/pause.js`  
- **Verify:** Press `Esc`, click Continue → piece continues falling, input works.

---

### Restart
**Requirement:** Pause, choose Restart. Does the game restart?  
- **Implementation:** Reset state (board, score, timer, lives) to initial values.  
- **Where:** `src/js/engine/state.js` (`resetGame()`), `src/js/ui/pause.js`  
- **Verify:** Click Restart → board clears, new piece spawns, HUD resets.

---

### Pause performance stability
**Requirement:** Record Performance while pausing. Confirm no dropped frames and rAF unaffected.  
- **Implementation:** rAF loop is never stopped; pause only disables simulation step.  
- **Where:** `src/js/engine/loop.js`  
- **Verify (DevTools):**
  1. Start recording
  2. Play 5–10 seconds
  3. Press `Esc` (pause), wait 5 seconds, Continue
  4. Stop recording  
  Confirm rAF callbacks remain regular; frame time stays stable.

---

## Controls (smooth key hold)

### Obey commands
**Requirement:** Moving/rotating works via keyboard.  
- **Implementation:** Key state Set + action dispatcher; no click controls required.  
- **Where:** `src/js/engine/input.js`, `src/js/game/actions.js`  
- **Verify:** Left/right moves; rotate; soft drop; hard drop; pause.

---

### No spamming required
**Requirement:** Player moves without spamming the key.  
- **Implementation:** Key-hold handling (DAS/ARR style repeat).  
- **Where:** `src/js/engine/input.js`  
- **Verify:** Hold Left/Right → continuous movement at controlled repeat rate.

---

## Correct gameplay behaviour (Tetris)

### Works like Tetris
**Requirement:** Does the game work like it should (as Tetris)?  
- **Implementation:** Tetrominoes, collision, lock, line clear, spawn, top-out.  
- **Where:** `src/js/game/board.js`, `src/js/game/pieces.js`, `src/js/game/rules.js`  
- **Verify:** Lines clear when full; pieces lock; game progresses.

---

## HUD (timer / score / lives)

### Timer
**Requirement:** Does the countdown/timer clock work?  
- **Implementation:** Timer tracked in state; updated from rAF loop with accumulated time.  
- **Where:** `src/js/game/rules.js`, `src/js/ui/hud.js`, `src/js/engine/loop.js`  
- **Verify:** Timer counts down (or up, if configured) consistently, including after pause/continue.

---

### Score
**Requirement:** Score increases at a certain action.  
- **Implementation:** Points awarded on line clears; optional points for soft/hard drops.  
- **Where:** `src/js/game/rules.js`  
- **Verify:** Clear a line → score increases; more lines at once → bigger increase.

---

### Lives
**Requirement:** Lives decrease when losing a life.  
- **Implementation (Tetris adaptation):** Player starts with **3 lives**. On **top-out**, lives–1 and board resets.  
- **Where:** `src/js/game/rules.js`, `src/js/engine/state.js`  
- **Verify:** Intentionally top out → lives decreases by 1; game resets board; at 0 lives → game over.

---

## Performance

### No frame drops
**Requirement:** Confirm there are no frame drops.  
- **Implementation:** DOM diff renderer; no layout reads; minimal DOM writes; reuse arrays.  
- **Where:** `src/js/ui/render.js`, `src/js/game/board.js`, `src/js/engine/loop.js`  
- **Verify (DevTools Performance):** No long tasks; frame time mostly < 16.7ms during play.

---

### 60 FPS (50–60+ acceptable)
**Requirement:** Game runs at/or around 60fps.  
- **Implementation:** rAF loop + minimal work per frame; simulation tick decoupled from render.  
- **Where:** `src/js/engine/loop.js`  
- **Verify:** HUD shows FPS (approx); DevTools FPS meter stable around 50–60+.

---

### Paint used as little as possible
**Requirement:** With paint flashing on, confirm paint is minimal.  
- **Implementation:** Only changed cells update class; board isolated with CSS `contain`; avoid triggering layout.  
- **Where:** `src/js/ui/render.js`, `src/styles/board.css`  
- **Verify (DevTools Rendering → Paint flashing):** Only small cell updates flash, not full board.

---

### Layers minimal & properly promoted
**Requirement:** Confirm layers used as little as possible; proper promotion.  
- **Implementation:** No per-cell `will-change`; only overlay may be composited; board remains a single container.  
- **Where:** CSS files (`board.css`, `overlay.css`)  
- **Verify (DevTools Layers):** Very few layers (board + overlay at most). No accidental layer explosion.

---

## Bonus

### Runs quickly & effectively
- **Targets:** Avoid unnecessary data requests; avoid recursion in hot paths unless proven faster; keep loops tight.
- **How:** Precomputed rotations, 7-bag RNG, board arrays reused, diff rendering.
- **Where:** `src/js/game/pieces.js`, `src/js/engine/rng.js`, `src/js/ui/render.js`

### Good practices
- **Targets:** Small modules, pure functions where possible, clear naming, no magic numbers (constants file).
- **Where:** `src/js/engine/constants.js`, module separation

### Reuse memory to avoid jank
- **Targets:** Reuse typed/regular arrays for board; reuse “next frame” buffers; avoid per-frame allocations.
- **Where:** `src/js/game/board.js`, `src/js/ui/render.js`

### SVG (optional)
- **Suggestion:** SVG icons in HUD only (pause/play/restart), not for board rendering.
- **Where:** `src/assets/icons/`

### Asynchronicity (optional)
- **Suggestion:** Use `requestIdleCallback` for non-critical tasks (stats, screenshots, preloading).
- **Where:** `src/js/engine/loop.js` (optional feature flag)

### Overall quality
- **What “well done” looks like:** stable FPS, clean pause, minimal paints/layers, readable modules, and clear docs.
- **Evidence:** `docs/PERFORMANCE-NOTES.md` with DevTools screenshots + brief interpretation.

---
