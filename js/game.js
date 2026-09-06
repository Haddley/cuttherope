import { World, segIntersect } from "./physics.js";
import { LEVELS, W, H, boxNumber } from "./levels.js";
import * as R from "./render.js";
import { sfx } from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const titleScreen = document.getElementById("title-screen");
const levelSelect = document.getElementById("level-select");
const resultScreen = document.getElementById("result-screen");
const levelGrid = document.getElementById("level-grid");
const hud = document.getElementById("hud");
const levelLabel = document.getElementById("level-label");
const hintEl = document.getElementById("hint");

// ---------------------------------------------------------------- progress
const SAVE_KEY = "ctr-web-progress-v1";
let progress = load();
function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
  catch { return {}; }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* ignore */ }
}
// Highest level index the player has finished (-1 = none yet).
function lastCompleted() {
  let last = -1;
  for (let i = 0; i < LEVELS.length; i++) if (progress[i] != null) last = i;
  return last;
}
// A level is unlocked if it is the first, or the one after the last finished.
function maxUnlockedIndex() {
  return Math.min(LEVELS.length - 1, lastCompleted() + 1);
}

// ---------------------------------------------------------------- view transform
let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function resize() {
  const cw = window.innerWidth, ch = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  const scale = Math.min(cw / W, ch / H);
  view = { scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, dpr };
}
window.addEventListener("resize", resize);
resize();

function toWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - view.ox) / view.scale,
    y: (clientY - rect.top - view.oy) / view.scale,
  };
}

// ---------------------------------------------------------------- game state
let mode = "title";           // title | play | result
let level = null;             // active level runtime object
let levelIndex = 0;
let particles = [];
let lastT = performance.now();
let acc = 0;
const STEP = 1 / 120;

function buildLevel(idx) {
  const data = LEVELS[idx];
  levelIndex = idx;
  const world = new World({ x: 0, y: 2100 });
  world.bounds = { w: W, h: H };
  const candy = world.setCandy(data.candy.x, data.candy.y);

  for (const r of data.ropes || []) {
    world.addRope({ x: r.x, y: r.y }, r.seg, r.len, { stretchy: r.stretchy });
  }

  level = {
    data,
    world,
    candy,
    omnom: { ...data.omnom },
    mouthOpen: 0,
    stars: (data.stars || []).map(s => ({ x: s.x, y: s.y, got: false })),
    bubbles: (data.bubbles || []).map(b => ({ ...b, popped: false })),
    cushions: (data.cushions || []).map(c => ({ ...c, blowT: 0 })),
    spikes: (data.spikes || []).map(s => ({ ...s })),
    gravityBtns: (data.gravityBtns || []).map(b => ({ ...b, active: false, cd: 0 })),
    autoRings: (data.autoRings || data.autoRopes || []).map(a => ({ ...a, rope: null, armed: true })),
    attachedBubble: null,
    t: 0,
    ended: false,
    starsGot: 0,
  };

  particles = [];
  levelLabel.innerHTML = `Box ${boxNumber(data.box)} &mdash; ${data.n}`;
  showHint(data.hint);
  mode = "play";
  hud.classList.remove("hidden");
  overlay.classList.add("hidden");
}

// ---------------------------------------------------------------- hint toast
let hintTimer = 0;
function showHint(text) {
  if (!text) return;
  hintEl.textContent = text;
  hintEl.classList.remove("hidden");
  hintTimer = 4.5;
}

// ---------------------------------------------------------------- input
let swipe = null;   // { trail: [...], last }
canvas.addEventListener("pointerdown", e => {
  if (mode !== "play") return;
  canvas.setPointerCapture(e.pointerId);
  const p = toWorld(e.clientX, e.clientY);
  swipe = { trail: [p], id: e.pointerId };
  handleTap(p);
});
canvas.addEventListener("pointermove", e => {
  if (mode !== "play" || !swipe || e.pointerId !== swipe.id) return;
  const p = toWorld(e.clientX, e.clientY);
  const prev = swipe.trail[swipe.trail.length - 1];
  swipe.trail.push(p);
  if (swipe.trail.length > 14) swipe.trail.shift();
  cutTest(prev, p);
});
function endSwipe(e) {
  if (swipe && (!e || e.pointerId === swipe.id)) swipe = null;
}
canvas.addEventListener("pointerup", endSwipe);
canvas.addEventListener("pointercancel", endSwipe);
canvas.addEventListener("pointerleave", endSwipe);

