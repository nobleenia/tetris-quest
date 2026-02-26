# Stackr Quest — Development Roadmap

> Detailed phase breakdown. See [GDD.md](GDD.md) for game design details.

## Phase 0 — Planning & Design (DONE)

- [x] Game Design Document (GDD.md)
- [x] Level JSON schema (src/data/levels/schema.json)
- [x] Sample World 1 levels (1-1 through 1-5)
- [x] Architecture documentation
- [x] Difficulty curve model
- [x] Economy balance spreadsheet (in GDD)

## Phase 1 — Repo Restructure & Modern Tooling (IN PROGRESS)

- [x] Initialize Vite project
- [x] Migrate source to new directory structure
- [x] PWA support (manifest, service worker, icons)
- [x] ESLint + Prettier configuration
- [x] GitHub Actions CI (lint + build)
- [x] Updated documentation (README, CONTRIBUTING, CHANGELOG, architecture)
- [x] Entry point rewrite (src/main.js with CSS imports)
- [x] Engine constants centralization
- [ ] Mobile-first responsive CSS overhaul
- [ ] Touch input system (src/engine/touch.js)
- [ ] Scene manager (src/scenes/manager.js)
- [ ] Hash router for navigation
- [ ] Viewport & orientation handling

## Phase 2 — Parameterized Game Engine

- [ ] Level config loader (src/game/levelConfig.js)
- [ ] Objective system (src/game/objectives.js)
- [ ] Win/lose condition evaluator
- [ ] Star rating calculator
- [ ] Starting board state loader
- [ ] Special block modifiers (ice, stone, bomb, dark)
- [ ] Gravity & speed profiles from config
- [ ] Boss level framework (src/game/boss.js)
- [ ] Classic/endless mode preservation
- [ ] Dev-mode level test harness

## Phase 3 — Progression, Map & Economy

- [ ] Progress manager (src/systems/progress.js)
- [ ] World map screen UI
- [ ] Level briefing popup
- [ ] Level complete / fail screens
- [ ] Lives system (regeneration + purchase)
- [ ] Currency system (coins)
- [ ] Power-ups implementation
- [ ] Shop screen
- [ ] World 1: 20 levels with full configs
- [ ] Tutorial / onboarding overlays (levels 1-1 to 1-3)
- [ ] Achievement system

## Phase 4 — Juice, Audio & Visual Polish

- [ ] Audio engine integration (Howler.js)
- [ ] Sound effects (20+ SFX)
- [ ] Background music (per world)
- [ ] Particle system overhaul
- [ ] Screen shake effects
- [ ] Score popups
- [ ] Haptic feedback (mobile)
- [ ] Animations (spawn, clear, complete)
- [ ] Theme system expansion (world-based unlocks)
- [ ] Reduced motion mode

## Phase 5 — Content Expansion & Social

- [ ] Worlds 2-5 level design (80 levels)
- [ ] World 2: "Deep Sea" — ice blocks
- [ ] World 3: "Volcano" — bomb blocks
- [ ] World 4: "Storm" — dark blocks
- [ ] World 5: "Cosmos" — gravity flip
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
