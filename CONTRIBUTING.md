# Contributing to Stackr Quest

Thanks for your interest in contributing! This document covers the workflow,
conventions, and standards used in this project.

## Getting Started

```bash
git clone https://github.com/noble/stackr-quest.git
cd stackr-quest
npm install
npm run dev
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready, deployed to Vercel |
| `dev` | Integration branch for features |
| `feat/<name>` | Feature branches (branched from `dev`) |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation changes |

### Workflow

1. Branch from `dev`: `git checkout -b feat/your-feature dev`
2. Make changes, commit with conventional commits
3. Push and open a PR to `dev`
4. CI must pass (lint + build)
5. Get review and merge

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling changes |

### Scopes

`engine`, `game`, `ui`, `scenes`, `systems`, `data`, `styles`, `build`, `ci`, `docs`

### Examples

```
feat(game): add ice block modifier
fix(ui): correct touch swipe threshold on iOS
docs(gdd): update World 3 level objectives
chore(build): upgrade Vite to v7.4
```

## Code Style

- **ESLint + Prettier** — run `npm run lint` and `npm run format` before committing
- **ES modules** — use `import`/`export`, no CommonJS
- **No frameworks** — vanilla JS only
- **Meaningful names** — functions describe what they do
- **Small functions** — each does one thing
- **JSDoc comments** — for public API functions

## Definition of Done

A feature is "done" when:

- [ ] Code is written and lint-clean
- [ ] Game still runs at 60 FPS on mobile
- [ ] Build succeeds (`npm run build`)
- [ ] PR description explains the change
- [ ] No regressions in existing functionality

## File Organization

- Engine code (loop, input, state) → `src/engine/`
- Game logic (board, pieces, scoring) → `src/game/`
- UI/DOM rendering → `src/ui/`
- Screens (home, map, game, results) → `src/scenes/`
- Cross-cutting systems (progress, audio) → `src/systems/`
- Level data → `src/data/levels/`
- Stylesheets → `src/styles/`

## Questions?

Open an issue or start a discussion. We're happy to help!
