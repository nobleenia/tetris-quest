# Stackr Quest — Game Design Document (GDD)

> **Version:** 0.1.0  
> **Last updated:** 2026-02-26  
> **Status:** Living document — updated as decisions are made

---

## 1. Overview

**Stackr Quest** is a mobile-first, block-stacking puzzle adventure inspired by
Candy Crush's progression model applied to classic falling-block mechanics. Players
progress through 100+ levels across 5 themed worlds, each with unique objectives,
special block types, boss fights, and a star-rating system.

### Core Pillars

| Pillar | Description |
|---|---|
| **Accessible** | Easy to learn, hard to master. First 5 levels teach everything |
| **Addictive** | "Just one more level" loop driven by progression, stars, rewards |
| **Mobile-first** | Portrait orientation, touch controls, PWA installable |
| **Performant** | 60 FPS on low-end Android, diff-rendered DOM, no canvas required |
| **Open-source** | Clean architecture, documented, contribution-friendly |

---

## 2. Game Modes

### 2.1 Adventure Mode (Primary)

- **5 Worlds × 20 Levels = 100 levels** (expandable)
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

| ID | Objective | Description |
|---|---|---|
| `clearLines` | **Line Clear** | Clear N lines (optionally within a time/piece limit) |
| `reachScore` | **Score Target** | Reach X points before time runs out |
| `survive` | **Survival** | Survive N seconds with accelerating gravity |
| `digDown` | **Dig Down** | Clear pre-placed garbage to reveal a target row |
| `comboChain` | **Combo Chain** | Achieve a combo of N consecutive line clears |
| `pieceLimit` | **Piece Limit** | Complete goal using only N pieces |
| `clearBoard` | **Clear Board** | Remove all blocks from the board |
| `timed` | **Timed Sprint** | Clear 40 lines as fast as possible |

---

## 4. Star Rating System

| Stars | Condition |
|---|---|
| ⭐ (1 star) | Objective completed |
| ⭐⭐ (2 stars) | Objective + secondary goal met (e.g., under time, fewer pieces) |
| ⭐⭐⭐ (3 stars) | Near-perfect play (thresholds defined per level) |

Stars are cumulative across all levels. World gates require minimum total
stars to unlock.

### World Gates

| World | Stars Required |
|---|---|
| World 1: "Foundation" | 0 (unlocked) |
| World 2: "Deep Sea" | 25 |
| World 3: "Volcano" | 55 |
| World 4: "Storm" | 90 |
| World 5: "Cosmos" | 130 |

---

## 5. Worlds & Special Mechanics

### World 1: "Foundation" (Levels 1-1 to 1-20)

- **Theme:** Modern dark with clean gradients
- **New mechanics:** None — learns core controls
- **Boss (1-20):** Garbage rows push up every 8 seconds. Clear 30 lines to win.

### World 2: "Deep Sea" (Levels 2-1 to 2-20)

- **Theme:** Blue/teal underwater
- **New mechanic:** **Ice Blocks** — frozen cells that require 2 line clears to remove
- **Boss (2-20):** Rising tide — garbage pushes from bottom on accelerating timer

### World 3: "Volcano" (Levels 3-1 to 3-20)

- **Theme:** Red/orange lava
- **New mechanic:** **Bomb Blocks** — explode in 3×3 area when part of a cleared line
- **Boss (3-20):** Lava flow — random columns get stone blocks periodically

### World 4: "Storm" (Levels 4-1 to 4-20)

- **Theme:** Purple/electric
- **New mechanic:** **Dark Blocks** — hidden until an adjacent cell is cleared
- **Boss (4-20):** Blackout — board goes dark periodically, only active piece visible

### World 5: "Cosmos" (Levels 5-1 to 5-20)

- **Theme:** Space / starfield
- **New mechanic:** **Gravity Flip** — pieces fall upward for N seconds
- **Boss (5-20):** Final boss — all mechanics combined, 3 escalating phases

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

