# Stackr Quest — Game Design Document (GDD)

> **Version:** 0.1.0  
> **Last updated:** 2026-02-26  
> **Status:** Living document — updated as decisions are made

---

## 1. Overview

**Stackr Quest** is a mobile-first, block-stacking puzzle adventure inspired by
Candy Crush's progression model applied to classic falling-block mechanics. Players
progress through 200 levels across 10 themed worlds, each with a unique visual
identity, special block types, boss fights, and a star-rating system.

### Core Pillars

| Pillar           | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| **Accessible**   | Easy to learn, hard to master. First 5 levels teach everything   |
| **Addictive**    | "Just one more level" loop driven by progression, stars, rewards |
| **Mobile-first** | Portrait orientation, touch controls, PWA installable            |
| **Performant**   | 60 FPS on low-end Android, diff-rendered DOM, no canvas required |
| **Open-source**  | Clean architecture, documented, contribution-friendly            |

---

## 2. Game Modes

### 2.1 Adventure Mode (Primary)

- **10 Worlds × 20 Levels = 200 levels**
- Each world has a **unique visual theme** applied to all its levels
- Each level has a specific **objective** and **star rating** (1–3 stars)
- Stars gate access to later worlds
- Boss level every 20th level

### 2.2 Classic Mode

- Endless survival mode (the current game)
- No objectives — play until game over
- Separate from adventure; accessible from home screen
- Leaderboard-tracked

### 2.3 Daily Challenge

- One unique level per day, same for all players
- Global leaderboard
- Streak rewards (3-day, 7-day, 30-day)

---

## 3. Level Objectives

| ID           | Objective        | Description                                          |
| ------------ | ---------------- | ---------------------------------------------------- |
| `clearLines` | **Line Clear**   | Clear N lines (optionally within a time/piece limit) |
| `reachScore` | **Score Target** | Reach X points before time runs out                  |
| `survive`    | **Survival**     | Survive N seconds with accelerating gravity          |
| `digDown`    | **Dig Down**     | Clear pre-placed garbage to reveal a target row      |
| `comboChain` | **Combo Chain**  | Achieve a combo of N consecutive line clears         |
| `pieceLimit` | **Piece Limit**  | Complete goal using only N pieces                    |
| `clearBoard` | **Clear Board**  | Remove all blocks from the board                     |
| `timed`      | **Timed Sprint** | Clear 40 lines as fast as possible                   |

---

## 4. Star Rating System

| Stars            | Condition                                                       |
| ---------------- | --------------------------------------------------------------- |
| ⭐ (1 star)      | Objective completed                                             |
| ⭐⭐ (2 stars)   | Objective + secondary goal met (e.g., under time, fewer pieces) |
| ⭐⭐⭐ (3 stars) | Near-perfect play (thresholds defined per level)                |

Stars are cumulative across all levels. World gates require minimum total
stars to unlock. Each world earns up to 60 stars (20 levels × 3 stars).

### World Gates

| World                    | Stars Required | Max Possible at this Point |
| ------------------------ | -------------- | -------------------------- |
| World 1: "Foundation"    | 0 (unlocked)   | 0                          |
| World 2: "Retro Land"    | 20             | 60                         |
| World 3: "Coral Depths"  | 45             | 120                        |
| World 4: "Neon District" | 75             | 180                        |
| World 5: "Molten Core"   | 110            | 240                        |
| World 6: "Dreamscape"    | 150            | 300                        |
| World 7: "Thunderspire"  | 195            | 360                        |
| World 8: "Frozen Peaks"  | 245            | 420                        |
| World 9: "Starfield"     | 300            | 480                        |
| World 10: "The Nexus"    | 360            | 540                        |

**Design intent:** Players need roughly 1-star on every level to progress, but
2–3 stars on some levels rewards faster access. The gate never requires more than
~67% of available stars, so struggling players can still advance.

---

## 5. Worlds & Special Mechanics

Each world has a **unique visual theme** that applies to all 20 of its levels.
The theme is set once when the world loads (`body.className = 'style-xxx'`),
so there is no per-level theme switching — this keeps rendering simple and
bug-free.

### World 1: "Foundation" (Levels 1-1 to 1-20)

- **Visual Theme:** Modern — dark gradients, clean UI (`style-modern`)
- **New mechanics:** None — learns core controls
- **Boss (1-20):** Garbage rows push up every 8 seconds. Clear 30 lines to win.

### World 2: "Retro Land" (Levels 2-1 to 2-20)

- **Visual Theme:** GameBoy — green monochrome, pixel art, retro feel (`style-gameboy`)
- **New mechanic:** **Piece-limited challenges** — tight piece budgets force efficient stacking
- **Boss (2-20):** Piece Famine — only 30 pieces to clear 25 lines. Precision required.

### World 3: "Coral Depths" (Levels 3-1 to 3-20)

- **Visual Theme:** Deep Sea — teal/blue gradients, bubble particles, underwater ambiance (`style-deepsea`)
- **New mechanic:** **Ice Blocks** — frozen cells that require 2 line clears to remove
- **Boss (3-20):** Rising Tide — garbage pushes from bottom on accelerating timer

