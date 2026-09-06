// Tiny WebAudio blip synth — no audio files. First user gesture unlocks it.

let ac = null;
let muted = false;

function ctx() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { ac = null; }
  }
  if (ac && ac.state === "suspended") ac.resume();
  return ac;
}

window.addEventListener("pointerdown", () => ctx(), { once: true });

function tone(freq, dur, type = "sine", vol = 0.2, slideTo = null) {
  const a = ctx();
  if (!a || muted) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

function noise(dur, vol = 0.2) {
  const a = ctx();
  if (!a || muted) return;
  const n = a.sampleRate * dur;
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

const SOUNDS = {
  cut:    () => { tone(900, 0.08, "square", 0.14, 1500); noise(0.06, 0.1); },
  star:   () => { tone(880, 0.12, "triangle", 0.18, 1320); },
  pop:    () => { tone(500, 0.09, "sine", 0.2, 120); noise(0.05, 0.12); },
  bubble: () => { tone(300, 0.15, "sine", 0.15, 620); },
  puff:   () => { noise(0.18, 0.16); },
  flip:   () => { tone(200, 0.18, "sawtooth", 0.14, 500); },
  attach: () => { tone(600, 0.08, "triangle", 0.14, 900); },
  nom:    () => { tone(300, 0.1, "square", 0.2, 180); setTimeout(() => tone(200, 0.16, "square", 0.2, 90), 90); },
  smash:  () => { noise(0.3, 0.28); tone(120, 0.3, "sawtooth", 0.12, 60); },
  miss:   () => { tone(400, 0.25, "sine", 0.14, 160); },
};

export function sfx(name) {
  const s = SOUNDS[name];
  if (s) s();
}
export function setMuted(m) { muted = m; }
