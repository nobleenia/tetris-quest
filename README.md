# Stackr Quest

> A mobile-first, block-stacking puzzle adventure with 100+ levels, boss fights,
> power-ups, and progression — built with vanilla JavaScript and zero frameworks.

[![CI](https://github.com/noble/stackr-quest/actions/workflows/ci.yml/badge.svg)](https://github.com/noble/stackr-quest/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## What Is This?

Stackr Quest takes classic falling-block gameplay and wraps it in a
Candy Crush-style adventure. Players progress through **5 themed worlds**,
each with **20 levels** featuring unique objectives (line clears, score targets,
survival, combo chains, dig-down), **special block types** (ice, bomb, dark,
gravity-flip), and **boss fights**.

### Key Features

- **Adventure Mode** — 100+ levels with star ratings and world progression
- **Classic Mode** — endless survival for purists
- **Daily Challenges** — one unique level per day with global leaderboard
- **Power-ups & Economy** — earn coins, buy abilities, manage lives
- **Mobile-first** — touch controls, portrait layout, PWA installable
- **4+ Visual Themes** — Modern, GameBoy, Neon, Vaporwave (+ unlockables)
- **60 FPS** — diff-rendered DOM, typed arrays, no canvas required
- **Offline-capable** — full PWA with service worker

## Quick Start

```bash
# Clone
git clone https://github.com/noble/stackr-quest.git
cd stackr-quest

# Install
npm install

# Dev server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES modules) |
| Bundler | [Vite](https://vitejs.dev/) |
| PWA | [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) |
| Linting | ESLint + Prettier |
| CI | GitHub Actions |
| Hosting | Vercel |
| Mobile App | Capacitor (planned) |

## Project Structure

```
stackr-quest/
├── index.html              # Vite entry point
├── vite.config.js          # Build config + PWA
├── public/                 # Static assets (served as-is)
│   ├── favicon.svg
│   ├── robots.txt
│   └── icons/              # PWA icons
├── src/
│   ├── main.js             # App bootstrap
│   ├── engine/             # Core engine (loop, input, state, controls)
│   ├── game/               # Game logic (board, pieces, scoring, etc.)
│   ├── ui/                 # DOM rendering, HUD, overlays, effects
│   ├── scenes/             # Scene manager + screens (planned)
│   ├── systems/            # Progress, audio, achievements (planned)
│   ├── data/
│   │   └── levels/         # Level JSON configs + schema
│   ├── styles/             # CSS (base, board, HUD, overlay)
│   └── assets/             # Audio, images
├── docs/                   # Architecture, GDD, design docs
└── .github/workflows/      # CI pipeline
```

## Controls

### Keyboard

| Action | Keys |
|---|---|
| Move left / right | Arrow keys / `A` `D` |
| Soft drop | `Down Arrow` / `S` |
| Hard drop | `Up Arrow` / `W` |
| Rotate CW | `Numpad 3` / `T` |
| Rotate CCW | `Numpad 0` / `F` |
| Hold | `Q` / `Right Ctrl` |
| Pause | `Space` / `Escape` |

### Touch (Planned)

| Gesture | Action |
|---|---|
| Swipe left / right | Move |
| Swipe down | Soft drop |
| Swipe up / Tap | Hard drop |
| Rotate button | Rotate CW |
| Hold zone tap | Hold piece |

## Development

```bash
npm run dev          # Start dev server on :3000
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run build        # Production build -> dist/
```

## Roadmap

See [docs/GDD.md](docs/GDD.md) for the full game design document.

| Phase | Status | Description |
|---|---|---|
| **Phase 0** | Done | Planning, GDD, level schema, wireframes |
| **Phase 1** | In Progress | Repo restructure, Vite, PWA, touch controls, scene manager |
| **Phase 2** | Planned | Parameterized engine, objectives, modifiers, boss framework |
| **Phase 3** | Planned | World map, 20 levels, shop, lives, power-ups, progress saving |
| **Phase 4** | Planned | Audio, particles, haptics, animations, themes |
| **Phase 5** | Planned | 100 levels, 5 worlds, daily challenges, leaderboards |
| **Phase 6** | Planned | Deploy, Capacitor app, polish, portfolio-ready |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[Apache License 2.0](LICENSE)