function cutTest(a, b) {
  if (Math.hypot(b.x - a.x, b.y - a.y) < 3) return;
  let cutAny = false;
  for (const rope of level.world.ropes) {
    if (rope.dead) continue;
    const pts = rope.points;
    for (let i = 0; i < pts.length - 1; i++) {
      if (segIntersect(a, b, pts[i], pts[i + 1])) {
        rope.cut();
        cutAny = true;
        spawnBurst((pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2, "#e8c98a", 8);
        break;
      }
    }
  }
  if (cutAny) sfx("cut");
}

function handleTap(p) {
  // Bubble pop.
  if (level.attachedBubble && !level.attachedBubble.popped) {
    const b = level.attachedBubble;
    if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 26) {
      popBubble(b);
      return;
    }
  }
  for (const b of level.bubbles) {
    if (!b.popped && Math.hypot(p.x - b.x, p.y - b.y) < b.r + 20) {
      // only pops if it currently holds the candy
      if (level.attachedBubble === b) popBubble(b);
      return;
    }
  }
  // Cushion puff.
  for (const c of level.cushions) {
    if (Math.hypot(p.x - c.x, p.y - c.y) < 70) {
      c.blowT = 0.34;
      sfx("puff");
      return;
    }
  }
  // Gravity button.
  for (const g of level.gravityBtns) {
    if (g.cd <= 0 && Math.hypot(p.x - g.x, p.y - g.y) < 40) {
      g.active = !g.active;
      g.cd = 0.4;
      level.world.flipGravity();
      sfx("flip");
      return;
    }
  }
}

function popBubble(b) {
  b.popped = true;
  if (level.attachedBubble === b) level.attachedBubble = null;
  spawnBurst(b.x, b.y, "rgba(180,220,255,0.9)", 12);
  sfx("pop");
}

// ---------------------------------------------------------------- particles
function spawnBurst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * 260;
    particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      r: 2 + Math.random() * 4, color, life: 0.6, max: 0.6,
    });
  }
}

