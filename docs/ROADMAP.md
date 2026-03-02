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
- [x] Life refund on level success (adventure mode)
- [x] Winding Tetris-themed level path (snaking 3-column road layout)
- [x] Difficulty tags on levels (Hard → Impossible, boss always "Impossible")

## Phase 6 — Deployment & Final Polish

- [ ] Production build optimization (tree-shaking, minification, chunk splitting)
- [ ] SEO & meta tags (Open Graph, Twitter card, canonical URL)
- [ ] Landing page (hero, features, screenshots, CTA)
- [ ] Vercel deployment (CI/CD from main branch)
- [ ] Capacitor setup (iOS + Android shell)
- [ ] Native features (haptics, push notifications, splash screen)
- [ ] Performance audit (Lighthouse 95+ on all categories)
- [ ] Accessibility audit (WCAG 2.1 AA — keyboard nav, screen reader, contrast)
- [ ] Error tracking (Sentry integration)
- [ ] Beta testing & iteration
- [ ] Portfolio presentation (README, case study)

## Phase 7 — Backend & Cloud Services (Supabase)

- [ ] **7.1 Supabase project setup** — Create project, configure env vars, install `@supabase/supabase-js`
- [ ] **7.2 Auth system** — Anonymous sign-in (auto on first launch) + optional email/Google OAuth upgrade. Profile creation on first sign-in
- [ ] **7.3 Player profiles table** — `profiles(id, display_name, avatar_url, created_at, total_stars, highest_world, highest_level)`. Row-level security policies
- [ ] **7.4 Cloud save / progress sync** — `player_progress(user_id, level_id, stars, score, best_time)` table. Bidirectional merge: local ↔ cloud, last-write-wins with conflict UI. Auto-sync on login, manual "Sync" button in settings
- [ ] **7.5 Global leaderboards** — Tables: `leaderboard_level(level_id, user_id, score, rank)`, `leaderboard_stars(user_id, total_stars)`, `leaderboard_daily(date, user_id, score)`. Top 100 per level + overall star ranking + daily challenge board. Basic anti-cheat: server-side score plausibility checks (max theoretical score per level)
- [ ] **7.6 Daily challenge cloud storage** — Store daily seed + results server-side. Prevent replays. Show global daily ranking
- [ ] **7.7 Friends system** — Add friends by code/link. Friends leaderboard overlay on level complete. Compare stars per world
- [ ] **7.8 Share feature** — "Share" button on level complete: canvas-rendered image card (level name + stars + score + world theme). Web Share API on mobile, copy-to-clipboard fallback on desktop. Deep link back to the game

## Phase 8 — Live Ops & Engagement

- [ ] **8.1 Weekly events** — Rotating themed challenges (e.g., "Speed Week", "No-Rotate Challenge"). Event leaderboard with rewards
- [ ] **8.2 Season pass / battle pass** — Free + premium track. XP from playing levels. Cosmetic rewards (themes, particle effects, block skins)
- [ ] **8.3 Push notifications** — "Lives refilled!", "New daily challenge!", "Friend beat your score!". Opt-in with permission prompt
- [ ] **8.4 A/B testing framework** — Feature flags via Supabase remote config. Test difficulty curves, economy balance, UI variants
- [ ] **8.5 Analytics dashboard** — Track: DAU/MAU, level completion rates, drop-off points, purchase conversion, retention cohorts. PostHog or Supabase analytics

## Phase 9 — Monetization & Sustainability

- [ ] **9.1 In-app purchases** — Coin packs, life refills, power-up bundles. Stripe integration for web, IAP for native
- [ ] **9.2 Rewarded ads** — Watch ad → earn coins/extra life. AdMob for native, optional for web
- [ ] **9.3 Premium cosmetics** — Purchasable block skins, board themes, particle effects. Purely cosmetic, no pay-to-win
- [ ] **9.4 Remove ads option** — One-time purchase to disable all ads
