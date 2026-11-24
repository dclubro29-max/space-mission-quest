import { DAY_LEN, NPCS, BUILDINGS, ITEMS, POIS } from "./content";
import { SECRET_MISSIONS, SECRET_BUILDING, DAILY_TYPES, WORLD_EVENTS, ROVER_COLORS, COLONIST_NAMES, COLONIST_LINES, CHEST_LOOT, DECALS } from "./content2";
import { add, toast, dialog, bob, colonyPos, count, isNight } from "./engine";
import { hash2 } from "./noise";
import { TILE } from "./world";

const R = Math.random;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const sfxEv = (G, name) => G.tmp.queue.push({ kind: "sfx", name });
export const cutscene = (G, key) => G.tmp.queue.push({ kind: "cutscene", key });
export const colonyLevel = (G) => Math.min(6, 1 + Math.floor(G.buildings.length / 2));
const phase = (G) => (G.time % DAY_LEN) / DAY_LEN;
export const festival = (G) => G.sol % 3 === 0 && phase(G) > 0.62 && phase(G) < 0.82;
export const eventOn = (G, t) => G.worldEvent?.sol === G.sol && G.worldEvent.type === t;
const poiOf = (W, id) => W.surface.pois.find((p) => p.id === id) || W.under.pois.find((p) => p.id === id);

// ---------- NPC schedules ----------
const STAFF = ["andreea", "maria", "ionut", "goran", "patrick"];
export function schedule(G, id, at) {
  const i = STAFF.indexOf(id), ph = phase(G);
  if (i < 0) return { x: at[0], y: at[1] };
  if (festival(G) || (ph > 0.62 && ph < 0.72)) { const a = (i / 5) * Math.PI * 2 + G.time * 0.05; return { x: Math.cos(a) * 3.4, y: Math.sin(a) * 3.4, party: festival(G) }; }
  if (ph >= 0.72) return { x: -5 + i * 2.5, y: 9.2, asleep: true };
  if (ph > 0.3 && ph < 0.42) return { x: 3 + (i % 3) * 1.2, y: -3.2 - Math.floor(i / 3) };
  return { x: at[0], y: at[1] };
}

// ---------- colonists ----------
export const colonists = (G, W) => {
  const c = colonyPos(W), n = Math.min(12, 2 + G.buildings.length + (G.buildings.includes("residential") ? 4 : 0));
  return Array.from({ length: n }, (_, i) => {
    const a = i * 2.4 + G.time * 0.03 * (i % 2 ? 1 : -1), r = 5.5 + (i % 4) * 1.4;
    return { i, name: COLONIST_NAMES[i], x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r };
  });
};

// ---------- spawn helpers ----------
export const burst = (G, x, y, n = 30, colors = ["#ff7a1a", "#ffc93c", "#e0337a", "#3fe0ff", "#7bd389"], sp = 4) => {
  const col = colors[Math.floor(R() * colors.length)];
  for (let k = 0; k < n; k++) { const a = R() * 7, v = sp * (0.4 + R()); G.tmp.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1.5, life: 1.2 + R() * 0.6, c: col, s: 3 }); }
};
export function celebrate(G, W) {
  const c = colonyPos(W);
  for (let k = 0; k < 5; k++) setTimeout(() => { burst(G, c.x + (R() - 0.5) * 10, c.y - 2 + (R() - 0.5) * 8); sfxEv(G, "pop"); }, k * 350);
}

// ---------- daily ----------
const statVal = (G, s) => G.stats[s] || 0;
function ensureDaily(G) {
  if (G.daily?.sol === G.sol) return;
  const pool = [...DAILY_TYPES], list = [];
  for (let k = 0; list.length < 3; k++) { const j = Math.floor(hash2(G.sol, k, 77) * pool.length); list.push(pool.splice(j, 1)[0]); }
  G.daily = { sol: G.sol, list: list.map((d) => ({ id: d.id, base: statVal(G, d.stat), done: false })) };
}
export const dailyInfo = (G) => (G.daily?.list || []).map((d) => { const t = DAILY_TYPES.find((x) => x.id === d.id); return { ...d, text: t.text(t.n), reward: t.reward, prog: Math.min(t.n, statVal(G, t.stat) - d.base), n: t.n }; });

export function livingDaily(G, W) {
  if (G.buildings.includes("residential")) add(G, "credits", 40);
  G.worldEvent = null;
  if (R() < 0.38) {
    const keys = Object.keys(WORLD_EVENTS), type = keys[Math.floor(R() * keys.length)];
    G.worldEvent = { type, sol: G.sol };
    dialog(G, [["bob", `RARE EVENT: ${WORLD_EVENTS[type].name}!`], ["bob", WORLD_EVENTS[type].text]]);
    if (type === "bigmeteor" && G.layer === "surface") for (let k = 0; k < 5; k++) G.tempNodes.push({ id: `mbig${G.sol}${k}`, layer: "surface", x: G.p.x + 8 + R() * 3, y: G.p.y - 4 + R() * 3, type: "meteorite" });
  }
  ensureDaily(G);
  void W;
}

// ---------- secret missions ----------
function secretProgress(G, W) {
  const S = SECRET_MISSIONS[G.secret.idx];
  if (!S) return;
  if (!G.secret.started) {
    if (S.trigger(G)) { G.secret.started = true; toast(G, `SECRET MISSION: ${S.title}`); dialog(G, S.intro); sfxEv(G, "fanfare"); }
    return;
  }
  if (S.done(G)) {
    Object.entries(S.reward).forEach(([k, v]) => add(G, k, v));
    G.secret.idx++; G.secret.started = false;
    toast(G, `Secret mission complete: ${S.title}! +${S.reward.credits} credits`);
    dialog(G, S.outro);
    if (G.secret.idx >= 5) { cutscene(G, "garden"); celebrate(G, W); }
  }
}
export function secretTarget(G, W) {
  const S = SECRET_MISSIONS[G.secret.idx];
  if (!S || !G.secret.started) return null;
  if (S.target === "greenhouse_b") { const c = colonyPos(W), b = BUILDINGS.greenhouse.at; return { layer: "surface", x: c.x + b[0], y: c.y + b[1], label: "Greenhouse" }; }
  const p = poiOf(W, S.target);
  return { layer: p.layer, x: p.x, y: p.y, label: S.title };
}

// ---------- race / tour ----------
export const raceCps = (W) => { const p = poiOf(W, "race_track"); return Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; return { x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 8 }; }); };
const LAPS = 16;
export function livingTarget(G, W) {
  if (G.race && G.race.wait <= 0) { const cp = raceCps(W)[G.race.cp % 8]; return { layer: "surface", ...cp, label: `Checkpoint ${G.race.cp + 1}/${LAPS}` }; }
  if (G.tour) { const p = poiOf(W, G.tour.poi); return { layer: "surface", x: p.x, y: p.y, label: `Tour: ${p.name}` }; }
  return null;
}
export function startTour(G, W) {
  const pool = W.surface.pois.filter((p) => (p.type === "science" || p.type === "egg" || p.type === "wreck") && dist(p, G.p) > 15);
  const p = pool[Math.floor(R() * pool.length)];
  G.tour = { poi: p.id, t: 260 };
  toast(G, `Tour started: take the tourists to ${p.name}!`);
}

