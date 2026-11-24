import { fbm, rng, hash2 } from "./noise";
import { POIS, COLLECTIBLES, FRAGMENTS } from "./content";
import "./content2";

export const TILE = 24;
export const RES = 4;
export const SIZES = { surface: 180, under: 120 };
export const MOUNTAIN = 0.7;
const SEED = 2049;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (stops, t) => {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return stops[stops.length - 1][1];
};
const SURF = [[0, hex("#4a1a0c")], [0.25, hex("#7a2e16")], [0.45, hex("#b5532a")], [0.6, hex("#d98a55")], [0.7, hex("#9c5434")], [0.85, hex("#6e3a26")], [1, hex("#d8b8a0")]];
const CAVE = [[0, hex("#120d16")], [0.5, hex("#1f1724")], [0.52, hex("#4a3a48")], [1, hex("#6d5a66")]];

const placePois = (layer, N) => POIS.filter((p) => (p.layer || "surface") === layer).map((p) => ({ ...p, layer, x: Math.round(p.fx * N) + 0.5, y: Math.round(p.fy * N) + 0.5 }));

// Apply fn to all height pixels within r tiles of (tx,ty)
const brush = (h, P, tx, ty, r, fn) => {
  const cx = tx * RES, cy = ty * RES, R = r * RES;
  for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(P, cy + R); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(P, cx + R); x++) {
      const d = Math.hypot(x - cx, y - cy) / R;
      if (d < 1) h[y * P + x] = fn(h[y * P + x], d, x, y);
    }
};
const carveLine = (h, P, a, b, r, fn) => {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 1.5);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wob = Math.sin(t * 9 + a.x) * 3 * Math.sin(t * Math.PI);
    brush(h, P, lerp(a.x, b.x, t) + wob, lerp(a.y, b.y, t) - wob, r, fn);
  }
};

function genSurface(pois, terraformed) {
  const N = SIZES.surface, P = N * RES, h = new Float32Array(P * P);
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
    const X = x / RES, Y = y / RES;
    const e = fbm(X / 36, Y / 36, SEED);
    const r = 1 - Math.abs(2 * fbm(X / 26, Y / 26, SEED + 99, 4) - 1);
    h[y * P + x] = 0.55 * e + 0.5 * r ** 4 + 0.05;
  }
  const R = rng(SEED);
  for (let i = 0; i < 26; i++) {
    const cx = R() * N, cy = R() * N, cr = 2 + R() * 6;
    brush(h, P, cx, cy, cr * 1.35, (v, d) => (d < 0.74 ? v - 0.16 * (1 - (d / 0.74) ** 2) : v + 0.07 * Math.sin(((d - 0.74) / 0.26) * Math.PI)));
  }
  const col = pois.find((p) => p.id === "colony");
  pois.forEach((p) => {
    if (p.ring) return;
    if (p.id !== "colony") carveLine(h, P, col, p, 2.2, (v, d) => Math.min(v, lerp(0.5, v, d * d)));
  });
  pois.forEach((p) => {
    if (p.ring) {
      brush(h, P, p.x, p.y, p.ring === true ? 8 : p.ring, (v, d) => (d < 0.5 ? 0.5 : Math.max(v, 0.86)));
    } else brush(h, P, p.x, p.y, p.id === "colony" ? 13 : p.big || 4, (v, d) => lerp(Math.min(v, 0.48), v, p.big ? d ** 4 : d * d));
  });
  [...COLLECTIBLES, ...FRAGMENTS].filter((c) => !c.layer).forEach((c) => brush(h, P, c.fx * N, c.fy * N, 2.5, (v, d) => lerp(Math.min(v, 0.55), v, d)));
  return paint(h, P, N, (x, y, v) => {
    let c = ramp(SURF, clamp(v, 0, 1));
    const Y = y / RES;
    const polar = Y < N * 0.09 ? 1 - Y / (N * 0.09) : 0;
    if (polar > 0 && fbm(x / 20, y / 20, 5) + polar * 0.6 > 0.75) c = [lerp(c[0], 235, 0.85), lerp(c[1], 225, 0.85), lerp(c[2], 220, 0.85)];
    if (terraformed) {
      if (v < 0.33) c = [40, 110, 170];
      else if (v < 0.5) c = [lerp(c[0], 120, 0.35), lerp(c[1], 150, 0.35), lerp(c[2], 70, 0.35)];
    }
    return c;
  }, (v) => (v > MOUNTAIN ? 1 : terraformed && v < 0.33 ? 3 : 0));
}

