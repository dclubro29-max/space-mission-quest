let ctx;
let muted = false;

const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

export const setMuted = (m) => { muted = m; };

const tone = (freq, dur = 0.12, type = "square", vol = 0.06, delay = 0, slideTo) => {
  if (muted) return;
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
};

const noise = (dur = 1.2, vol = 0.4) => {
  if (muted) return;
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  f.type = "lowpass";
  f.frequency.value = 900;
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
};

export const sfx = {
  click: () => tone(620, 0.06, "square", 0.04),
  blip: () => tone(900 + Math.random() * 200, 0.03, "triangle", 0.025),
  select: () => tone(440, 0.08, "triangle", 0.06, 0, 660),
  success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.07, i * 0.09)),
  fail: () => { tone(330, 0.18, "sawtooth", 0.05); tone(220, 0.3, "sawtooth", 0.05, 0.15); },
  bonk: () => { tone(160, 0.15, "square", 0.08, 0, 60); noise(0.15, 0.25); },
  alarm: () => [0, 0.25, 0.5].forEach((d) => tone(880, 0.18, "square", 0.04, d, 600)),
  launch: () => { tone(80, 3, "sawtooth", 0.06, 0, 400); noise(3, 0.25); },
  explode: () => { noise(2.2, 0.7); tone(120, 1.2, "sawtooth", 0.1, 0, 30); },
  fanfare: () => [523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.07, i * 0.16)),
  sad: () => [392, 370, 349, 330].forEach((f, i) => tone(f, 0.45, "triangle", 0.06, i * 0.4)),
};
