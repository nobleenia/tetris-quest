## Phase 0 — Spec + acceptance checklist (½ day)

**Deliverables:**

- 1-page README “rules + controls”

- Audit checklist mapping (copy from your prompt, ticked)  

Decisions locked:

- board size 10×20

- scoring model (lines, soft drop, hard drop)

- timer type: countdown (e.g., 3:00) or elapsed

- lives: 3

---

## Phase 1 — Engine skeleton (½–1 day)

**Deliverables:**

- requestAnimationFrame(loop) with:

    - dt measurement

    - FPS + frame ms display

    - pause gating (if paused: skip update; still render HUD)

- Input system: Set-based key holding

- Pause menu UI: Continue + Restart

Pass criteria:

- runs forever without crashing

- pause/restart works

- rAF stable (confirmed in Performance tool)

---

## Phase 2 — Board + rendering (1 day)

**Deliverables:**

- DOM board initialised once (200 cells)

- cell update function with diff rendering:

- keep prevBoard[200]

- compute nextBoard[200]

- update only changed indices

Pass criteria:

- paint flashing shows only a handful of paints per tick

- no layout thrash events in performance recording

---

## Phase 3 — Tetris mechanics (1–2 days)##

**Deliverables:**

- tetromino definitions (I, O, T, S, Z, J, L)

- spawn, movement, rotation (wall kicks: simple SRS-lite is fine)

- collision + locking

- line clear + scoring

- next piece + optional hold piece (portfolio polish)

Pass criteria:

- “works like Tetris”

- scoring increases on line clears (and optionally drops)


---

## Phase 4 — Game loop rules + HUD (1 day)

**Deliverables:**

- gravity tick accumulator (level-based speed)

- timer (countdown or elapsed)

- lives decrement on top-out + reset logic

- game end state (when lives reach 0 OR countdown hits 0)

Pass criteria:

- timer clearly works

- lives decrease properly

- restart resets state cleanly

---

## Phase 5 — Performance hardening (½–1 day)

**Deliverables:**

- ensure no per-frame DOM queries

- ensure no full-board repaint

- micro-optimisations:

    - reuse arrays (no new arrays each frame)

    - precomputed rotation states

    - avoid JSON/stringify in loop

Pass criteria (DevTools):

- stable ~60fps (50–60+ acceptable)

- no “Long task” spikes

- minimal paint and layers

---

## Phase 6 — Portfolio finish (½–1 day)

**Deliverables:**

- polished visuals (still minimal paint):

    - subtle board glow, piece colours via CSS classes

    - ghost piece (optional, computed in JS, rendered as classes)

- README screenshots + “Performance notes” section:

    - what you measured, what you optimised

- small sound effects optional (careful: can cause jank if abused)

---

**Bonus features (choose only if everything above passes)**

- **SVG**: Use SVG only for HUD icons (pause/play), not the board.

- **Async**: You don’t need async for performance here. If you want a “bonus-worthy” use:

    - preload assets with requestIdleCallback (optional)

    - or use a Web Worker for piece generation/statistics (not necessary, but nice)