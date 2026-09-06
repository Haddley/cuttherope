// Verlet-integration physics for rope + candy.
// A rope is a chain of point masses joined by distance constraints.
// The last point of every rope is the shared "candy" point, so multiple
// ropes pulling on the same candy resolve naturally through constraint
// iteration (the same trick the original game uses).

export class Point {
  constructor(x, y, pinned = false) {
    this.x = x; this.y = y;
    this.px = x; this.py = y;
    this.pinned = pinned;
    this.mass = 1;
  }
  // Move a pinned point (its anchor) without injecting velocity.
  place(x, y) { this.x = this.px = x; this.y = this.py = y; }
}

export class Constraint {
  constructor(a, b, length = null, stiffness = 1) {
    this.a = a; this.b = b;
    this.length = length == null ? Math.hypot(a.x - b.x, a.y - b.y) : length;
    this.stiffness = stiffness;   // 1 = rigid, <1 = elastic
    this.dead = false;
    this.tension = 0;             // 0..1, how stretched right now (for colour)
  }
  solve() {
    if (this.dead) return;
    const a = this.a, b = this.b;
    let dx = b.x - a.x, dy = b.y - a.y;
    let dist = Math.hypot(dx, dy) || 0.0001;
    const diff = (dist - this.length) / dist;
    this.tension = Math.max(0, Math.min(1, (dist / this.length - 1) / 0.5));
    const k = 0.5 * this.stiffness * diff;
    const ox = dx * k, oy = dy * k;
    if (!a.pinned) { a.x += ox; a.y += oy; }
    if (!b.pinned) { b.x -= ox; b.y -= oy; }
  }
}

export class Rope {
  // anchor: {x,y} fixed peg. end: shared candy Point. segments: chain count.
  constructor(anchor, end, segments, restLength, opts = {}) {
    this.anchor = new Point(anchor.x, anchor.y, true);
    this.end = end;
    this.stretchy = !!opts.stretchy;
    this.auto = !!opts.auto;               // spawned by an auto-rope ring
    this.dead = false;
    this.points = [this.anchor];
    this.constraints = [];

    const segLen = restLength / segments;
    const stiffness = this.stretchy ? 0.55 : 1;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const p = (i === segments)
        ? end                                 // last point IS the candy
        : new Point(
            anchor.x + (end.x - anchor.x) * t,
            anchor.y + (end.y - anchor.y) * t
          );
      const a = this.points[this.points.length - 1];
      this.points.push(p);
      this.constraints.push(new Constraint(a, p, segLen, stiffness));
    }
  }
  cut() {
    this.dead = true;
    for (const c of this.constraints) c.dead = true;
  }
  // Max visual tension along the rope (drives the red "about to launch" colour).
  get tension() {
    let t = 0;
    for (const c of this.constraints) if (c.tension > t) t = c.tension;
    return t;
  }
}

export class World {
  constructor(gravity = { x: 0, y: 2100 }) {
    this.gravity = { ...gravity };
    this.gravityDir = 1;            // flipped by gravity buttons
    this.candy = null;
    this.ropes = [];
    this.freePoints = [];          // points not owned by the candy chain end
    this.iterations = 14;
    this.bounds = { w: 720, h: 1280 };
    this.candyRadius = 26;
    this.wind = { x: 0, y: 0, t: 0 };   // transient air-cushion push
    this.bubbled = false;               // candy is riding a bubble
    this.liftForce = 1020;              // upward accel while bubbled
  }

  setCandy(x, y) {
    this.candy = new Point(x, y);
    return this.candy;
  }

  addRope(anchor, segments, restLength, opts) {
    const r = new Rope(anchor, this.candy, segments, restLength, opts);
    this.ropes.push(r);
    return r;
  }

  step(dt) {
    dt = Math.min(dt, 1 / 50);
    const gx = this.gravity.x + this.wind.x;
    const gy = this.gravity.y * this.gravityDir + this.wind.y;

    const pts = this._allPoints();
    for (const p of pts) {
      if (p.pinned) continue;
      const bubble = this.bubbled && p === this.candy;
      const damp = bubble ? 0.90 : 0.995;
      const ax = bubble ? gx * 0.25 : gx;
      const ay = bubble ? -this.liftForce * this.gravityDir : gy;
      const vx = (p.x - p.px) * damp;
      const vy = (p.y - p.py) * damp;
      p.px = p.x; p.py = p.y;
      p.x += vx + ax * dt * dt;
      p.y += vy + ay * dt * dt;
    }

    for (let k = 0; k < this.iterations; k++) {
      for (const r of this.ropes) {
        if (r.dead) continue;
        for (const c of r.constraints) c.solve();
        // A non-stretchy rope also enforces a hard max length from the anchor
        // so the candy can never drift past its reach.
        if (!r.stretchy) this._clampRope(r);
      }
    }

    if (this.wind.t > 0) {
      this.wind.t -= dt;
      if (this.wind.t <= 0) { this.wind.x = 0; this.wind.y = 0; }
    }
  }

  _clampRope(r) {
    const total = r.constraints.reduce((s, c) => s + c.length, 0);
    const a = r.anchor, e = r.end;
    const dx = e.x - a.x, dy = e.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d > total) {
      const s = total / d;
      e.x = a.x + dx * s;
      e.y = a.y + dy * s;
    }
  }

  _allPoints() {
    const set = new Set();
    if (this.candy) set.add(this.candy);
    for (const r of this.ropes) for (const p of r.points) set.add(p);
    for (const p of this.freePoints) set.add(p);
    return set;
  }

  puff(dirX, dirY, power = 5200, time = 0.28) {
    this.wind.x = dirX * power;
    this.wind.y = dirY * power;
    this.wind.t = time;
  }

  flipGravity() { this.gravityDir *= -1; }

  candyVelocity() {
    const c = this.candy;
    return { x: c.x - c.px, y: c.y - c.py };
  }

  // How many ropes still hold the candy.
  liveRopes() { return this.ropes.filter(r => !r.dead).length; }
}

// Segment/segment intersection — used to test a swipe against rope links.
export function segIntersect(p1, p2, p3, p4) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
