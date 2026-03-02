# Stackr Quest — Development Roadmap

> Detailed phase breakdown. See [GDD.md](GDD.md) for game design details.

## Phase 0 — Planning & Design (DONE)

- [x] Game Design Document (GDD.md)
- [x] Level JSON schema (src/data/levels/schema.json)
- [x] Sample World 1 levels (1-1 through 1-5)
- [x] Architecture documentation
- [x] Difficulty curve model
- [x] Economy balance spreadsheet (in GDD)

## Phase 1 — Repo Restructure & Modern Tooling (DONE)

- [x] Initialize Vite project
- [x] Migrate source to new directory structure
- [x] PWA support (manifest, service worker, icons)
- [x] ESLint + Prettier configuration
- [x] GitHub Actions CI (lint + build)
- [x] Updated documentation (README, CONTRIBUTING, CHANGELOG, architecture)
- [x] Entry point rewrite (src/main.js with CSS imports)
- [x] Engine constants centralization
- [x] Mobile-first responsive CSS overhaul
- [x] Touch input system (src/engine/touch.js)
- [x] Scene manager (src/scenes/manager.js)
- [x] Hash router for navigation
- [x] Viewport & orientation handling

## Phase 2 — Parameterized Game Engine (DONE)

- [x] Level config loader (src/game/levelConfig.js)
- [x] Objective system (src/game/objectives.js)
- [x] Win/lose condition evaluator
- [x] Star rating calculator (src/game/stars.js)
- [x] Starting board state loader
- [x] Special block modifiers — ice, stone, bomb, dark (src/game/modifiers.js)
- [x] Gravity & speed profiles from config
- [x] Boss level framework (src/game/boss.js)
- [x] Classic/endless mode preservation
- [x] Game session manager (src/game/session.js)
- [x] 7-bag piece randomizer (src/game/bag.js)
- [x] Dev-mode level test harness (src/game/devHarness.js)

## Phase 3 — Progression, Map & Economy

- [x] Progress manager (src/systems/progress.js)
- [x] World map screen UI (10 worlds)
- [x] Level briefing popup
- [x] Level complete / fail screens
- [x] Lives system (regeneration + purchase)
- [x] Currency system (coins)
- [x] Power-ups implementation
- [x] Shop screen
- [x] World 1 "Foundation": 20 levels with full configs
- [x] World 2 "Retro Land": 20 levels (piece-limited challenges)
- [x] Tutorial / onboarding overlays (levels 1-1 to 1-3)
- [x] Achievement system

## Phase 4 — Juice, Audio & Visual Polish

- [x] Audio engine integration (Tone.js)
- [x] Sound effects (20+ SFX)
- [x] Background music (per world — 10 procedural themes)
- [x] 6 new CSS world themes (deepsea, volcano, storm, arctic, cosmos, nexus)
- [x] Theme-per-world auto-switching system
- [x] Particle system overhaul (bubbles, embers, snow, lightning, stars)
- [x] Screen shake effects
- [x] Score popups
- [x] Haptic feedback (mobile)
- [x] Animations (spawn, clear, complete)
- [x] Reduced motion mode

## Phase 5 — Content Expansion & Social

- [x] World 3 "Coral Depths": 20 levels — ice blocks
- [x] World 4 "Neon District": 20 levels — speed/combo emphasis
- [x] World 5 "Molten Core": 20 levels — bomb blocks
- [x] World 6 "Dreamscape": 20 levels — dark blocks
- [x] World 7 "Thunderspire": 20 levels — stone blocks
- [x] World 8 "Frozen Peaks": 20 levels — gravity shifts
- [x] World 9 "Starfield": 20 levels — gravity flip
- [x] World 10 "The Nexus": 20 levels — all mechanics combined
- [x] Daily challenge system
- [ ] Backend integration (Firebase / Supabase) — planned Phase 7
- [ ] Global leaderboards — planned Phase 7
- [ ] Cloud save — planned Phase 7
- [ ] Share feature — planned Phase 7

## Phase 6 — Deployment & Final Polish

- [ ] Production build optimization
- [ ] SEO & meta tags
- [ ] Landing page
- [ ] Vercel deployment
- [ ] Capacitor setup (iOS + Android)
- [ ] Native features (haptics, push notifications)
- [ ] Performance audit (Lighthouse 95+)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Error tracking (Sentry)
- [ ] Beta testing & iteration
- [ ] Portfolio presentation (README, case study)
