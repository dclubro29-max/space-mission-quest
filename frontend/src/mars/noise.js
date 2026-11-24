export const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const hash2 = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const sm = (t) => t * t * (3 - 2 * t);

export const vnoise = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = sm(x - xi), v = sm(y - yi);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

export const fbm = (x, y, s, o = 5) => {
  let t = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { t += amp * vnoise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2; }
  return t / n;
};