| Range | Difficulty | Purpose |
|---|---|---|
| Levels 1–5 | Tutorial | Learn controls, simple clears, generous time |
| Levels 6–12 | Easy–Medium | New mechanics introduced one at a time |
| Levels 13–17 | Medium–Hard | Combine mechanics, time pressure increases |
| Levels 18–19 | Hard | Requires power-ups or multiple attempts |
| Level 20 | Boss | Mastery test. Beating it unlocks next world |

After each boss, the next world starts easy again (relief) before ramping.

---

## 7. Power-Ups

Activated pre-level or in-game. Single-use per level attempt. Purchased with coins.

| Power-Up | Effect | Cost |
|---|---|---|
| **Extra Time** | +30 seconds to time limit | 100 coins |
| **Line Blast** | Clears the bottom 3 rows instantly | 200 coins |
| **Piece Peek** | Shows next 3 pieces instead of 1 | 150 coins |
| **Slow Motion** | Halves gravity for 15 seconds | 150 coins |
| **Bomb** | Tap a 3×3 area to clear it | 250 coins |
| **Shuffle** | Rearranges bottom rows to fill gaps | 200 coins |

---

## 8. Economy

### Earning Coins

| Event | Coins |
|---|---|
| Level complete (1 star) | 50 |
| Level complete (2 stars) | 100 |
| Level complete (3 stars) | 150 |
| First-time clear bonus | +50 |
| Daily challenge complete | 200 |
| Achievement unlock | 100–500 |

### Spending Coins

| Purchase | Cost |
|---|---|
| Power-ups | 100–250 (see above) |
| 5 Lives refill | 300 |
| Theme unlock | 1_000 |

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

| Action | Keys |
|---|---|
| Move left/right | Arrow Left/Right, A/D |
| Soft drop | Arrow Down, S |
| Hard drop | Arrow Up, W |
| Rotate CW | Numpad 3, T |
| Rotate CCW | Numpad 0, F |
| Hold | Q, Right Ctrl |
| Pause | Space, Escape |

### Touch (Mobile)

| Gesture | Action |
|---|---|
| Swipe left/right | Move |
| Swipe down | Soft drop |
| Swipe up / Tap | Hard drop |
| Rotate button (floating) | Rotate CW |
| Hold zone tap | Hold piece |

---

## 12. Visual Themes

Unlockable themes per world (earned by 3-starring all levels in a world):

1. **Modern** (default) — dark gradients, clean
2. **GameBoy** — green pixel art, retro
3. **Neon** — glowing blocks, dark background
4. **Vaporwave** — pastel gradients, dreamy
5. **Deep Sea** — World 2 unlock
6. **Volcano** — World 3 unlock
7. **Storm** — World 4 unlock
8. **Cosmos** — World 5 unlock

---

## 13. Audio Design

| Category | Count | Notes |
|---|---|---|
| **BGM** | 7 tracks | 1 per world + menu + boss |
| **SFX** | ~20 | See list below |

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

| Achievement | Condition | Coins |
|---|---|---|
| First Steps | Complete level 1-1 | 100 |
| Stack Master | Clear 100 total lines | 200 |
| Perfect Clear | 3-star any level | 100 |
| Speed Demon | Beat a timed level under target | 200 |
| Boss Slayer | Defeat any boss | 300 |
| World Traveler | Unlock all 5 worlds | 500 |
| Completionist | 3-star all 100 levels | 500 |

---

## 15. Technical Requirements

| Requirement | Target |
|---|---|
| Framework | Vanilla JS (ES modules) |
| Bundler | Vite |
| PWA | Installable, offline-capable |
| Mobile wrap | Capacitor (future) |
| Target FPS | 60 on mid-range mobile |
| Browser support | Chrome 90+, Safari 15+, Firefox 90+ |
| Accessibility | WCAG 2.1 AA, reduced-motion support |