// ---------- update ----------
export function livingUpdate(G, W, dt, moving) {
  const T = G.tmp, P = G.p;
  // particles
  if (moving && G.layer === "surface" && R() < (G.inRover ? 0.8 : 0.25)) T.parts.push({ x: P.x - Math.cos(G.heading) * 0.6, y: P.y - Math.sin(G.heading) * 0.6 + 0.4, vx: (R() - 0.5) * 0.8, vy: -0.3, g: 0, life: 0.8, c: G.weather.type === "storm" ? "#d9a070" : "#c88a5a", s: G.inRover ? 5 : 3 });
  if (T.jetting && R() < 0.9) T.parts.push({ x: P.x + (R() - 0.5) * 0.3, y: P.y + 0.5, vx: (R() - 0.5), vy: 1.5, g: 0, life: 0.6, c: "#bbbbbb", s: 4 });
  T.parts.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.life -= dt; });
  T.parts = T.parts.filter((q) => q.life > 0).slice(-450);
  // festival
  if (festival(G)) {
    if (!T.festNote) { T.festNote = true; bob(G, "festival", 0); }
    if (R() < dt * 1.6) { const c = colonyPos(W); burst(G, c.x + (R() - 0.5) * 12, c.y - 3 + (R() - 0.5) * 8); sfxEv(G, "pop"); }
  } else T.festNote = false;
  // robots
  T.robT = (T.robT || 0) + dt;
  if (T.robT > 45) { T.robT = 0; G.robots.forEach((r) => { G.robotStore[r.type] = Math.min(20, (G.robotStore[r.type] || 0) + 1); }); }
  // tour
  if (G.tour) {
    G.tour.t -= dt;
    const p = poiOf(W, G.tour.poi);
    if (G.layer === "surface" && dist(p, P) < 3.2) {
      const tip = Math.round(150 + G.tour.t * 0.6);
      add(G, "credits", tip); G.stats.tours++; G.tour = null; sfxEv(G, "coin");
      dialog(G, [["bob", `The tourists LOVED ${p.name}! 5-star review! +${tip} credits.`], ["bob", "One of them asked for my autograph. I'm a tourist attraction now."]]);
    } else if (G.tour.t <= 0) { G.tour = null; toast(G, "The tourists got bored and left. 1-star review..."); }
  }
  // race
  const rc = G.race;
  if (rc) {
    if (rc.wait > 0) { const before = Math.ceil(rc.wait); rc.wait -= dt; if (Math.ceil(rc.wait) !== before) { toast(G, rc.wait > 0 ? `${Math.ceil(rc.wait)}...` : "GO!"); sfxEv(G, "beep"); } }
    else {
      rc.bob += dt * (0.62 + 0.08 * Math.min(G.stats.raceWins, 6));
      const cps = raceCps(W);
      if (dist(cps[rc.cp % 8], P) < 2.6) { rc.cp++; sfxEv(G, "beep"); }
      const track = poiOf(W, "race_track");
      if (rc.cp >= LAPS) { G.race = null; G.stats.raceWins++; G.stats.races++; add(G, "credits", 250); sfxEv(G, "fanfare"); bob(G, "raceWin", 0); toast(G, "YOU WON THE RACE! +250 credits. Gold paint & flames unlocked!"); }
      else if (rc.bob >= LAPS) { G.race = null; G.stats.races++; sfxEv(G, "fail"); bob(G, "raceLose", 0); toast(G, "B.O.B. won the race. Try upgrading your rover motor!"); }
      else if (!G.inRover || dist(track, P) > 24 || G.layer !== "surface") { G.race = null; toast(G, "Race cancelled."); }
    }
  }
  T.livTick = (T.livTick || 0) + dt;
  if (T.livTick > 0.5) {
    T.livTick = 0;
    ensureDaily(G);
    G.daily.list.forEach((d) => {
      const t = DAILY_TYPES.find((x) => x.id === d.id);
      if (!d.done && statVal(G, t.stat) - d.base >= t.n) { d.done = true; G.stats.dailyDone++; add(G, "credits", t.reward); toast(G, `Daily challenge done: ${t.text(t.n)} +${t.reward}`); sfxEv(G, "coin"); }
    });
    secretProgress(G, W);
    const lvl = colonyLevel(G);
    if (lvl > (G.colonyLevel || 1)) { G.colonyLevel = lvl; toast(G, `The colony grew to level ${lvl}! New homes and colonists!`); celebrate(G, W); }
  }
}

// ---------- interactions ----------
export const chestSpots = (W) => [3, 11, 19, 27, 35, 43, 51, 59].map((k, i) => { const n = W.under.nodes[k]; return { id: `chest${i}`, i, x: n.x + 0.8, y: n.y }; });

