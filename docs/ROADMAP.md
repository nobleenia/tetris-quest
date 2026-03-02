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

- [ ] Progress manager (src/systems/progress.js)
- [ ] World map screen UI (10 worlds)
- [ ] Level briefing popup
- [ ] Level complete / fail screens
- [ ] Lives system (regeneration + purchase)
- [ ] Currency system (coins)
- [ ] Power-ups implementation
- [ ] Shop screen
- [ ] World 1 "Foundation": 20 levels with full configs
- [ ] World 2 "Retro Land": 20 levels (piece-limited challenges)
- [ ] Tutorial / onboarding overlays (levels 1-1 to 1-3)
- [ ] Achievement system

## Phase 4 — Juice, Audio & Visual Polish

- [ ] Audio engine integration (Howler.js)
- [ ] Sound effects (20+ SFX)
- [ ] Background music (per world — 12 tracks)
- [ ] 6 new CSS world themes (deepsea, volcano, storm, arctic, cosmos, nexus)
- [ ] Theme-per-world auto-switching system
- [ ] Particle system overhaul (bubbles, embers, snow, lightning, stars)
- [ ] Screen shake effects
- [ ] Score popups
- [ ] Haptic feedback (mobile)
- [ ] Animations (spawn, clear, complete)
- [ ] Reduced motion mode

## Phase 5 — Content Expansion & Social

- [ ] World 3 "Coral Depths": 20 levels — ice blocks
- [ ] World 4 "Neon District": 20 levels — speed/combo emphasis
- [ ] World 5 "Molten Core": 20 levels — bomb blocks
- [ ] World 6 "Dreamscape": 20 levels — dark blocks
- [ ] World 7 "Thunderspire": 20 levels — stone blocks
- [ ] World 8 "Frozen Peaks": 20 levels — gravity shifts
- [ ] World 9 "Starfield": 20 levels — gravity flip
- [ ] World 10 "The Nexus": 20 levels — all mechanics combined
- [ ] Daily challenge system
- [ ] Backend integration (Supabase)
- [ ] Global leaderboards
- [ ] Cloud save
- [ ] Share feature

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