### World 4: "Neon District" (Levels 4-1 to 4-20)

- **Visual Theme:** Neon — glowing blocks, dark background, electric highlights (`style-neon`)
- **New mechanic:** **Speed/Combo emphasis** — multipliers for consecutive line clears
- **Boss (4-20):** Speed Demon — gravity accelerates every 10 seconds, survive + clear 20 lines

### World 5: "Molten Core" (Levels 5-1 to 5-20)

- **Visual Theme:** Volcano — red/orange lava gradients, ember particles (`style-volcano`)
- **New mechanic:** **Bomb Blocks** — explode in 3×3 area when part of a cleared line
- **Boss (5-20):** Lava Flow — random columns get stone blocks periodically

### World 6: "Dreamscape" (Levels 6-1 to 6-20)

- **Visual Theme:** Vaporwave — pastel gradients, dreamy pastels, soft glow (`style-vaporwave`)
- **New mechanic:** **Dark Blocks** — hidden until an adjacent cell is cleared
- **Boss (6-20):** Mirage — dark blocks appear in waves, clear 20 lines through the fog

### World 7: "Thunderspire" (Levels 7-1 to 7-20)

- **Visual Theme:** Storm — purple/electric, lightning flash effects (`style-storm`)
- **New mechanic:** **Stone Blocks** — immovable blocks that cannot be cleared, must build around
- **Boss (7-20):** Blackout — board goes dark periodically, only active piece visible

### World 8: "Frozen Peaks" (Levels 8-1 to 8-20)

- **Visual Theme:** Arctic — white/ice-blue palette, frost effects, snowfall (`style-arctic`)
- **New mechanic:** **Gravity Shifts** — gravity speed oscillates on a timer
- **Boss (8-20):** Avalanche — ice blocks rain from above between piece placements

### World 9: "Starfield" (Levels 9-1 to 9-20)

- **Visual Theme:** Cosmos — deep space, nebula gradients, star particles (`style-cosmos`)
- **New mechanic:** **Gravity Flip** — pieces fall upward for N seconds
- **Boss (9-20):** Zero-G — gravity flips every 8 seconds, clear 25 lines in chaos

### World 10: "The Nexus" (Levels 10-1 to 10-20)

- **Visual Theme:** Nexus — shifting/dynamic, elements from all themes combined (`style-nexus`)
- **New mechanic:** **All mechanics combined** — each level mixes 2–3 modifiers from previous worlds
- **Boss (10-20):** Final Boss — 3 escalating phases, all mechanics, the ultimate test

---

## 6. Difficulty Curve

The **sawtooth pattern** within each world:

```
Difficulty
    ▲
    │        ╱╲        BOSS
    │      ╱    ╲      ╱╲
    │    ╱   ╱╲  ╲   ╱
    │  ╱   ╱    ╲  ╲╱
    │╱   ╱        ╲
    └──────────────────────► Level
     1  3  5  8  12  15  18  20
```

| Range        | Difficulty  | Purpose                                      |
| ------------ | ----------- | -------------------------------------------- |
| Levels 1–5   | Tutorial    | Learn controls, simple clears, generous time |
| Levels 6–12  | Easy–Medium | New mechanics introduced one at a time       |
| Levels 13–17 | Medium–Hard | Combine mechanics, time pressure increases   |
| Levels 18–19 | Hard        | Requires power-ups or multiple attempts      |
| Level 20     | Boss        | Mastery test. Beating it unlocks next world  |

After each boss, the next world starts easy again (relief) before ramping.

---

## 7. Power-Ups

Activated pre-level or in-game. Single-use per level attempt. Purchased with coins.

| Power-Up        | Effect                              | Cost      |
| --------------- | ----------------------------------- | --------- |
| **Extra Time**  | +30 seconds to time limit           | 100 coins |
| **Line Blast**  | Clears the bottom 3 rows instantly  | 200 coins |
| **Piece Peek**  | Shows next 3 pieces instead of 1    | 150 coins |
| **Slow Motion** | Halves gravity for 15 seconds       | 150 coins |
| **Bomb**        | Tap a 3×3 area to clear it          | 250 coins |
| **Shuffle**     | Rearranges bottom rows to fill gaps | 200 coins |

---

## 8. Economy

### Earning Coins

| Event                    | Coins   |
| ------------------------ | ------- |
| Level complete (1 star)  | 50      |
| Level complete (2 stars) | 100     |
| Level complete (3 stars) | 150     |
| First-time clear bonus   | +50     |
| Daily challenge complete | 200     |
| Achievement unlock       | 100–500 |

### Spending Coins

| Purchase       | Cost                |
| -------------- | ------------------- |
| Power-ups      | 100–250 (see above) |
| 5 Lives refill | 300                 |
| Theme unlock   | 1_000               |

**Design intent:** Players earn 100–200 coins per level, need 2–3 levels for a
power-up. Boss levels may take 2–3 attempts — economy is felt but not
exploitative. No real-money purchases required.

