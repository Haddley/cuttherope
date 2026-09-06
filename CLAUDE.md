# CLAUDE.md

## What this is
A from-scratch browser tribute to *Cut the Rope*. Static site, no build step,
vanilla ES modules + Canvas 2D. Deployed via GitHub Pages at
`https://haddley.github.io/cuttherope` (repo `Haddley/cuttherope`, Pages served
from `main` branch root).

## Hard rule
No assets, code, audio or level data from the real game. Om Nom, candy, ropes and
sounds are all generated procedurally. Keep the ZeptoLab trademark disclaimer on
the title screen and in the README.

## Architecture
- `js/physics.js` — Verlet integration. `World` owns the candy point, ropes and
  gravity. Every rope's last point IS the shared `world.candy` point. `World.step`
  runs at a fixed 120 Hz substep from `game.js`.
- `js/levels.js` — 18 levels in a 720×1280 virtual coordinate space. Renderer
  letterbox-scales to the viewport; input is mapped back through `view`.
- `js/game.js` — state machine (`title` / `play` / `result`), pointer input
  (swipe = cut, tap = pop bubble / puff cushion / flip gravity), collisions,
  menus, render loop. `window.__ctr` exposes state for smoke tests.
- `js/render.js` — all drawing. `js/audio.js` — WebAudio synth.

## Testing
No unit tests. Smoke-test with Playwright against `python3 -m http.server`:
drive `window.__ctr.goto(i)` / `.state()` / `.view()`, map world→screen with
`view`, check `state().won`. Watch for `pageerror` / `console.error`.

`npm test` runs `tests/solve-levels.mjs` — the "every level is completable"
e2e suite. It flips on `window.__ctr.test` (which stops the rAF loop from
auto-stepping physics), then for each level steps the *real* `update()` a
fixed 1/120 s at a time while searching action sequences (cut / pop / puff /
flip) for one that feeds Om Nom. Fails if any level has no winning plan.
Needs a browser: `npx playwright install chromium`, or it falls back to a
system Chrome. Keep this green — a red level means a genuinely unwinnable
layout (usually the candy hanging dead-straight below its anchor so it never
swings, with Om Nom off to one side).

## Deploy
Push to `main`. Pages rebuilds automatically. `.nojekyll` is present so the
`js/` directory is served verbatim.
