# Stackr Quest — Architecture

> Last updated: 2026-02-26

## Overview

Stackr Quest is a vanilla JavaScript game with a **three-layer architecture**,
bundled by Vite and deployed as a PWA.

```
┌──────────────────────────────────────────────┐
│                 index.html                    │
│            (Vite entry point)                 │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│               src/main.js                     │
│         (App bootstrap / shell)               │
└──────┬───────────┬────────────┬──────────────┘
       │           │            │
       ▼           ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Engine  │ │   Game   │ │    UI    │
│          │ │          │ │          │
│ loop.js  │ │ board.js │ │ dom.js   │
│ input.js │ │ pieces.js│ │ render.js│
│ state.js │ │ score.js │ │ hud.js   │
│controls. │ │ spawn.js │ │ pause.js │
│constants.│ │ lock.js  │ │particles.│
│          │ │ lines.js │ │stylemanag│
│          │ │pressure. │ │lifeflash.│
│          │ │ rotate.js│ │tetrisfl. │
│          │ │harddrop. │ │          │
│          │ │ hold.js  │ │          │
│          │ │ lives.js │ │          │
│          │ │dailyBest.│ │          │
└──────────┘ └──────────┘ └──────────┘
```

## Planned Architecture (Post Phase 2)

```
App Shell (src/main.js)
  ├── Scene Manager (src/scenes/)
  │     ├── Home Screen
  │     ├── World Map
  │     ├── Level Briefing
  │     ├── Game Session (parameterized engine)
  │     ├── Level Complete / Fail
  │     └── Profile / Stats
  ├── Audio Manager (src/systems/audio.js)
  ├── Progress Manager (src/systems/progress.js)
  └── Theme Manager (src/ui/stylemanager.js)
```

## Data Flow

```
Input (keyboard / touch)
  │
  ▼
Controls (DAS/ARR processing)
  │
  ▼
Game State (single mutable object)
  │
  ├── Simulation tick (60 Hz fixed timestep)
  │     ├── Pressure update
  │     ├── Movement / rotation / drop
  │     ├── Lock → line clear → score
  │     └── Spawn next piece
  │
  ▼
Board Builder (lockedBoard + active → nextBoard)
  │
  ▼
Diff Renderer (prevBoard vs nextBoard → DOM updates)
```

## Key Design Decisions

### 1. DOM Rendering (Not Canvas)

The game renders via a CSS Grid of `<div>` elements using `dataset.v`
attributes for styling. This is a deliberate portfolio choice:

- Demonstrates DOM performance optimization skills
- `contain: strict` and `will-change` prevent layout thrash
- Diff rendering ensures only changed cells are touched

### 2. Fixed Timestep Simulation

The game loop accumulates real time and processes fixed `1/60s` steps.
This decouples game logic from frame rate:

- Consistent physics regardless of display refresh rate
- Deterministic — important for replays and leaderboard validation

### 3. Typed Arrays for Board State

`Uint8Array` for board data, `Int8Array` for precomputed piece offsets.
This gives:

- Cache-friendly memory layout
- Fast `.set()` for board copying
- Efficient diff comparison (direct integer equality)

### 4. Level Config as Data

Levels are JSON files, not code. The engine reads a config and adapts:

- Objectives, constraints, gravity, starting board, modifiers
- Defined by a JSON Schema for validation
- Easy to create tooling (level editor) that outputs JSON

## File Index

| Directory          | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `src/engine/`      | Core engine: game loop, input system, state, controls, constants |
| `src/game/`        | Game logic: board, pieces, scoring, spawning, rotation, etc.     |
| `src/ui/`          | DOM creation, diff rendering, HUD, overlays, visual effects      |
| `src/scenes/`      | Screen/scene management (planned)                                |
| `src/systems/`     | Cross-cutting: progress, audio, achievements (planned)           |
| `src/data/levels/` | Level JSON configs and schema                                    |
| `src/styles/`      | CSS files                                                        |
| `src/assets/`      | Audio files, images                                              |
| `public/`          | Static assets served as-is (icons, robots.txt)                   |
| `docs/`            | Documentation                                                    |