export function livingNear(G, W, push) {
  const c = colonyPos(W);
  if (G.layer === "under") chestSpots(W).forEach((ch) => { if (!G.chests.includes(ch.id)) push({ kind: "chest", ch, label: "Open treasure chest" }, ch.x, ch.y, 1.7); });
  if (G.layer !== "surface") return;
  W.surface.pois.forEach((p) => {
    if (p.type === "wreck") push({ kind: "wreck", poi: p, label: G.salvaged.includes(p.id) ? `Read log: ${p.name}` : `Salvage ${p.name}` }, p.x, p.y, 2.6);
    if (p.type === "race" && !G.race) push({ kind: "race", label: "Start race vs B.O.B. (needs rover)" }, p.x, p.y, 3);
    if (p.type === "alien") push({ kind: "alien", label: "Touch the Black Monolith" }, p.x, p.y, 2.6);
  });
  colonists(G, W).forEach((n) => push({ kind: "colonist", n, label: `Chat with ${n.name}` }, n.x, n.y, 1.5));
  const b = (k, kind, label) => { if (G.buildings.includes(k)) { const at = BUILDINGS[k].at; push({ kind, label }, c.x + at[0], c.y + at[1], 2.4); } };
  b("spaceport", "tourism", "Open Tourist Center");
  b("robot_factory", "robots", "Open Robot Factory");
  if (G.secret.idx === 4 && G.secret.started) b("greenhouse", "plant", count(G, "star_seed") ? "Plant the Star Seed" : "Greenhouse (you need the Star Seed)");
}

export function livingInteract(G, near, ui, W) {
  switch (near.kind) {
    case "npc": if (near.id === "lux") { ui.open("lux"); return true; } if (near.asleep) { bob(G, "sleepy", 0); dialog(G, [["bob", `${NPCS[near.id].name} is sleeping. Zzz... Come back in the morning.`]]); return true; } return false;
    case "chest": {
      const loot = CHEST_LOOT[near.ch.i];
      G.chests.push(near.ch.id);
      Object.entries(loot).forEach(([k, v]) => add(G, k, v));
      burst(G, near.ch.x, near.ch.y, 24, ["#ffd60a", "#d4af37"], 3); sfxEv(G, "coin");
      dialog(G, [["bob", `Treasure! ${Object.entries(loot).map(([k, v]) => `${v} ${k === "credits" ? "credits" : ITEMS[k].name}`).join(", ")}. (${G.chests.length}/8 chests)`]]);
      return true;
    }
    case "wreck": {
      const p = near.poi;
      if (!G.salvaged.includes(p.id)) {
        G.salvaged.push(p.id);
        Object.entries(p.loot).forEach(([k, v]) => add(G, k, v));
        if (p.map) G.flags.treasureMap = true;
        sfxEv(G, "pickup");
        dialog(G, [["bob", `Salvaged: ${Object.entries(p.loot).map(([k, v]) => `${v} ${ITEMS[k].name}`).join(", ")}${p.map ? " + TREASURE MAP (chests now show on the underground map)" : ""}.`], ["andreea", p.text]]);
      } else dialog(G, [["andreea", p.text]]);
      return true;
    }
    case "race":
      if (!G.inRover) { dialog(G, [["bob", "Race on foot? Cute. Bring your rover, I'm not THAT slow."]]); return true; }
      G.race = { cp: 0, bob: 0, wait: 3.5 }; bob(G, "race", 0); toast(G, `Race! ${LAPS} checkpoints (2 laps). Follow the arrow!`);
      return true;
    case "alien":
      if (!G.flags.alien_met) {
        if (!isNight(G)) { dialog(G, [["bob", "A tall black stone. Silent. Cold. The colonists say it only 'wakes up' at night."]]); return true; }
        G.flags.alien_met = true; cutscene(G, "alien");
        dialog(G, [["bob", "The visitor speaks in music and light. B.O.B. translation mode: ON."], ["bob", "'We built The Hollow long ago, to help a young world. We were waiting for kind explorers.'"], ["bob", "'Bring us 3 pieces of fallen sky, and we will give you a seed of stars.'"]]);
        return true;
      }
      if (!G.flags.star_seed && count(G, "meteorite") >= 3) { G.inv.meteorite -= 3; G.flags.star_seed = true; add(G, "star_seed"); cutscene(G, "alien"); dialog(G, [["bob", "The monolith glows... a Star Seed appears! Plant it in the colony greenhouse."]]); return true; }
      dialog(G, [["bob", G.flags.star_seed ? "The monolith hums softly. It seems happy." : `The visitor waits for 3 Meteorite Chunks. You have ${count(G, "meteorite")}.`]]);
      return true;
    case "colonist": dialog(G, [["bob", `${near.n.name}: "${COLONIST_LINES[Math.floor(hash2(near.n.i, G.sol, 5) * COLONIST_LINES.length)]}"`]]); return true;
    case "tourism": ui.open("tours"); return true;
    case "robots": ui.open("robots"); return true;
    case "plant":
      if (count(G, "star_seed")) { G.inv.star_seed--; G.buildings.push("star_garden"); celebrate(G, W); toast(G, "The Star Garden is blooming!"); }
      else dialog(G, [["bob", "We need the Star Seed from the Black Monolith first."]]);
      return true;
    default: return false;
  }
}

