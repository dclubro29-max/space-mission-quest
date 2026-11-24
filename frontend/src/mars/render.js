import { TILE, RES } from "./world";
import { world, colonyPos, spotPos, npcPos, nodeLeft, resolveTarget, navPoint } from "./engine";
import { COLONY_SPOTS, BUILDINGS, NPCS, ITEMS, DAY_LEN } from "./content";
import { livingRenderWorld, livingRenderGlow, drawRover } from "./living";

let lc = null;
let haze;
const parts = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() }));

export const nightAmount = (G) => {
  const p = (G.time % DAY_LEN) / DAY_LEN;
  return p < 0.65 ? 0 : p < 0.72 ? (p - 0.65) / 0.07 : p < 0.95 ? 1 : 1 - (p - 0.95) / 0.05;
};

const label = (ctx, text, x, y, color = "#fff4e0") => {
  ctx.font = "800 11px 'Baloo 2', sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3; ctx.strokeStyle = "#111"; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
};
const dome = (ctx, x, y, r, color, dim) => {
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(x + 4, y + r * 0.35, r, r * 0.4, 0, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, 2, x, y, r * 1.2);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, dim ? "#9aa1ad" : color); g.addColorStop(1, "#14213d");
  ctx.fillStyle = g; ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.lineTo(x + r, y + r * 0.3); ctx.lineTo(x - r, y + r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
};
const NODE_SHAPE = (ctx, x, y, color, t) => {
  ctx.fillStyle = color; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y + 6); ctx.lineTo(x - 5, y - 6); ctx.lineTo(x + 1, y - 10); ctx.lineTo(x + 8, y - 3); ctx.lineTo(x + 7, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 3 + x)})`; ctx.fillRect(x - 3, y - 6, 3, 3);
};
const portrait = (ctx, img, x, y, r, ring) => {
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(x + 3, y + r + 2, r, r * 0.35, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = "#fff4e0"; ctx.fill(); ctx.clip();
  if (img?.complete && img.naturalWidth) ctx.drawImage(img, img.naturalWidth * 0.22, 0, img.naturalWidth * 0.56, img.naturalWidth * 0.56, x - r, y - r, r * 2, r * 2);
  ctx.restore(); ctx.lineWidth = 3; ctx.strokeStyle = ring; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
};
function drawPoi(ctx, G, p, x, y, t) {
  if (p.minStory !== undefined && G.story < p.minStory) return;
  if (p.secret && !G.visited[p.id]) { ctx.fillStyle = "rgba(20,10,10,0.5)"; ctx.beginPath(); ctx.ellipse(x, y, 12, 7, 0, 0, 7); ctx.fill(); return; }
  switch (p.type) {
    case "station": dome(ctx, x, y, 22, "#e9c46a", p.abandoned); if (p.abandoned) { ctx.strokeStyle = "#111"; ctx.beginPath(); ctx.moveTo(x - 6, y - 18); ctx.lineTo(x, y - 8); ctx.lineTo(x - 4, y); ctx.stroke(); } break;
    case "cave": case "exit": {
      const rim = ctx.createLinearGradient(x - 24, y - 22, x + 22, y + 12);
      rim.addColorStop(0, "#b18369");
      rim.addColorStop(0.5, "#694439");
      rim.addColorStop(1, "#332221");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.moveTo(x - 34, y + 10);
      ctx.lineTo(x - 26, y - 14);
      ctx.lineTo(x - 9, y - 24);
      ctx.lineTo(x + 16, y - 22);
      ctx.lineTo(x + 30, y - 6);
      ctx.lineTo(x + 35, y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#140e11";
      ctx.beginPath();
      ctx.moveTo(x - 23, y + 11);
      ctx.quadraticCurveTo(x - 17, y - 13, x + 1, y - 15);
      ctx.quadraticCurveTo(x + 18, y - 12, x + 24, y + 11);
      ctx.closePath();
      ctx.fill();
      if (p.type === "exit") { ctx.strokeStyle = "#ffc93c"; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x - 8, y + i * 6); ctx.lineTo(x + 8, y + i * 6); ctx.stroke(); } }
      break;
    }
    case "signal": {
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y - 18); ctx.stroke();
      const k = (t * 0.8) % 1; ctx.strokeStyle = `rgba(63,224,255,${1 - k})`; ctx.beginPath(); ctx.arc(x, y - 18, 6 + k * 40, 0, 7); ctx.stroke();
      ctx.fillStyle = "#e0337a"; ctx.beginPath(); ctx.arc(x, y - 18, 5, 0, 7); ctx.fill(); break;
    }
    case "science": {
      const done = G.scanned.includes(p.id);
      ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y - 16); ctx.stroke();
      ctx.fillStyle = done ? "#2a9d8f" : "#ffc93c"; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 16, y - 11); ctx.lineTo(x, y - 6); ctx.fill(); ctx.stroke();
      if (!done) { ctx.strokeStyle = `rgba(255,201,60,${0.5 + 0.5 * Math.sin(t * 4)})`; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.stroke(); }
      break;
    }
    case "egg":
      if (p.id === "egg_door") { ctx.fillStyle = "#ff7a1a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.fillRect(x - 10, y - 30, 20, 36); ctx.strokeRect(x - 10, y - 30, 20, 36); ctx.fillStyle = "#ffc93c"; ctx.beginPath(); ctx.arc(x + 5, y - 12, 3, 0, 7); ctx.fill(); }
      else if (p.id === "egg_face") { ctx.fillStyle = "rgba(60,20,10,0.55)"; ctx.beginPath(); ctx.ellipse(x, y, 60, 75, 0, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(20,5,0,0.6)"; [[-20, -18], [20, -18]].forEach(([a, b]) => { ctx.beginPath(); ctx.ellipse(x + a, y + b, 10, 6, 0, 0, 7); ctx.fill(); }); ctx.fillRect(x - 4, y - 8, 8, 20); ctx.fillRect(x - 22, y + 28, 44, 7); }
      else if (p.id === "egg_potato") { ctx.fillStyle = "#7bd389"; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(x - 30 + (i % 4) * 20, y - 15 + Math.floor(i / 4) * 15, 5, 0, 7); ctx.fill(); } }
      else if (p.id === "egg_monument") { ctx.fillStyle = "#c9a38a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 10, y + 10); ctx.lineTo(x - 5, y - 40); ctx.lineTo(x + 5, y - 40); ctx.lineTo(x + 10, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (p.id === "egg_duck") { ctx.fillStyle = "#ffd60a"; ctx.beginPath(); ctx.ellipse(x, y, 10, 7, 0, 0, 7); ctx.arc(x + 7, y - 7, 5, 0, 7); ctx.fill(); ctx.fillStyle = "#ff7a1a"; ctx.fillRect(x + 11, y - 8, 5, 3); }
      break;
    case "lab": ctx.fillStyle = G.flags.lab_powered ? "#3fe0ff" : "#4a4e69"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.fillRect(x - 30, y - 20, 60, 34); ctx.strokeRect(x - 30, y - 20, 60, 34); ctx.fillStyle = G.flags.lab_powered ? "#fff" : "#222"; for (let i = 0; i < 4; i++) ctx.fillRect(x - 24 + i * 13, y - 12, 8, 8); break;
    case "secret": for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(80,255,180,${0.8 - i * 0.2})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 20 + i * 18, t * (i + 1) * 0.6, t * (i + 1) * 0.6 + 4); ctx.stroke(); } ctx.fillStyle = G.flags.ending ? "#7bd389" : "#3fe0ff"; ctx.beginPath(); ctx.arc(x, y, 12 + Math.sin(t * 3) * 2, 0, 7); ctx.fill(); break;
    default: break;
  }
  if (p.type !== "colony") label(ctx, p.name, x, y + 30);
}

export function render(ctx, G, cw, ch, imgs) {
  const W = world(G), L = W[G.layer], T = G.tmp, t = T.clock;
  const motion = T.reducedMotion ? 0 : t;
  const camX = G.p.x * TILE - cw / 2, camY = G.p.y * TILE - ch / 2, k = RES / TILE;
  ctx.fillStyle = G.layer === "under" ? "#0b080d" : "#2a0f08"; ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(L.canvas, camX * k, camY * k, cw * k, ch * k, 0, 0, cw, ch);
  const S = (x, y) => [x * TILE - camX, y * TILE - camY];
  const vis = (x, y, m = 120) => { const a = x * TILE - camX, b = y * TILE - camY; return a > -m && b > -m && a < cw + m && b < ch + m; };

  if (G.layer === "surface") {
    if (!haze || haze.w !== cw || haze.h !== ch || haze.ctx !== ctx) {
      const gradient = ctx.createRadialGradient(cw / 2, ch * 0.43, ch * 0.18, cw / 2, ch * 0.43, Math.hypot(cw, ch) * 0.54);
      gradient.addColorStop(0, "rgba(218,148,93,0.04)");
      gradient.addColorStop(1, "rgba(68,30,30,0.32)");
      haze = { w: cw, h: ch, ctx, gradient };
    }
    ctx.fillStyle = haze.gradient;
    ctx.fillRect(0, 0, cw, ch);
    const c = colonyPos(W), [cx, cy] = S(c.x, c.y);
    if (vis(c.x, c.y, 400)) {
      ctx.fillStyle = "rgba(255,230,200,0.18)"; ctx.beginPath(); ctx.arc(cx, cy, 12 * TILE, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(255,201,60,0.5)"; ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      Object.entries(BUILDINGS).forEach(([key, b]) => {
        const [x, y] = S(c.x + b.at[0], c.y + b.at[1]);
        if (G.buildings.includes(key)) { dome(ctx, x, y, 20, b.color); label(ctx, b.name, x, y + 26); }
        else { ctx.strokeStyle = "rgba(255,244,224,0.35)"; ctx.setLineDash([4, 4]); ctx.strokeRect(x - 16, y - 12, 32, 24); ctx.setLineDash([]); }
      });
      Object.entries(COLONY_SPOTS).forEach(([key, s]) => { const p = spotPos(W, key, s), [x, y] = S(p.x, p.y); dome(ctx, x, y, s.r * TILE, s.color); label(ctx, s.name, x, y + s.r * TILE * 0.3 + 14, "#ffc93c"); });
      if (G.flags.terraformed) label(ctx, "Welcome to the colony Gratziella", cx, cy - 2.5 * TILE, "#7bd389");
    }
  }
  L.pois.forEach((p) => { if (p.type !== "colony" && vis(p.x, p.y)) { const [x, y] = S(p.x, p.y); drawPoi(ctx, G, p, x, y, motion); } });
  [...L.nodes, ...G.tempNodes.filter((n) => n.layer === G.layer)].forEach((n) => { if (vis(n.x, n.y, 20) && nodeLeft(G, n) > 0) { const [x, y] = S(n.x, n.y); NODE_SHAPE(ctx, x, y, ITEMS[n.type].color, t); } });
  W.collectibles.forEach((c) => {
    if (c.layer !== G.layer || G.collected.includes(c.id) || !vis(c.x, c.y)) return;
    const [x, y] = S(c.x, c.y), s = 8 + Math.sin(t * 4) * 2;
    ctx.fillStyle = "#ffd60a"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + t, r = i % 2 ? s * 0.45 : s; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  if (G.story >= 12) W.fragments.forEach((c) => {
    if (c.layer !== G.layer || G.collected.includes(c.id) || !vis(c.x, c.y)) return;
    const [x, y] = S(c.x, c.y); ctx.fillStyle = "#3fe0ff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 12); ctx.lineTo(x - 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  Object.keys(NPCS).forEach((id) => {
    const p = npcPos(G, W, id);
    if (!p || p.layer !== G.layer || !vis(p.x, p.y)) return;
    const [x, y] = S(p.x, p.y); portrait(ctx, imgs[id], x, y, 15, id === "queen" ? "#e0337a" : id === "lux" ? "#d4af37" : "#ffc93c"); label(ctx, NPCS[id].name.split(" ")[0], x, y + 28);
    if (p.asleep) label(ctx, "Zzz", x + 14 + Math.sin(t * 2) * 3, y - 18 - (t * 8) % 10, "#bde0fe");
  });
  if (G.emerg?.type === "rescue" && G.layer === "surface") {
    const [x, y] = S(G.emerg.x, G.emerg.y); drawRover(ctx, x, y, 0.4);
    ctx.strokeStyle = `rgba(239,35,60,${0.5 + 0.5 * Math.sin(t * 6)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.stroke(); label(ctx, `HELP! ${G.emerg.who}`, x, y - 34, "#ff8fa3");
  }
  livingRenderWorld(ctx, G, W, S, vis, t);
  if (G.rover && G.layer === "surface") { const [x, y] = S(G.rover.x, G.rover.y); drawRover(ctx, x, y, G.rover.h || 0, G.roverStyle); }
  T.meteors.forEach((m) => {
    const [x, y] = S(m.x, m.y), f = 1 - m.t / 2.2;
    ctx.fillStyle = `rgba(0,0,0,${0.2 + f * 0.4})`; ctx.beginPath(); ctx.arc(x, y, 6 + f * 30, 0, 7); ctx.fill();
    ctx.strokeStyle = "#ef233c"; ctx.lineWidth = 2; ctx.stroke();
    if (m.t < 0.5) { ctx.strokeStyle = "#ffc93c"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 80 * m.t * 4, y - 200 * m.t * 2); ctx.lineTo(x, y); ctx.stroke(); }
  });
  const px = cw / 2, py = ch / 2;
  if (!G.inRover) {
    const lift = T.jetting ? 10 + Math.sin(motion * 10) * 2 : 0;
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(px, py + 16, 10 - lift * 0.3, 4, 0, 0, 7); ctx.fill();
    if (T.jetting) { ctx.fillStyle = "#ffc93c"; ctx.beginPath(); ctx.moveTo(px - 6, py + 8 - lift); ctx.lineTo(px, py + 26 - lift + (T.reducedMotion ? 0 : Math.sin(motion * 24) * 3)); ctx.lineTo(px + 6, py + 8 - lift); ctx.fill(); }
    const stride = T.moving && !T.jetting ? Math.abs(Math.sin(motion * 11)) * 2 : 0;
    const a = imgs.alex;
    if (a?.naturalWidth) ctx.drawImage(a, px - 12, py - 26 - lift - stride, 24, 44);
  }
  T.bobPos = T.bobPos || { x: G.p.x, y: G.p.y };
  T.bobPos.x += (G.p.x - 1.3 - T.bobPos.x) * 0.05; T.bobPos.y += (G.p.y - 1 - T.bobPos.y) * 0.05;
  const [bx, by] = S(T.bobPos.x, T.bobPos.y);
  if (imgs.bob?.naturalWidth && !T.hideBob) ctx.drawImage(imgs.bob, bx - 14, by - 18 + Math.sin(motion * 3) * 3, 28, 30);

  // weather
  if (G.layer === "surface" && G.weather.type !== "clear") {
    const storm = G.weather.type === "storm";
    const dust = ctx.createLinearGradient(0, ch * 0.15, cw, ch * 0.8);
    const opacity = storm ? 0.43 + Math.sin(motion * 0.42) * 0.08 : 0.14;
    dust.addColorStop(0, `rgba(207,146,103,${opacity} )`);
    dust.addColorStop(1, `rgba(101,58,45,${opacity * 0.65} )`);
    ctx.fillStyle = dust;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = storm ? "rgba(255,220,176,0.38)" : "rgba(255,220,176,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (!T.reducedMotion) parts.forEach((q, i) => {
      if (!storm && i % 3) return;
      const x = ((q.x * cw + t * 400 * q.s) % (cw + 60)) - 30, y = (q.y * ch + Math.sin(t + i) * 20) % ch;
      ctx.moveTo(x, y); ctx.lineTo(x + 21 * q.s, y + 4);
    });
    ctx.stroke();
  }
  if (G.emerg?.type === "flare" && G.layer === "surface") { ctx.fillStyle = `rgba(255,240,180,${0.15 + 0.1 * Math.sin(motion * 3)})`; ctx.fillRect(0, 0, cw, ch); }

  // lighting
  const dark = G.layer === "under" ? 0.9 : nightAmount(G) * 0.8;
  if (dark > 0.02) {
    if (!lc) lc = document.createElement("canvas");
    if (lc.width !== cw || lc.height !== ch) { lc.width = cw; lc.height = ch; }
    const l = lc.getContext("2d");
    l.globalCompositeOperation = "source-over"; l.clearRect(0, 0, cw, ch);
    l.fillStyle = `rgba(4,4,22,${dark})`; l.fillRect(0, 0, cw, ch);
    l.globalCompositeOperation = "destination-out";
    const light = (x, y, r) => { if (x < -r || y < -r || x > cw + r || y > ch + r) return; const g = l.createRadialGradient(x, y, r * 0.15, x, y, r); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)"); l.fillStyle = g; l.fillRect(x - r, y - r, r * 2, r * 2); };
    const radius = (G.inRover ? 9 : 6) * TILE;
    light(px, py, G.layer === "under" ? radius * 0.55 : radius);
    if (G.layer === "under") {
      const beam = radius * 0.43;
      light(px + Math.cos(G.heading) * beam, py + Math.sin(G.heading) * beam, radius);
    }
    if (G.layer === "surface") { const c = colonyPos(W), [x, y] = S(c.x, c.y); light(x, y, 14 * TILE); }
    L.pois.forEach((p) => { const [x, y] = S(p.x, p.y); if (p.type === "station") light(x, y, 4 * TILE); if (p.id === "lab" && G.flags.lab_powered) light(x, y, 7 * TILE); if (p.type === "secret") light(x, y, 8 * TILE); });
    L.nodes.forEach((n) => { if (n.type === "crystal" && vis(n.x, n.y)) { const [x, y] = S(n.x, n.y); light(x, y, 2 * TILE); } });
    ctx.drawImage(lc, 0, 0);
  }

  livingRenderGlow(ctx, G, W, S, cw, ch, t, G.layer === "under" ? 1 : nightAmount(G));
  // navigation marker
  if (T.photo) return;
  const tg = navPoint(G, W, resolveTarget(G, W));
  if (tg) {
    const [x, y] = S(tg.x, tg.y);
    const on = x > 30 && y > 30 && x < cw - 30 && y < ch - 30;
    if (on) { const b = Math.sin(motion * 5) * 4; ctx.fillStyle = "#ffc93c"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 20 + b); ctx.lineTo(x - 9, y - 36 + b); ctx.lineTo(x + 9, y - 36 + b); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else {
      const a = Math.atan2(y - py, x - px);
      const dx = Math.cos(a), dy = Math.sin(a);
      const radius = Math.min(Math.max(15, cw / 2 - 38) / Math.abs(dx), Math.max(15, ch / 2 - 104) / Math.abs(dy));
      const ax = px + dx * radius, ay = py + dy * radius;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = "#ffc93c"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, `${Math.round(Math.hypot(tg.x - G.p.x, tg.y - G.p.y) * 10)} m`, ax, ay + 26, "#ffc93c");
    }
  }
}
