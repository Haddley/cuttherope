// All drawing is procedural vector art on a 2D canvas — no external images,
// no game assets. Om Nom here is an original cartoon blob inspired by the
// "cute green creature with big eyes" idea, not a copy of the real sprites.

export function drawBackground(ctx, w, h, t) {
  // Warm cardboard-box gradient with subtle corrugation.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8a5f38");
  g.addColorStop(0.5, "#6b4a2b");
  g.addColorStop(1, "#553a20");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Vignette.
  const v = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.25, w / 2, h * 0.5, h * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

export function drawRope(ctx, rope) {
  if (rope.dead) return;
  const pts = rope.points;
  const tension = rope.tension;
  // Colour shifts brown -> red as the rope stretches.
  const r = Math.round(120 + tension * 135);
  const gc = Math.round(74 - tension * 40);
  const b = Math.round(43 - tension * 20);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 9;
  strokePolyline(ctx, pts, 2, 3);

  ctx.strokeStyle = `rgb(${r},${gc},${b})`;
  ctx.lineWidth = 6;
  strokePolyline(ctx, pts, 0, 0);

  // Twist highlights.
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  strokePolyline(ctx, pts, -1, -1);

  // Peg / pin.
  const a = rope.anchor;
  ctx.fillStyle = rope.auto ? "#d8b26a" : "#3a2413";
  ctx.beginPath();
  ctx.arc(a.x, a.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#edd7b0";
  ctx.beginPath();
  ctx.arc(a.x - 3, a.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
}

function strokePolyline(ctx, pts, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x + dx, pts[0].y + dy);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x + dx, pts[i].y + dy);
  ctx.stroke();
}

export function drawCandy(ctx, x, y, rad, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * 0.05);
  // Wrapper twists.
  ctx.fillStyle = "#c0272d";
  wrapperTwist(ctx, -rad - 6, 0, -1);
  wrapperTwist(ctx, rad + 6, 0, 1);
  // Candy body.
  const g = ctx.createRadialGradient(-rad * 0.35, -rad * 0.35, rad * 0.2, 0, 0, rad);
  g.addColorStop(0, "#ff6b6f");
  g.addColorStop(0.6, "#e23b41");
  g.addColorStop(1, "#a81f27");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-rad * 0.3, -rad * 0.3, rad * 0.45, Math.PI * 0.9, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
}

function wrapperTwist(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 4, y - 12);
  ctx.lineTo(x + s * 14, y - 4);
  ctx.lineTo(x + s * 14, y + 4);
  ctx.lineTo(x - s * 4, y + 12);
  ctx.closePath();
  ctx.fill();
}