// ---------- rendering ----------
const house = (ctx, x, y, color) => {
  ctx.fillStyle = color; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 10, Math.PI, 0); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x - 10, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffe8a3"; ctx.fillRect(x - 2, y - 4, 4, 6);
};
export function drawRover(ctx, x, y, h, style = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(h);
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-15, -9, 34, 24);
  ctx.fillStyle = "#222"; [[-12, -13], [6, -13], [-12, 9], [6, 9]].forEach(([a, b]) => ctx.fillRect(a, b, 9, 5));
  ctx.fillStyle = ROVER_COLORS[style.color || 0]; ctx.strokeStyle = "#111"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-16, -10, 32, 20, 6); ctx.fill(); ctx.stroke();
  const d = DECALS[style.decal || 0];
  if (d === "Stripes") { ctx.fillStyle = "#fff4e0"; ctx.fillRect(-14, -3, 15, 2); ctx.fillRect(-14, 1, 15, 2); }
  if (d === "Stars") { ctx.fillStyle = "#ffd60a"; [[-10, -5], [-4, 3], [-12, 4]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 2, 0, 7); ctx.fill(); }); }
  if (d === "Flames") { ctx.fillStyle = "#ffc93c"; ctx.beginPath(); ctx.moveTo(-16, -6); ctx.lineTo(-4, -2); ctx.lineTo(-12, 0); ctx.lineTo(-2, 3); ctx.lineTo(-16, 6); ctx.fill(); }
  if (d === "B.O.B. face") { ctx.fillStyle = "#fff4e0"; ctx.beginPath(); ctx.arc(-7, 0, 6, 0, 7); ctx.fill(); ctx.fillStyle = "#111"; ctx.fillRect(-10, -2, 2, 2); ctx.fillRect(-6, -2, 2, 2); }
  ctx.fillStyle = "#3fe0ff"; ctx.beginPath(); ctx.roundRect(2, -7, 10, 14, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function livingRenderWorld(ctx, G, W, S, vis, t) {
  if (G.layer === "under") {
    chestSpots(W).forEach((ch) => {
      if (G.chests.includes(ch.id) || !vis(ch.x, ch.y)) return;
      const [x, y] = S(ch.x, ch.y);
      ctx.fillStyle = "#8d5a2b"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.fillRect(x - 10, y - 7, 20, 14); ctx.strokeRect(x - 10, y - 7, 20, 14);
      ctx.fillStyle = "#d4af37"; ctx.fillRect(x - 10, y - 2, 20, 3); ctx.fillRect(x - 2, y - 4, 4, 6);
      ctx.fillStyle = `rgba(255,214,10,${0.3 + 0.3 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.arc(x, y - 12, 3, 0, 7); ctx.fill();
    });
  } else {
    const c = colonyPos(W);
    if (vis(c.x, c.y, 500)) {
      const lvl = colonyLevel(G);
      for (let k = 0; k < lvl * 3; k++) { const a = (k / (lvl * 3)) * Math.PI * 2 + 0.3, [x, y] = S(c.x + Math.cos(a) * 12.4, c.y + Math.sin(a) * 12.4); house(ctx, x, y, ["#f4a261", "#bde0fe", "#ffd6e0", "#d8f3dc"][k % 4]); }
      if (G.buildings.includes("star_garden")) {
        const b = SECRET_BUILDING.star_garden, [x, y] = S(c.x + b.at[0], c.y + b.at[1]);
        for (let k = 0; k < 7; k++) { const a = k * 0.9 + t * 0.5; ctx.fillStyle = ["#c77dff", "#ffd60a", "#3fe0ff"][k % 3]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 14, y + Math.sin(a) * 8, 4, 0, 7); ctx.fill(); }
        ctx.font = "800 11px 'Baloo 2'"; ctx.fillStyle = "#fff4e0"; ctx.textAlign = "center"; ctx.fillText(b.name, x, y + 22);
      }
      colonists(G, W).forEach((n) => {
        if (!vis(n.x, n.y)) return;
        const [x, y] = S(n.x, n.y), hop = Math.abs(Math.sin(t * 4 + n.i)) * 2;
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(x, y + 8, 6, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#fff4e0"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - hop, 7, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#3a86ff"; ctx.fillRect(x - 4, y - 3 - hop, 8, 4);
      });
      G.robots.forEach((r, i) => {
        G.tmp.robTarget = G.tmp.robTarget || {};
        if (!G.tmp.robTarget[r.type]) G.tmp.robTarget[r.type] = W.surface.nodes.filter((n) => n.type === r.type).sort((a, b) => dist(a, c) - dist(b, c))[0] || c;
        const tg = G.tmp.robTarget[r.type];
        const k = (Math.sin(t * 0.15 + i * 1.7) + 1) / 2, rx = c.x + (tg.x - c.x) * k, ry = c.y + (tg.y - c.y) * k;
        if (!vis(rx, ry)) return;
        const [x, y] = S(rx, ry);
        ctx.fillStyle = "#adb5bd"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.fillRect(x - 7, y - 6, 14, 12); ctx.strokeRect(x - 7, y - 6, 14, 12);
        ctx.fillStyle = Math.sin(t * 6 + i) > 0 ? "#ef233c" : "#7bd389"; ctx.beginPath(); ctx.arc(x, y - 9, 2.5, 0, 7); ctx.fill();
      });
    }
    W.surface.pois.forEach((p) => {
      if (!vis(p.x, p.y, 300)) return;
      const [x, y] = S(p.x, p.y);
      if (p.type === "wreck") {
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5); ctx.fillStyle = G.salvaged.includes(p.id) ? "#6c757d" : "#ced4da"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-26, 8); ctx.lineTo(-10, -12); ctx.lineTo(22, -8); ctx.lineTo(28, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#3a86ff"; ctx.fillRect(-4, -6, 8, 6); ctx.restore();
        ctx.font = "800 11px 'Baloo 2'"; ctx.textAlign = "center"; ctx.fillStyle = "#fff4e0"; ctx.fillText(p.name, x, y + 30);
      }
      if (p.type === "race") {
        ctx.strokeStyle = "rgba(255,244,224,0.35)"; ctx.lineWidth = 3 * TILE; ctx.beginPath(); ctx.arc(x, y, 8 * TILE, 0, 7); ctx.stroke();
        raceCps(W).forEach((cp, i) => { const [a, b] = S(cp.x, cp.y), next = G.race && G.race.cp % 8 === i; ctx.fillStyle = next ? "#ffc93c" : "#fff4e0"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.fillRect(a - 2, b - 22, 4, 22); ctx.beginPath(); ctx.moveTo(a + 2, b - 22); ctx.lineTo(a + 16, b - 17); ctx.lineTo(a + 2, b - 12); ctx.fill(); ctx.stroke(); });
        ctx.font = "800 12px 'Baloo 2'"; ctx.textAlign = "center"; ctx.fillStyle = "#ffc93c"; ctx.fillText(p.name, x, y);
        if (G.race) { const cps = raceCps(W), k = G.race.bob % 8, a = cps[Math.floor(k)], b = cps[(Math.floor(k) + 1) % 8], f = k % 1, [bx, by] = S(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f); drawRover(ctx, bx, by, Math.atan2(b.y - a.y, b.x - a.x), { color: 5, decal: 3 }); }
      }
      if (p.type === "city" && G.visited.city) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, [dx, dy] = [Math.cos(a) * 60, Math.sin(a) * 40]; ctx.fillStyle = "#d4af37"; ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + dx, y + dy, k % 2 ? 16 : 22, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (p.type === "city") { ctx.font = "800 12px 'Baloo 2'"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd60a"; ctx.fillText(G.visited.city ? p.name : "???", x, y + 70); }
      if (p.type === "alien") {
        const glow = isNight(G) ? 0.5 + 0.5 * Math.sin(t * 2) : 0;
        ctx.fillStyle = "#111"; ctx.strokeStyle = `rgba(199,125,255,${glow})`; ctx.lineWidth = 4; ctx.fillRect(x - 8, y - 48, 16, 56); ctx.strokeRect(x - 8, y - 48, 16, 56);
        ctx.font = "800 11px 'Baloo 2'"; ctx.textAlign = "center"; ctx.fillStyle = "#e0c3fc"; ctx.fillText(p.name, x, y + 22);
      }
    });
    if (G.tour) for (let k = 0; k < 3; k++) { const [x, y] = S(G.p.x - Math.cos(G.heading) * (1.2 + k * 0.8) + (k - 1) * 0.4, G.p.y - Math.sin(G.heading) * (1.2 + k * 0.8)); ctx.fillStyle = ["#e0337a", "#3a86ff", "#7bd389"][k]; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  const camX = S(0, 0);
  G.tmp.parts.forEach((q) => { const x = q.x * TILE + camX[0], y = q.y * TILE + camX[1]; ctx.globalAlpha = Math.max(0, Math.min(1, q.life)); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(x, y, q.s, 0, 7); ctx.fill(); });
  ctx.globalAlpha = 1;
}

export function livingRenderGlow(ctx, G, W, S, cw, ch, t, night) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const glow = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const dark = G.layer === "under" ? 1 : night;
  if (dark > 0.1) {
    if (G.layer === "surface") { const c = colonyPos(W), [x, y] = S(c.x, c.y); glow(x, y, 12 * TILE, `rgba(255,170,80,${0.22 * dark})`); }
    W[G.layer].pois.forEach((p) => { const [x, y] = S(p.x, p.y); if (x < -300 || y < -300 || x > cw + 300 || y > ch + 300) return; if (p.type === "secret") glow(x, y, 7 * TILE, "rgba(60,255,170,0.25)"); if (p.type === "alien") glow(x, y - 20, 4 * TILE, `rgba(199,125,255,${0.35 * dark})`); if (p.type === "city" && G.visited.city) glow(x, y, 6 * TILE, `rgba(255,214,10,${0.25 * dark})`); });
    W[G.layer].nodes.forEach((n) => { if (n.type !== "crystal") return; const [x, y] = S(n.x, n.y); if (x > -60 && y > -60 && x < cw + 60 && y < ch + 60) glow(x, y, 50, "rgba(63,224,255,0.3)"); });
  }
  ctx.restore();
  if (G.layer !== "surface") return;
  const ph = (G.time % DAY_LEN) / DAY_LEN, dusk = Math.max(0, 1 - Math.abs(ph - 0.68) / 0.06);
  if (dusk > 0) { ctx.fillStyle = `rgba(255,120,60,${0.18 * dusk})`; ctx.fillRect(0, 0, cw, ch); }
  if (eventOn(G, "aurora") && night > 0.3) for (let k = 0; k < 3; k++) { const g = ctx.createLinearGradient(0, 0, 0, ch * 0.6); g.addColorStop(0, `rgba(80,255,170,${0.2 * night})`); g.addColorStop(1, "rgba(80,255,170,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= cw; x += 40) ctx.lineTo(x, 60 + k * 50 + Math.sin(x / 120 + t * (0.6 + k * 0.2)) * 40); ctx.lineTo(cw, 0); ctx.fill(); }
  if (eventOn(G, "comet")) { const k = (t * 0.03) % 1, x = cw * (1.1 - k * 1.2), y = 40 + k * 120; const g = ctx.createLinearGradient(x, y, x + 220, y - 60); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(120,200,255,0)"); ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 220, y - 60); ctx.stroke(); }
}

// ---------- album (in-game only, this device) ----------
const ALBUM_KEY = "explore-mars-album";
export const albumLoad = () => { try { return JSON.parse(localStorage.getItem(ALBUM_KEY)) || []; } catch { return []; } };
export const albumSave = (a) => { try { localStorage.setItem(ALBUM_KEY, JSON.stringify(a)); return true; } catch { return false; } };
export function placeName(G, W) {
  const p = W[G.layer].pois.slice().sort((a, b) => dist(a, G.p) - dist(b, G.p))[0];
  return p && dist(p, G.p) < 12 ? p.name : G.layer === "under" ? "Underground tunnels" : "Martian wilderness";
}
export const photoBonus = (G) => (eventOn(G, "comet") || (eventOn(G, "aurora") && isNight(G)) ? 100 : 0);
void POIS;