function genUnder(pois) {
  const N = SIZES.under, P = N * RES, h = new Float32Array(P * P);
  for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) h[y * P + x] = fbm(x / RES / 9, y / RES / 9, SEED + 7, 4);
  const open = (v, d) => Math.min(v, lerp(0.3, v, d * d * d));
  const hub = pois.find((p) => p.id === "lab");
  pois.forEach((p) => { if (p.id !== "lab") carveLine(h, P, hub, p, 2, open); });
  const ex = pois.filter((p) => p.type === "exit");
  ex.forEach((p, i) => carveLine(h, P, p, ex[(i + 1) % ex.length], 1.6, open));
  [...COLLECTIBLES, ...FRAGMENTS].filter((c) => c.layer === "under").forEach((c) => {
    const pt = { x: c.fx * N, y: c.fy * N };
    const near = pois.reduce((a, b) => (Math.hypot(b.x - pt.x, b.y - pt.y) < Math.hypot(a.x - pt.x, a.y - pt.y) ? b : a));
    carveLine(h, P, near, pt, 1.6, open);
    brush(h, P, pt.x, pt.y, 3, open);
  });
  pois.forEach((p) => brush(h, P, p.x, p.y, p.id === "hollow" ? 9 : 4, open));
  const hol = pois.find((p) => p.id === "hollow");
  return paint(h, P, N, (x, y, v) => {
    let c = ramp(CAVE, 1 - clamp(v, 0, 1));
    if (v > 0.5 && hash2(x, y, 3) > 0.996) c = [63, 224, 255];
    const d = Math.hypot(x / RES - hol.x, y / RES - hol.y);
    if (d < 9 && v < 0.5) { const g = (Math.sin(d * 2.2) + 1) / 2; c = [lerp(c[0], 40, g * 0.6), lerp(c[1], 220, g * 0.6), lerp(c[2], 160, g * 0.6)]; }
    return c;
  }, (v) => (v > 0.5 ? 2 : 0));
}

function paint(h, P, N, colorFn, blockFn) {
  const grid = new Uint8Array(N * N);
  for (let ty = 0; ty < N; ty++) for (let tx = 0; tx < N; tx++) grid[ty * N + tx] = blockFn(h[(ty * RES + 2) * P + tx * RES + 2]);
  let canvas = null;
  if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = P;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(P, P);
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const i = y * P + x, v = h[i];
      const dx = h[i + (x < P - 1 ? 1 : 0)] - h[i - (x > 0 ? 1 : 0)];
      const dy = h[i + (y < P - 1 ? P : 0)] - h[i - (y > 0 ? P : 0)];
      const shade = clamp(1 - (dx + dy) * 16, 0.6, 1.4) * (0.95 + hash2(x, y, 1) * 0.1);
      const c = colorFn(x, y, v);
      img.data.set([clamp(c[0] * shade, 0, 255), clamp(c[1] * shade, 0, 255), clamp(c[2] * shade, 0, 255), 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }
  return { N, grid, canvas };
}

function genNodes(layer, L, pois) {
  const R = rng(layer === "surface" ? 11 : 22), N = L.N, nodes = [];
  const count = layer === "surface" ? 170 : 80;
  const blockedNear = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [0, 2]].some(([a, b]) => L.grid[(y + b) * N + x + a]);
  for (let tries = 0; nodes.length < count && tries < 5000; tries++) {
    const x = 2 + Math.floor(R() * (N - 4)), y = 2 + Math.floor(R() * (N - 4));
    if (L.grid[y * N + x]) continue;
    if (pois.some((p) => Math.hypot(p.x - x, p.y - y) < (p.id === "colony" ? 14 : 2.5))) continue;
    let type;
    const r = R();
    if (layer === "under") type = r < 0.4 ? "crystal" : r < 0.65 ? "ice" : r < 0.82 ? "titanium" : "iron";
    else if (y < N * 0.14) type = r < 0.7 ? "ice" : "iron";
    else if (blockedNear(x, y)) type = r < 0.6 ? "titanium" : "iron";
    else if (pois.some((p) => p.abandoned && Math.hypot(p.x - x, p.y - y) < 12)) type = r < 0.6 ? "scrap" : "silicon";
    else type = r < 0.42 ? "iron" : r < 0.8 ? "silicon" : r < 0.9 ? "ice" : "scrap";
    nodes.push({ id: `${layer[0]}${nodes.length}`, layer, x: x + 0.5, y: y + 0.5, type });
  }
  // guaranteed starter nodes near colony
  const c = pois.find((p) => p.id === "colony");
  if (c) [["iron", -15, 3], ["silicon", -14, -4], ["ice", 15, -3], ["iron", 14, 4], ["silicon", 3, 15], ["ice", -3, -15]].forEach(([type, dx, dy], i) =>
    nodes.push({ id: `start${i}`, layer, x: c.x + dx, y: c.y + dy, type }));
  return nodes;
}

const cache = {};
export function getWorld(terraformed = false) {
  const key = terraformed ? "t" : "n";
  if (cache[key]) return cache[key];
  const sp = placePois("surface", SIZES.surface), up = placePois("under", SIZES.under);
  const surface = { ...genSurface(sp, terraformed), pois: sp };
  const under = { ...genUnder(up), pois: up };
  surface.nodes = cache.n?.surface.nodes || genNodes("surface", surface, sp);
  under.nodes = cache.n?.under.nodes || genNodes("under", under, up);
  const pick = (c) => ({ ...c, layer: c.layer || "surface", x: c.fx * SIZES[c.layer || "surface"], y: c.fy * SIZES[c.layer || "surface"] });
  cache[key] = { surface, under, collectibles: COLLECTIBLES.map(pick), fragments: FRAGMENTS.map(pick) };
  return cache[key];
}

export const blocked = (L, x, y) => {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= L.N || ty >= L.N) return 2;
  return L.grid[ty * L.N + tx];
};
