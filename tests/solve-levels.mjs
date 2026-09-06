// e2e "every level is completable" suite.
//
// For each level this drives the REAL game (js/game.js) through the
// deterministic window.__ctr.test hook: the rAF loop stops auto-stepping,
// and the solver steps the physics a fixed 1/120s at a time, injecting
// cuts / taps between steps. It then searches a space of action plans
// (when to cut which rope, when to pop a bubble, when to puff a cushion,
// when to flip gravity) for one that gets the candy into Om Nom.
//
// A level "passes" if the search finds a winning plan. It is a genuine
// end-to-end check: the same update(), collision, auto-ring, bubble,
// cushion and win-detection code paths the player hits.
//
// Usage:  npm test           (headless)
//         HEADED=1 npm test  (watch it play)

import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 8123;
const PAGE_URL = `http://localhost:${PORT}/index.html`;
const HEADED = !!process.env.HEADED;

// ---------------------------------------------------------------- static server
function startServer() {
  const p = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: new URL("..", import.meta.url).pathname,
    stdio: "ignore",
  });
  return p;
}

async function waitForServer(tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(PAGE_URL);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error("static server did not come up");
}

// ---------------------------------------------------------------- the solver
// Runs entirely inside the page (one evaluate call per level) so the search
// is fast — no per-step round trips. It plays the real game deterministically
// and hunts for any action sequence that gets the candy into Om Nom:
//   1. a fine sweep of "cut every rope at frame f" (solves the plain levels)
//   2. a fine sweep of one non-cut action (pop / puff / flip) after a cut
//   3. a seeded random search over the full action set (1–5 timed actions),
//      which covers rope hand-offs, multi-puff and gravity combos.
function solveInPage(arg) {
  const { levelIndex, opts } = arg;
  const T = window.__ctr.test;
  const S = window.__ctr.state;
  const data = window.__ctr.levelData(levelIndex);

  const MAXF = opts.maxFrames;
  const bubbles = data.bubbles || [];
  const cushions = data.cushions || [];
  const gravBtns = data.gravityBtns || [];
  const mouth = { x: data.omnom.x, y: data.omnom.y - 4 };

  // Deterministic PRNG so a run is reproducible.
  let _s = 0x2545f491 ^ (levelIndex + 1) * 0x9e3779b9;
  const rnd = () => {
    _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5;
    return ((_s >>> 0) % 100000) / 100000;
  };
  const ri = n => Math.floor(rnd() * n);

  // The action vocabulary. Each returns a thunk performed at its frame.
  const KINDS = ["cutAll", "cutLow", "cutHigh"];
  for (let k = 0; k < cushions.length; k++) KINDS.push("puff" + k);
  for (let k = 0; k < gravBtns.length; k++) KINDS.push("flip" + k);
  if (bubbles.length) KINDS.push("pop");

  function perform(kind) {
    const ropes = T.ropes();
    const live = ropes.map((r, i) => (r.dead ? -1 : i)).filter(i => i >= 0);
    if (kind === "cutAll") live.forEach(i => T.cutRope(i));
    else if (kind === "cutLow") { if (live.length) T.cutRope(live[0]); }
    else if (kind === "cutHigh") { if (live.length) T.cutRope(live[live.length - 1]); }
    else if (kind === "pop") { const c = S().candy; if (c) T.tap(c.x, c.y); }
    else if (kind.startsWith("puff")) { const k = +kind.slice(4); T.tap(cushions[k].x, cushions[k].y); }
    else if (kind.startsWith("flip")) { const k = +kind.slice(4); T.tap(gravBtns[k].x, gravBtns[k].y); }
  }

  let evals = 0;
  let best = { won: false, minDist: Infinity, frame: null, stars: null };
  const consider = r => {
    if (r.won && (!best.won || r.frame < best.frame)) best = r;
    else if (!best.won && r.minDist < best.minDist) best = r;
    return r.won;
  };

  // Run a plan (array of {f, kind}); returns {won, lost, frame, minDist}.
  function run(plan) {
    evals++;
    T.reset(levelIndex);
    const acts = plan.slice().sort((a, b) => a.f - b.f);
    let ai = 0, minDist = Infinity;
    for (let f = 0; f < MAXF; f++) {
      while (ai < acts.length && acts[ai].f <= f) { perform(acts[ai].kind); ai++; }
      T.step(1 / 120);
      const s = S();
      if (s.candy) {
        const d = Math.hypot(s.candy.x - mouth.x, s.candy.y - mouth.y);
        if (d < minDist) minDist = d;
      }
      if (s.won) return { won: true, frame: f, minDist, stars: s.stars };
      if (s.lost) return { won: false, lost: true, frame: f, minDist };
    }
    return { won: false, frame: MAXF, minDist };
  }

  // 1. cut-everything sweep
  for (let f = 0; f <= 360; f += 2) {
    if (consider(run([{ f, kind: "cutAll" }]))) return finish();
  }

  // 2. one extra action after a cut, both timings swept
  const extras = KINDS.filter(k => !k.startsWith("cut") || k === "cutHigh");
  for (const kind of extras) {
    for (let f1 = 0; f1 <= 200; f1 += 10) {
      for (let f2 = f1; f2 <= 380; f2 += 4) {
        if (consider(run([{ f: f1, kind: "cutAll" }, { f: f2, kind }]))) return finish();
      }
    }
  }

  // 2b. rope hand-off chains: cut the feeding rope, then cut each freshly
  //     attached auto-rope in turn (covers the "hand it from rope to rope"
  //     levels deterministically).
  for (let f1 = 0; f1 <= 180; f1 += 12) {
    for (let f2 = f1; f2 <= 300; f2 += 10) {
      for (let f3 = f2; f3 <= 420; f3 += 10) {
        if (consider(run([
          { f: f1, kind: "cutLow" }, { f: f2, kind: "cutHigh" }, { f: f3, kind: "cutHigh" },
        ]))) return finish();
      }
    }
  }

  // 3. seeded random search over the full vocabulary
  const budget = opts.budget;
  while (evals < budget) {
    const n = 1 + ri(5);
    const plan = [];
    for (let i = 0; i < n; i++) {
      plan.push({ f: ri(MAXF - 60), kind: KINDS[ri(KINDS.length)] });
    }
    if (consider(run(plan))) return finish();
  }

  return finish();

  function finish() {
    return {
      won: best.won,
      frame: best.frame ?? null,
      stars: best.stars ?? null,
      minDist: Math.round(best.minDist),
      evals,
    };
  }
}