// ---------------------------------------------------------------- update
function update(dt) {
  if (mode !== "play") return;
  const L = level, w = L.world, c = L.candy;
  L.t += dt;

  for (const g of L.gravityBtns) if (g.cd > 0) g.cd -= dt;

  // Air-cushion impulse while blowing.
  for (const cu of L.cushions) {
    if (cu.blowT > 0) {
      cu.blowT -= dt;
      const dx = c.x - cu.x, dy = c.y - cu.y;
      const dist = Math.hypot(dx, dy);
      const dl = Math.hypot(cu.dir[0], cu.dir[1]);
      const nx = cu.dir[0] / dl, ny = cu.dir[1] / dl;
      const along = dx * nx + dy * ny;              // forward distance
      const perp = Math.abs(dx * -ny + dy * nx);    // spread from centre line
      if (along > -30 && along < 520 && perp < 150) {
        const power = 4200 * dt * (1 - along / 620);
        c.px -= nx * power;
        c.py -= ny * power;
      }
    }
  }

  // Bubble buoyancy — handled inside the physics step via world.bubbled.
  w.bubbled = !!(L.attachedBubble && !L.attachedBubble.popped);
  if (w.bubbled) { L.attachedBubble.x = c.x; L.attachedBubble.y = c.y; }

  // Physics substeps.
  acc += dt;
  let guard = 0;
  while (acc >= STEP && guard++ < 8) {
    w.step(STEP);
    acc -= STEP;
  }

  // Auto rings — attach a fresh rope when candy enters.
  for (const ring of L.autoRings) {
    const d = Math.hypot(c.x - ring.x, c.y - ring.y);
    const live = ring.rope && !ring.rope.dead;
    if (!live && ring.armed && d < ring.r) {
      ring.rope = w.addRope({ x: ring.x, y: ring.y }, ring.seg, Math.max(ring.len, d + 10), {});
      ring.armed = false;
      sfx("attach");
    }
    if (d > ring.r * 1.25) ring.armed = true;
  }

  // Bubble capture.
  if (!L.attachedBubble) {
    for (const b of L.bubbles) {
      if (!b.popped && Math.hypot(c.x - b.x, c.y - b.y) < b.r) {
        L.attachedBubble = b;
        sfx("bubble");
        break;
      }
    }
  }

  // Stars.
  for (const s of L.stars) {
    if (!s.got && Math.hypot(c.x - s.x, c.y - s.y) < 34 + 20) {
      s.got = true;
      L.starsGot++;
      spawnBurst(s.x, s.y, "#ffd447", 10);
      sfx("star");
    }
  }

  // Spikes.
  for (const sp of L.spikes) {
    if (pointNearSegment(c, sp, 22)) return loseLevel("ouch");
  }

  // Om Nom mouth animation + catch.
  const dmouth = Math.hypot(c.x - L.omnom.x, c.y - (L.omnom.y - 4));
  const target = dmouth < 300 ? Math.min(1, (300 - dmouth) / 200) : 0;
  L.mouthOpen += (target - L.mouthOpen) * Math.min(1, dt * 10);
  if (dmouth < 66) return winLevel();

  // Out of bounds.
  if (c.y > H + 90 || c.x < -120 || c.x > W + 120 || c.y < -260) {
    return loseLevel("missed");
  }

  // Particles.
  for (const p of particles) {
    p.life -= dt;
    p.vy += 900 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  particles = particles.filter(p => p.life > 0);

  if (hintTimer > 0) {
    hintTimer -= dt;
    if (hintTimer <= 0) hintEl.classList.add("hidden");
  }
}

function pointNearSegment(p, seg, pad) {
  const x1 = seg.x1, y1 = seg.y1, x2 = seg.x2, y2 = seg.y2;
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p.x - x1) * dx + (p.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(p.x - cx, p.y - cy) < pad + 18;
}

// ---------------------------------------------------------------- win / lose
function winLevel() {
  const L = level;
  if (L.ended) return;
  L.ended = true;
  L.won = true;
  mode = "result";
  const stars = L.starsGot;
  const prev = progress[levelIndex] ?? -1;
  if (stars > prev) { progress[levelIndex] = stars; save(); }
  spawnBurst(L.omnom.x, L.omnom.y, "#9ede5f", 22);
  sfx("nom");
  buildLevelGrid();
  showResult(true, stars);
}

function loseLevel(kind) {
  const L = level;
  if (L.ended) return;
  L.ended = true;
  mode = "result";
  spawnBurst(L.candy.x, L.candy.y, kind === "ouch" ? "#ff6b6f" : "#c0392b", 18);
  sfx(kind === "ouch" ? "smash" : "miss");
  showResult(false, 0, kind);
}

function showResult(won, stars, kind) {
  resultScreen.classList.remove("hidden");
  titleScreen.classList.add("hidden");
  levelSelect.classList.add("hidden");
  overlay.classList.remove("hidden");

  document.getElementById("result-title").textContent =
    won ? (stars === 3 ? "Perfect!" : "Yum!") : (kind === "ouch" ? "Ouch!" : "Oh no!");
  const msg = document.getElementById("result-msg");
  msg.textContent = won
    ? (stars === 3 ? "All three stars — nice cutting." : `${stars} of 3 stars collected.`)
    : (kind === "ouch" ? "The candy hit the spikes." : "The candy got away.");

  const rstars = resultScreen.querySelectorAll(".rstar");
  rstars.forEach((el, i) => {
    el.classList.remove("on");
    if (won && i < stars) setTimeout(() => el.classList.add("on"), 180 + i * 220);
  });

  const next = document.getElementById("btn-result-next");
  const side = document.getElementById("btn-result-retry");
  const hasNext = levelIndex + 1 < LEVELS.length;
  if (won && hasNext) {
    next.textContent = "Next";
    next.onclick = () => buildLevel(levelIndex + 1);
    side.textContent = "Retry";
    side.onclick = () => buildLevel(levelIndex);
  } else if (won) {
    next.textContent = "Levels";
    next.onclick = openLevelSelect;
    side.textContent = "Retry";
    side.onclick = () => buildLevel(levelIndex);
  } else {
    next.textContent = "Retry";
    next.onclick = () => buildLevel(levelIndex);
    side.textContent = "Levels";
    side.onclick = openLevelSelect;
  }
}

// ---------------------------------------------------------------- render
function render() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width / view.dpr, canvas.height / view.dpr);
  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();

  R.drawBackground(ctx, W, H, level ? level.t : 0);

  if (level) {
    const L = level;
    for (const sp of L.spikes) R.drawSpikes(ctx, sp, L.t);
    for (const cu of L.cushions) R.drawCushion(ctx, cu, Math.max(0, cu.blowT / 0.34));
    for (const ring of L.autoRings) R.drawAutoRing(ctx, ring, L.t, ring.rope && !ring.rope.dead);
    for (const g of L.gravityBtns) R.drawGravityButton(ctx, g, g.active, L.t);

    R.drawOmNom(ctx, L.omnom.x, L.omnom.y, {
      mouthOpen: L.mouthOpen,
      sad: mode === "result" && L.ended && !L.won,
      happy: mode === "result" && L.won,
      t: L.t,
    });

    for (const s of L.stars) R.drawStar(ctx, s.x, s.y, L.t, s.got);
    for (const rope of L.world.ropes) R.drawRope(ctx, rope);

    if (!L.ended) R.drawCandy(ctx, L.candy.x, L.candy.y, L.world.candyRadius, L.t);

    if (L.attachedBubble && !L.attachedBubble.popped)
      R.drawBubble(ctx, L.attachedBubble.x, L.attachedBubble.y, L.attachedBubble.r, L.t);
    for (const b of L.bubbles)
      if (!b.popped && b !== L.attachedBubble) R.drawBubble(ctx, b.x, b.y, b.r, L.t);

    R.drawParticles(ctx, particles);
    if (swipe) R.drawSwipe(ctx, swipe.trail);
  }

  ctx.restore();
}