export function drawOmNom(ctx, x, y, opts = {}) {
  const { mouthOpen = 0, sad = false, happy = false, t = 0, scale = 1 } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const breathe = 1 + Math.sin(t * 2.2) * 0.02;
  ctx.scale(1, breathe);

  // Shadow.
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 96, 78, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet.
  ctx.fillStyle = "#3f8f27";
  for (const fx of [-42, 42]) {
    ctx.beginPath();
    ctx.ellipse(fx, 84, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body.
  const bg = ctx.createRadialGradient(-26, -26, 14, 0, 0, 96);
  bg.addColorStop(0, "#9ede5f");
  bg.addColorStop(0.65, "#66b93a");
  bg.addColorStop(1, "#3f8f27");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, 84, 0, Math.PI * 2);
  ctx.fill();

  // Tummy patch.
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, 22, 46, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // Little horns / antennae.
  ctx.strokeStyle = "#3f8f27";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 24, -76);
    ctx.quadraticCurveTo(s * 40, -104, s * 20, -118);
    ctx.stroke();
  }

  // Mouth.
  const mo = Math.max(0, Math.min(1, mouthOpen));
  ctx.fillStyle = "#6e1410";
  ctx.beginPath();
  if (mo > 0.02) {
    const mw = 30 + mo * 34;
    const mh = 6 + mo * 46;
    ctx.ellipse(0, 40, mw, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff7a6b";
    ctx.beginPath();
    ctx.ellipse(0, 40 + mh * 0.45, mw * 0.55, mh * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (sad) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#3a2413";
    ctx.beginPath();
    ctx.arc(0, 62, 20, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#3a2413";
    ctx.beginPath();
    ctx.arc(0, 40, 22, happy ? 0.15 * Math.PI : 0.05 * Math.PI, happy ? 0.85 * Math.PI : 0.95 * Math.PI);
    ctx.stroke();
  }

  // Teeth.
  if (mo < 0.5) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(-12, 34); ctx.lineTo(-4, 34); ctx.lineTo(-8, 44); ctx.closePath();
    ctx.moveTo(12, 34); ctx.lineTo(4, 34); ctx.lineTo(8, 44); ctx.closePath();
    ctx.fill();
  }

  // Eyes.
  const look = sad ? 0.2 : 1;
  for (const s of [-1, 1]) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(s * 26, -20, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1c1c";
    const px = s * 26 + Math.sin(t) * 2;
    const py = -20 + (sad ? 6 : 3) + Math.cos(t * 0.8) * 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 12 * look + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px - 4, py - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    // eyelids when sad
    if (sad) {
      ctx.fillStyle = "#66b93a";
      ctx.beginPath();
      ctx.moveTo(s * 26 - 28, -34);
      ctx.lineTo(s * 26 + 28, -44);
      ctx.lineTo(s * 26 + 28, -20);
      ctx.lineTo(s * 26 - 28, -20);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawStar(ctx, x, y, t, collected) {
  if (collected) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 1.5) * 0.15);
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  ctx.scale(pulse, pulse);
  ctx.shadowColor = "rgba(255,200,60,0.8)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd447";
  ctx.strokeStyle = "#ffedb0";
  ctx.lineWidth = 2;
  star(ctx, 0, 0, 5, 20, 9);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function star(ctx, cx, cy, spikes, outer, inner) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  for (let i = 0; i < spikes; i++) {
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
  }
  ctx.closePath();
}

export function drawBubble(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  const wob = 1 + Math.sin(t * 3) * 0.04;
  ctx.scale(wob, 1 / wob);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(150,210,255,0.18)");
  g.addColorStop(1, "rgba(120,190,255,0.32)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCushion(ctx, c, blowT) {
  ctx.save();
  ctx.translate(c.x, c.y);
  const ang = Math.atan2(c.dir[1], c.dir[0]);
  ctx.rotate(ang);
  // Nozzle.
  ctx.fillStyle = "#2f6db0";
  ctx.strokeStyle = "#1c4a80";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-30, -34);
  ctx.lineTo(6, -22);
  ctx.lineTo(6, 22);
  ctx.lineTo(-30, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7fc0ff";
  ctx.fillRect(-30, -34, 10, 68);
  // Puff.
  if (blowT > 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * blowT})`;
    for (let i = 1; i <= 4; i++) {
      const d = 20 + i * 34 * (1.2 - blowT);
      ctx.beginPath();
      ctx.arc(d, Math.sin(i) * 8, 10 + i * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawSpikes(ctx, s, t) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
  const len = Math.hypot(dx, dy);
  const nx = dx / len, ny = dy / len;
  const count = Math.max(2, Math.floor(len / 30));
  ctx.save();
  ctx.fillStyle = "#c9ccd4";
  ctx.strokeStyle = "#8a8f9c";
  ctx.lineWidth = 2;
  // base bar
  ctx.fillStyle = "#5a4230";
  ctx.beginPath();
  ctx.moveTo(s.x1 - ny * 8, s.y1 + nx * 8);
  ctx.lineTo(s.x2 - ny * 8, s.y2 + nx * 8);
  ctx.lineTo(s.x2 + ny * 8, s.y2 - nx * 8);
  ctx.lineTo(s.x1 + ny * 8, s.y1 - nx * 8);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < count; i++) {
    const p = (i + 0.5) / count;
    const bx = s.x1 + dx * p, by = s.y1 + dy * p;
    const h = 24;
    ctx.fillStyle = "#dfe3ea";
    ctx.beginPath();
    ctx.moveTo(bx - nx * 12 - ny * 6, by - ny * 12 + nx * 6);
    ctx.lineTo(bx + nx * 12 - ny * 6, by + ny * 12 + nx * 6);
    ctx.lineTo(bx + ny * h, by - nx * h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawGravityButton(ctx, b, active, t) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(active ? Math.PI : 0);
  const pulse = 1 + Math.sin(t * 4) * 0.05;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = active ? "#4caf50" : "#c0392b";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(12, 6);
  ctx.lineTo(4, 6);
  ctx.lineTo(4, 14);
  ctx.lineTo(-4, 14);
  ctx.lineTo(-4, 6);
  ctx.lineTo(-12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawAutoRing(ctx, a, t, used) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(t * 0.6);
  ctx.strokeStyle = used ? "rgba(216,178,106,0.25)" : "rgba(255,240,200,0.8)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, a.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = used ? "#8a6b3a" : "#d8b26a";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSwipe(ctx, trail) {
  if (trail.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = pass === 0 ? 16 : 5;
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