// ---------------------------------------------------------------- runner
async function main() {
  const server = startServer();
  let browser;
  const results = [];
  try {
    await waitForServer();
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", e => pageErrors.push(String(e)));
    page.on("console", m => { if (m.type() === "error") pageErrors.push("console.error: " + m.text()); });

    await page.goto(PAGE_URL);
    await page.waitForFunction(() => window.__ctr && window.__ctr.test);
    await page.evaluate(() => window.__ctr.test.enable());

    const count = await page.evaluate(() => window.__ctr.levelCount());
    const only = process.argv[2] != null ? process.argv[2].split(",").map(Number) : null;
    console.log(`\nSolving ${only ? only.join(", ") : count + " levels"}...\n`);

    for (let i = 0; i < count; i++) {
      if (only && !only.includes(i)) continue;
      const label = await page.evaluate(k => {
        const d = window.__ctr.levelData(k);
        const b = { Cardboard: 1, Fabric: 2, Magic: 3 }[d.box];
        return `${b}-${d.n}`;
      }, i);

      const t0 = Date.now();
      const res = await page.evaluate(
        solveInPage,
        { levelIndex: i, opts: { maxFrames: 960, budget: 7000 } },
      );
      const ms = Date.now() - t0;
      results.push({ i, label, ...res, ms });

      const tag = res.won ? "PASS" : "FAIL";
      const extra = res.won
        ? `win @ ${(res.frame / 120).toFixed(2)}s, ${res.stars}★`
        : `closest approach ${res.minDist}px`;
      console.log(
        `  ${tag}  ${label.padEnd(5)}  ${extra.padEnd(28)} ` +
        `(${res.evals} plans, ${ms}ms)`,
      );
    }

    // The deterministic hook must not have broken normal play.
    if (pageErrors.length) {
      console.error("\nPage errors during run:\n" + pageErrors.join("\n"));
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  const failed = results.filter(r => !r.won);
  console.log("\n" + "-".repeat(52));
  console.log(`${results.length - failed.length}/${results.length} levels solved`);
  if (failed.length) {
    console.log("Unsolved: " + failed.map(r => r.label).join(", "));
    process.exitCode = 1;
  } else {
    console.log("All levels are completable. ✔");
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: !HEADED });
  } catch {
    // Fall back to a system Chrome if the Playwright browser isn't installed.
    return await chromium.launch({ headless: !HEADED, channel: "chrome" });
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });
