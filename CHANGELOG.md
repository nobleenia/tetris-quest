# Changelog

All notable changes to Stackr Quest will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-26

### Added

- **Vite build system** with hot module replacement
- **PWA support** via vite-plugin-pwa (installable, offline-capable)
- **ESLint + Prettier** configuration for code quality
- **GitHub Actions CI** pipeline (lint + build on push/PR)
- **Game Design Document** (docs/GDD.md) — full adventure mode spec
- **Level JSON schema** (src/data/levels/schema.json) — contract for level configs
- **Sample World 1 levels** (1-1 through 1-5) — tutorial levels
- **Engine constants module** (src/engine/constants.js) — centralized tuning values
- **SVG app icons** for PWA manifest
- **Apache 2.0 license**

### Changed

- **Repo structure** — migrated from flat `src/js/` to layered `src/{engine,game,ui,scenes,systems}/`
- **Entry point** — `src/main.js` replaces `src/js/main.js`, imports CSS via Vite
- **HTML** — new `index.html` with PWA meta tags, viewport-fit, theme-color
- **Branding** — renamed from "make-your-game" to "Stackr Quest"
- **README** — complete rewrite with project overview, roadmap, and structure

### Removed

- Duplicate `src/index.html` (unused older layout)
- Empty placeholder files (`actions.js`, `rules.js`)

## [0.0.1] - 2026-01-12

### Added

- Initial DOM-based falling-block game
- 10x20 board with diff-rendered typed arrays
- 7 standard tetrominoes with 4 rotation states
- DAS/ARR input handling
- Pressure system with gravity ramp
- 3 lives with top-out respawn
- Hold piece mechanic
- 4 visual themes (Modern, GameBoy, Neon, Vaporwave)
- Line clear scoring (100/300/500/800)
- Daily best timer (localStorage)
- Tetris flash + particle effects
