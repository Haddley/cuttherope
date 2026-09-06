// Level data. Virtual play field is 720 x 1280 (portrait).
// Anchors/positions are in that space; the renderer scales to the screen.
//
//  ropes:      { x,y, seg, len, stretchy? }   x,y = fixed peg
//  autoRopes:  { x,y, r, seg, len }           ring; attaches a rope on contact
//  bubbles:    { x,y, r }                      lifts candy; tap to pop
//  cushions:   { x,y, dir:[dx,dy] }            tap to blow a puff of air
//  spikes:     { x1,y1, x2,y2 }                destroys candy on contact
//  gravityBtns:{ x,y }                          tap to flip gravity
//  stars:      { x,y }

export const W = 720, H = 1280;

export const LEVELS = [
  // ---------------- Box 1 : Cardboard ----------------
  {
    box: "Cardboard", n: 1,
    hint: "Swipe across the rope to cut it.",
    candy: { x: 360, y: 300 },
    omnom: { x: 360, y: 1040 },
    ropes: [{ x: 360, y: 150, seg: 9, len: 190 }],
    stars: [{ x: 360, y: 560 }, { x: 360, y: 760 }, { x: 360, y: 930 }],
  },
  {
    box: "Cardboard", n: 2,
    hint: "Two ropes. The order and timing matter.",
    candy: { x: 360, y: 320 },
    omnom: { x: 360, y: 1050 },
    ropes: [
      { x: 210, y: 190, seg: 8, len: 240 },
      { x: 510, y: 190, seg: 8, len: 240 },
    ],
    stars: [{ x: 360, y: 520 }, { x: 360, y: 720 }, { x: 360, y: 900 }],
  },
  {
    box: "Cardboard", n: 3,
    hint: "Let it swing, then cut at the bottom to fling it across.",
    candy: { x: 120, y: 320 },
    omnom: { x: 560, y: 1060 },
    ropes: [{ x: 220, y: 180, seg: 10, len: 300 }],
    stars: [{ x: 200, y: 478 }, { x: 330, y: 500 }, { x: 452, y: 708 }],
  },
  {
    box: "Cardboard", n: 4,
    hint: "Red ropes are stretchy — they fling the candy when cut.",
    candy: { x: 360, y: 360 },
    omnom: { x: 360, y: 1080 },
    ropes: [{ x: 360, y: 200, seg: 8, len: 150, stretchy: true }],
    stars: [{ x: 360, y: 620 }, { x: 360, y: 820 }, { x: 360, y: 980 }],
  },
  {
    box: "Cardboard", n: 5,
    hint: "Dashed rings grab the candy with a fresh rope automatically.",
    candy: { x: 120, y: 300 },
    omnom: { x: 540, y: 1060 },
    ropes: [{ x: 200, y: 180, seg: 7, len: 300 }],
    autoRopes: [{ x: 400, y: 430, r: 120, seg: 8, len: 210 }],
    stars: [{ x: 178, y: 468 }, { x: 405, y: 636 }, { x: 524, y: 900 }],
  },
  {
    box: "Cardboard", n: 6,
    hint: "Spikes shatter the candy. Mind the gap.",
    candy: { x: 360, y: 300 },
    omnom: { x: 360, y: 1090 },
    ropes: [
      { x: 220, y: 180, seg: 8, len: 230 },
      { x: 500, y: 180, seg: 8, len: 230 },
    ],
    spikes: [
      { x1: 120, y1: 720, x2: 300, y2: 720 },
      { x1: 420, y1: 720, x2: 600, y2: 720 },
    ],
    stars: [{ x: 360, y: 500 }, { x: 360, y: 640 }, { x: 360, y: 900 }],
  },

  // ---------------- Box 2 : Fabric ----------------
  {
    box: "Fabric", n: 1,
    hint: "Bubbles float the candy up. Tap the bubble to pop it.",
    candy: { x: 360, y: 720 },
    omnom: { x: 360, y: 340 },
    ropes: [{ x: 360, y: 900, seg: 8, len: 210 }],
    bubbles: [{ x: 360, y: 720, r: 62 }],
    stars: [{ x: 360, y: 560 }, { x: 360, y: 460 }, { x: 360, y: 620 }],
  },
  {
    box: "Fabric", n: 2,
    hint: "Cut the rope, then puff the falling candy sideways to Om Nom.",
    candy: { x: 200, y: 320 },
    omnom: { x: 540, y: 640 },
    ropes: [{ x: 200, y: 180, seg: 7, len: 160 }],
    cushions: [{ x: 200, y: 500, dir: [1, -0.05] }],
    stars: [{ x: 210, y: 430 }, { x: 380, y: 520 }, { x: 500, y: 600 }],
  },
  {
    box: "Fabric", n: 3,
    hint: "Ride the bubble past the spikes, then pop it.",
    candy: { x: 360, y: 840 },
    omnom: { x: 360, y: 250 },
    ropes: [{ x: 360, y: 1000, seg: 6, len: 150 }],
    bubbles: [{ x: 360, y: 840, r: 60 }],
    spikes: [
      { x1: 120, y1: 560, x2: 285, y2: 560 },
      { x1: 435, y1: 560, x2: 600, y2: 560 },
    ],
    stars: [{ x: 360, y: 690 }, { x: 360, y: 470 }, { x: 360, y: 360 }],
  },
  {
    box: "Fabric", n: 4,
    hint: "One cushion, two puffs — time the second one.",
    candy: { x: 360, y: 280 },
    omnom: { x: 360, y: 1080 },
    ropes: [{ x: 360, y: 160, seg: 6, len: 140, stretchy: true }],
    cushions: [{ x: 360, y: 900, dir: [0, -1] }],
    spikes: [{ x1: 250, y1: 1180, x2: 470, y2: 1180 }],
    stars: [{ x: 360, y: 520 }, { x: 360, y: 430 }, { x: 360, y: 640 }],
  },
  {
    box: "Fabric", n: 5,
    hint: "The button flips gravity. Up is the new down.",
    candy: { x: 360, y: 360 },
    omnom: { x: 360, y: 170 },
    ropes: [{ x: 360, y: 220, seg: 7, len: 170 }],
    gravityBtns: [{ x: 560, y: 560 }],
    stars: [{ x: 360, y: 340 }, { x: 360, y: 280 }, { x: 360, y: 220 }],
  },
  {
    box: "Fabric", n: 6,
    hint: "Cut the rope and let the bubble carry the candy up to Om Nom.",
    candy: { x: 360, y: 820 },
    omnom: { x: 360, y: 260 },
    ropes: [{ x: 360, y: 970, seg: 7, len: 180 }],
    bubbles: [{ x: 360, y: 820, r: 58 }],
    gravityBtns: [{ x: 560, y: 600 }],
    stars: [{ x: 360, y: 640 }, { x: 360, y: 460 }, { x: 360, y: 340 }],
  },

  // ---------------- Box 3 : Magic ----------------
  {
    box: "Magic", n: 1,
    hint: "Hand the candy from rope to rope.",
    candy: { x: 120, y: 280 },
    omnom: { x: 600, y: 1060 },
    ropes: [{ x: 200, y: 180, seg: 8, len: 300 }],
    autoRopes: [
      { x: 390, y: 410, r: 125, seg: 7, len: 210 },
      { x: 540, y: 590, r: 125, seg: 7, len: 240 },
    ],
    stars: [{ x: 250, y: 430 }, { x: 450, y: 520 }, { x: 560, y: 760 }],
  },
  {
    box: "Magic", n: 2,
    hint: "Cushions make a wind tunnel. Keep it airborne.",
    candy: { x: 150, y: 320 },
    omnom: { x: 610, y: 560 },
    ropes: [{ x: 150, y: 200, seg: 6, len: 150, stretchy: true }],
    cushions: [
      { x: 120, y: 760, dir: [1, -0.2] },
      { x: 380, y: 820, dir: [0.6, -0.8] },
    ],
    spikes: [{ x1: 200, y1: 1140, x2: 520, y2: 1140 }],
    stars: [{ x: 300, y: 560 }, { x: 430, y: 470 }, { x: 520, y: 700 }],
  },
  {
    box: "Magic", n: 3,
    hint: "Pop the bubble at the top of its climb.",
    candy: { x: 360, y: 900 },
    omnom: { x: 360, y: 250 },
    ropes: [
      { x: 240, y: 1040, seg: 6, len: 170 },
      { x: 480, y: 1040, seg: 6, len: 170 },
    ],
    bubbles: [{ x: 360, y: 900, r: 58 }],
    spikes: [
      { x1: 120, y1: 470, x2: 290, y2: 470 },
      { x1: 430, y1: 470, x2: 600, y2: 470 },
    ],
    stars: [{ x: 360, y: 720 }, { x: 360, y: 560 }, { x: 360, y: 360 }],
  },
  {
    box: "Magic", n: 4,
    hint: "A rope, a ring and a cushion. Take your time.",
    candy: { x: 120, y: 260 },
    omnom: { x: 620, y: 1060 },
    ropes: [{ x: 200, y: 170, seg: 8, len: 300 }],
    autoRopes: [{ x: 380, y: 400, r: 120, seg: 7, len: 220 }],
    cushions: [{ x: 320, y: 900, dir: [1, -0.1] }],
    stars: [{ x: 250, y: 420 }, { x: 440, y: 560 }, { x: 560, y: 820 }],
  },
  {
    box: "Magic", n: 5,
    hint: "The anchor is below the candy. Flip gravity to fall upward into Om Nom.",
    candy: { x: 360, y: 340 },
    omnom: { x: 360, y: 170 },
    ropes: [{ x: 360, y: 480, seg: 6, len: 150 }],
    gravityBtns: [{ x: 545, y: 560 }],
    spikes: [{ x1: 200, y1: 1235, x2: 520, y2: 1235 }],
    stars: [{ x: 360, y: 560 }, { x: 360, y: 800 }, { x: 360, y: 660 }],
  },
  {
    box: "Magic", n: 6,
    hint: "The grand finale. Feed Om Nom!",
    candy: { x: 120, y: 300 },
    omnom: { x: 360, y: 1120 },
    ropes: [{ x: 200, y: 190, seg: 7, len: 290 }],
    autoRopes: [
      { x: 370, y: 430, r: 125, seg: 6, len: 200 },
      { x: 360, y: 690, r: 130, seg: 6, len: 210 },
    ],
    bubbles: [{ x: 360, y: 900, r: 60 }],
    gravityBtns: [{ x: 560, y: 500 }],
    spikes: [
      { x1: 120, y1: 1010, x2: 300, y2: 1010 },
      { x1: 430, y1: 1010, x2: 600, y2: 1010 },
    ],
    stars: [{ x: 250, y: 440 }, { x: 380, y: 620 }, { x: 360, y: 860 }],
  },
];

export function boxNumber(box) {
  return { Cardboard: 1, Fabric: 2, Magic: 3 }[box] || 1;
}