// ---------------------------------------------------------------- loop
function frame(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.05) dt = 0.05;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- menus
function buildLevelGrid() {
  levelGrid.innerHTML = "";
  const maxUnlocked = maxUnlockedIndex();
  LEVELS.forEach((lv, i) => {
    const cell = document.createElement("button");
    cell.className = "lvl-cell";
    const locked = i > maxUnlocked;
    if (locked) cell.classList.add("locked");
    const got = progress[i];
    cell.innerHTML =
      `<span>${boxNumber(lv.box)}-${lv.n}</span>` +
      `<span class="mini-stars">${got != null ? "★".repeat(got) + "☆".repeat(3 - got) : "☆☆☆"}</span>`;
    if (!locked) cell.onclick = () => buildLevel(i);
    levelGrid.appendChild(cell);
  });
}

function openLevelSelect() {
  mode = "title";
  buildLevelGrid();
  overlay.classList.remove("hidden");
  titleScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  levelSelect.classList.remove("hidden");
  hud.classList.add("hidden");
}

document.getElementById("btn-play").onclick = () => buildLevel(maxUnlockedIndex());
document.getElementById("btn-levels").onclick = openLevelSelect;
document.getElementById("btn-back").onclick = () => {
  levelSelect.classList.add("hidden");
  titleScreen.classList.remove("hidden");
};
document.getElementById("btn-menu").onclick = openLevelSelect;
document.getElementById("btn-restart").onclick = () => buildLevel(levelIndex);

buildLevelGrid();

// Lightweight hook for automated smoke tests.
window.__ctr = {
  state: () => ({
    mode, levelIndex,
    ended: level && level.ended,
    won: level && level.won,
    stars: level && level.starsGot,
    candy: level && { x: Math.round(level.candy.x), y: Math.round(level.candy.y) },
    liveRopes: level && level.world.liveRopes(),
  }),
  goto: i => buildLevel(i),
  view: () => view,
};