---

## 9. Lives System

- **5 lives** maximum
- Failing a level costs 1 life
- Lives regenerate: **1 life per 30 minutes**
- Lives can be purchased (5 for 300 coins)
- When lives = 0: "Out of lives" modal (wait, or spend coins)

---

## 10. Progression & Persistence

### LocalStorage (offline-first)

- Stars per level
- Current world/level unlocked
- Total coins
- Power-up inventory
- Lives count + last regen timestamp
- Achievements
- Settings (volume, theme, reduced motion)

### Cloud Save (Phase 5+, Supabase)

- Sync on auth
- Conflict resolution: keep highest star count per level
- Cross-device play

---

## 11. Controls

### Keyboard

| Action          | Keys                  |
| --------------- | --------------------- |
| Move left/right | Arrow Left/Right, A/D |
| Soft drop       | Arrow Down, S         |
| Hard drop       | Arrow Up, W           |
| Rotate CW       | Numpad 3, T           |
| Rotate CCW      | Numpad 0, F           |
| Hold            | Q, Right Ctrl         |
| Pause           | Space, Escape         |

### Touch (Mobile)

| Gesture                  | Action     |
| ------------------------ | ---------- |
| Swipe left/right         | Move       |
| Swipe down               | Soft drop  |
| Swipe up / Tap           | Hard drop  |
| Rotate button (floating) | Rotate CW  |
| Hold zone tap            | Hold piece |

---

## 12. Visual Themes

Each world has its own visual theme, unlocked automatically when the player
reaches that world. Players can also apply any unlocked theme to Classic or
Daily Challenge modes.

| #   | Theme         | CSS Class         | World         | Unlock         |
| --- | ------------- | ----------------- | ------------- | -------------- |
| 1   | **Modern**    | `style-modern`    | Foundation    | Default (free) |
| 2   | **GameBoy**   | `style-gameboy`   | Retro Land    | Reach World 2  |
| 3   | **Deep Sea**  | `style-deepsea`   | Coral Depths  | Reach World 3  |
| 4   | **Neon**      | `style-neon`      | Neon District | Reach World 4  |
| 5   | **Volcano**   | `style-volcano`   | Molten Core   | Reach World 5  |
| 6   | **Vaporwave** | `style-vaporwave` | Dreamscape    | Reach World 6  |
| 7   | **Storm**     | `style-storm`     | Thunderspire  | Reach World 7  |
| 8   | **Arctic**    | `style-arctic`    | Frozen Peaks  | Reach World 8  |
| 9   | **Cosmos**    | `style-cosmos`    | Starfield     | Reach World 9  |
| 10  | **Nexus**     | `style-nexus`     | The Nexus     | Reach World 10 |

### Theme Implementation

Themes are applied by setting the `body` class to the world's CSS class.
This happens once when entering a world and persists for all levels in that
world. Each theme defines:

- Background color/gradient
- Block colors (7 piece types × unique palette)
- Board border/shadow styling
- Sidebar/HUD styling
- Optional particle/effect overlays (snow, bubbles, embers, lightning, stars)

Existing CSS already defines `style-modern`, `style-gameboy`, `style-neon`,
and `style-vaporwave`. The remaining 6 themes will be created following
the same pattern.

---

## 13. Audio Design

| Category | Count     | Notes                     |
| -------- | --------- | ------------------------- |
| **BGM**  | 12 tracks | 1 per world + menu + boss |
| **SFX**  | ~20       | See list below            |

### SFX List

- Piece move (subtle click)
- Piece rotate (whip)
- Piece lock (thud)
- Soft drop (whoosh)
- Hard drop (slam)
- Line clear × 4 (ascending chime for 1/2/3/4 lines)
- Combo tier escalation
- Level win (fanfare)
- Level fail (deflate)
- UI tap
- Star earn
- Coin earn
- Power-up activate
- Boss attack warning
- Boss defeat explosion

---

## 14. Achievements (Sample)

| Achievement    | Condition                       | Coins |
| -------------- | ------------------------------- | ----- |
| First Steps    | Complete level 1-1              | 100   |
| Stack Master   | Clear 100 total lines           | 200   |
| Perfect Clear  | 3-star any level                | 100   |
| Speed Demon    | Beat a timed level under target | 200   |
| Boss Slayer    | Defeat any boss                 | 300   |
| World Traveler | Unlock all 10 worlds            | 500   |
| Completionist  | 3-star all 200 levels           | 1000  |

---

## 15. Technical Requirements

| Requirement     | Target                              |
| --------------- | ----------------------------------- |
| Framework       | Vanilla JS (ES modules)             |
| Bundler         | Vite                                |
| PWA             | Installable, offline-capable        |
| Mobile wrap     | Capacitor (future)                  |
| Target FPS      | 60 on mid-range mobile              |
| Browser support | Chrome 90+, Safari 15+, Firefox 90+ |
| Accessibility   | WCAG 2.1 AA, reduced-motion support |
