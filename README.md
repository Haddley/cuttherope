# Cut the Rope — Web Tribute

A touch-first, browser-native homage to ZeptoLab's physics puzzle **Cut the Rope**
(2010). Swipe to cut ropes, use bubbles, air cushions and gravity to guide the
candy into Om Nom's mouth, and sweep up three stars along the way.

**Play:** https://haddley.github.io/cuttherope

> Fan project for learning and fun. *Cut the Rope* and *Om Nom* are trademarks of
> ZeptoLab. This project contains **no original art, audio, code or level data**
> from the game — everything here is re-created from scratch (procedural vector
> graphics, a synthesised blip soundtrack, and original level layouts).

---

## How it plays

| Element | Behaviour |
| --- | --- |
| **Rope** | A fixed-length link from a peg to the candy. Swipe across it to cut. Cutting one rope hands the candy's momentum to whatever's left. |
| **Stretchy rope** (red) | Elastic. It builds tension as the candy pulls away and flings the candy hard when released — the rope reddens as tension rises. |
| **Auto rope** (dashed ring) | Snaps a fresh rope onto the candy the moment it drifts inside the ring. Re-arms once the candy leaves. |
| **Bubble** | Encapsulates the candy and floats it upward against gravity. Tap the bubble to pop it and drop the candy. |
| **Air cushion** | Tap to fire a short puff of air that pushes the candy along the nozzle direction. |
| **Gravity button** | Tap to flip gravity. Up becomes down — bubbles sink, candy falls skyward. |
| **Spikes** | Shatter the candy on contact. |
| **Stars** | Three per level. Collected by touching them with the candy. Optional, but they gate later levels. |
| **Om Nom** | Opens his mouth as the candy approaches. Feed him to win; miss and he's sad. |

18 levels across three boxes — **Cardboard** (fundamentals), **Fabric** (bubbles,
air, gravity) and **Magic** (everything combined). Progress and star counts are
saved to `localStorage`.

## The physics

The rope simulation uses **Verlet integration** — the same approach the original
game is built on:

- A rope is a chain of point masses joined by **distance constraints**.
- Each frame: integrate positions from the implicit velocity (`x - prevX`), then
  relax the constraints over several iterations.
- The **last point of every rope is the shared candy point**, so several ropes
  tugging on one candy resolve naturally through constraint iteration — producing
  believable pendulum swing, tension transfer and curved launches.
- Cutting removes a rope's constraints instantly; the candy keeps the velocity it
  already had.

Fixed 120 Hz physics substeps keep the simulation stable regardless of frame rate.

## Running locally

Pure static files — no build step.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Project layout

```
index.html      markup + screens
style.css       HUD / menu styling
js/game.js      state machine, input, collisions, level runtime, render loop
js/physics.js   Verlet points, constraints, ropes, world integration
js/levels.js    all 18 level definitions (720×1280 virtual space)
js/render.js    procedural vector drawing (Om Nom, candy, rope, FX)
js/audio.js     WebAudio blip synth
```

## Research notes

Mechanics and progression were reconstructed from:

- [Cut the Rope — Wikipedia](https://en.wikipedia.org/wiki/Cut_the_Rope_(video_game))
- [Gameplay elements — Cut the Rope Wiki](https://cuttherope.fandom.com/wiki/Gameplay_elements)
- [Cut the Rope — Cut the Rope Wiki](https://cuttherope.fandom.com/wiki/Cut_the_Rope)
- [Feeding Om Nom: tips and hints — Pocket Gamer](https://www.pocketgamer.com/cut-the-rope/feeding-om-nom-cut-the-rope-tips-and-hints/)
- [Verlet Rope in Games — toqoz.fyi](https://toqoz.fyi/game-rope.html)
