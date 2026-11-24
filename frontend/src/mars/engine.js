import { DAY_LEN, NPCS, MISSIONS, QUESTS, ACHIEVEMENTS, BOB_LINES, ITEMS, RECIPES, UPGRADES, upgradeCost, BUILDINGS, COLLECTIBLES, ENDINGS, COLONY_SPOTS } from "./content";
import { getWorld, blocked, SIZES } from "./world";
import { hash2 } from "./noise";
import { schedule, livingTarget, secretTarget, livingDaily, livingUpdate, livingNear, livingInteract, sfxEv, cutscene, celebrate, burst, eventOn } from "./living";

const SAVE_KEY = "explore-mars-save-v1";
export const FOG = 3;
const R = () => Math.random();
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const world = (G) => getWorld(!!G.flags.terraformed);
export const colonyPos = (W) => W.surface.pois.find((p) => p.id === "colony");
export const maxO2 = (G) => 100 + 40 * (G.up.suit_o2 || 0);
export const count = (G, k) => (k === "credits" ? G.credits : G.inv[k] || 0);
export const canPay = (G, cost) => Object.entries(cost).every(([k, v]) => count(G, k) >= v);
const pay = (G, cost) => Object.entries(cost).forEach(([k, v]) => (k === "credits" ? (G.credits -= v) : (G.inv[k] -= v)));
export const add = (G, k, n = 1) => { if (k === "credits") G.credits += n; else G.inv[k] = (G.inv[k] || 0) + n; };
const emit = (G, e) => G.tmp.queue.push(e);
export const toast = (G, text) => emit(G, { kind: "toast", text });
export const dialog = (G, lines) => emit(G, { kind: "dialog", lines });
export const bob = (G, key, cd = 45) => {
  const lines = BOB_LINES[key];
  if (!lines?.length) return;
  const t = G.tmp.clock, last = G.tmp.bobCd[key] ?? -999;
  if (t - last < cd || t - G.tmp.bobLast < 8) return;
  G.tmp.bobCd[key] = t; G.tmp.bobLast = t;
  const previous = G.tmp.bobPick[key];
  const index = previous === undefined || lines.length === 1
    ? Math.floor(R() * lines.length)
    : (previous + 1 + Math.floor(R() * (lines.length - 1))) % lines.length;
  G.tmp.bobPick[key] = index;
  emit(G, { kind: "bob", text: lines[index] });
};

export function newGame(name) {
  const c = colonyPos(getWorld(false));
  return {
    v: 1, name, layer: "surface", p: { x: c.x, y: c.y + 3 }, heading: 0,
    o2: 100, hp: 100, en: 100, rad: 0, credits: 120, inv: { o2_canister: 2, repair_kit: 1 },
    time: DAY_LEN * 0.05, sol: 1, weather: { type: "clear", t: 140 }, emerg: null, nextEmerg: 180,
    story: 0, storyStarted: false, missionBase: {}, flags: {}, quests: {}, up: {}, buildings: [],
    scanned: [], visited: {}, collected: [], eggs: [], nodes: {}, tempNodes: [], achievements: [],
    habitat: { wall: 0, floor: 0, decor: [] }, rover: null, inRover: false, waypoint: null,
    stats: { dist: 0, mined: 0, craftedTotal: 0, crafted: {}, jetTime: 0, storms: 0, nightTime: 0, rescues: 0, sold: 0, photos: 0, raceWins: 0, races: 0, tours: 0, dailyDone: 0 },
    salvaged: [], chests: [], robots: [], robotStore: {}, roverStyle: { color: 0, decal: 0 }, secret: { idx: 0, started: false }, daily: null, worldEvent: null, tour: null, race: null, colonyLevel: 1,
    fogData: {},
  };
}

const tmpState = (G) => {
  const fog = {};
  Object.entries(SIZES).forEach(([k, N]) => {
    const n = Math.ceil(N / FOG), a = new Uint8Array(n * n), s = G.fogData?.[k] || "";
    for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) === 49 ? 1 : 0;
    fog[k] = a;
  });
  return { fog, parts: [], queue: [], bobCd: {}, bobPick: {}, bobLast: -99, clock: 0, idle: 0, meteors: [], tick: 0, achTick: 0, near: null, wasNight: false, lowCd: 0 };
};

export function loadGame(name) {
  blockSave = false;
  const initial = newGame(name || "Rookie");
  let G = initial;
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved?.v === 1) G = { ...initial, ...saved, stats: { ...initial.stats, ...saved.stats } };
  } catch { /* invalid or unavailable save */ }
  if (name) G.name = name;
  G.tmp = tmpState(G);
  return G;
}
export const hasSave = () => {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY))?.v === 1; } catch { return false; }
};
let blockSave = false;
export const deleteSave = () => {
  blockSave = true;
  try { localStorage.removeItem(SAVE_KEY); } catch { /* storage unavailable */ }
};
export function saveGame(G) {
  if (blockSave || !G) return false;
  const { tmp, ...rest } = G;
  rest.fogData = Object.fromEntries(Object.entries(tmp.fog).map(([k, a]) => [k, Array.from(a).join("")]));
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(rest));
    return true;
  } catch { return false; }
}

export const isNight = (G) => (G.time % DAY_LEN) / DAY_LEN > 0.7;
export const nodeLeft = (G, n) => {
  const s = G.nodes[n.id];
  if (!s) return 3;
  if (s.left <= 0 && G.time > s.at) { delete G.nodes[n.id]; return 3; }
  return s.left;
};

export function npcPos(G, W, id) {
  const n = NPCS[id];
  if (n.minStory !== undefined && G.story < n.minStory) return null;
  const c = colonyPos(W);
  const wob = Math.sin(G.time * 0.4 + id.length) * 0.6;
  if (id === "vega" && G.story >= 12) return { layer: "surface", x: c.x - 2 + wob, y: c.y + 6 };
  if (n.at) { const s = schedule(G, id, n.at); return { layer: "surface", x: c.x + s.x + (s.asleep ? 0 : wob), y: c.y + s.y, asleep: s.asleep }; }
  const p = W[n.layer || "surface"].pois.find((q) => q.id === n.poi);
  return { layer: n.layer || "surface", x: p.x + 1.6, y: p.y + 0.4 };
}
export const spotPos = (W, key, def) => { const c = colonyPos(W); return { x: c.x + def.at[0], y: c.y + def.at[1] }; };

export function resolveTarget(G, W) {
  if (G.emerg?.type === "rescue") return { layer: "surface", x: G.emerg.x, y: G.emerg.y, label: `Rescue ${G.emerg.who}` };
  const lt = livingTarget(G, W);
  if (lt) return lt;
  if (G.waypoint) return { ...G.waypoint, label: "Waypoint" };
  const m = MISSIONS[G.story];
  if (!m) return secretTarget(G, W);
  const o = m.obj, id = o.poi || m.target || (o.type === "decode" && o.pois.find((p) => !G.flags[`decoded_${p}`]));
  if (o.type === "talk") { const p = npcPos(G, W, o.npc); return p && { ...p, label: NPCS[o.npc].name }; }
  if (id && COLONY_SPOTS[id]) return { layer: "surface", ...spotPos(W, id, COLONY_SPOTS[id]), label: COLONY_SPOTS[id].name };
  if (id) for (const layer of ["surface", "under"]) { const p = W[layer].pois.find((q) => q.id === id); if (p) return { layer, x: p.x, y: p.y, label: p.name }; }
  if (o.type === "have") {
    const need = Object.keys(o.items).find((k) => count(G, k) < o.items[k]);
    if (need === "core_fragment") { const f = W.fragments.find((x) => !G.collected.includes(x.id)); return f && { ...f, label: "Core fragment" }; }
    const L = W[G.layer];
    let n, nearest = Infinity;
    for (const node of L.nodes) {
      if (node.type !== need || nodeLeft(G, node) <= 0) continue;
      const distance = dist(node, G.p);
      if (distance < nearest) { n = node; nearest = distance; }
    }
    return n && { layer: G.layer, x: n.x, y: n.y, label: ITEMS[need].name };
  }
  return null;
}
// If the target is on another layer, point to the nearest cave/exit
export function navPoint(G, W, t) {
  if (!t || t.layer === G.layer) return t;
  const ps = W[G.layer].pois.filter((p) => p.type === (G.layer === "surface" ? "cave" : "exit"));
  const p = ps.sort((a, b) => dist(a, G.p) - dist(b, G.p))[0];
  return { layer: G.layer, x: p.x, y: p.y, label: `${p.name} → ${t.label}` };
}

function daily(G) {
  const b = (k) => G.buildings.includes(k);
  if (b("solar")) add(G, "credits", 60);
  if (b("oxygen")) add(G, "o2_canister", 1);
  if (b("greenhouse")) add(G, "repair_kit", 1);
  if (b("drones")) { add(G, "iron", 3); add(G, "silicon", 3); }
  toast(G, `Sol ${G.sol} begins. Market prices changed!`);
  livingDaily(G, world(G));
}
export const priceMult = (G, item) => 0.7 + hash2(G.sol, Object.keys(ITEMS).indexOf(item), 9) * 0.6;
export const sellPrice = (G, item) => Math.max(1, Math.round(ITEMS[item].price * priceMult(G, item) * (G.buildings.includes("refinery") ? 1.2 : 1)));
export const buyPrice = (G, item) => Math.max(sellPrice(G, item) + 1, Math.round((ITEMS[item].kind === "decor" ? ITEMS[item].price : ITEMS[item].price * priceMult(G, item) * 1.2) * (G.buildings.includes("market_street") ? 0.85 : 1) * (eventOn(G, "caravan") ? 0.7 : 1)));
const NAMES = { credits: "credits" };
export const missing = (G, cost) => { const k = Object.keys(cost).find((x) => count(G, x) < cost[x]); return k && (NAMES[k] || ITEMS[k].name); };
const broke = (G, cost) => {
  const shortfall = Object.entries(cost)
    .filter(([item, amount]) => count(G, item) < amount)
    .map(([item, amount]) => `${amount - count(G, item)} ${NAMES[item] || ITEMS[item].name}`);
  toast(G, `Still needed: ${shortfall.join(", ")}.`);
  bob(G, "broke", 20);
  return false;
};

function nextWeather(G, outsideStorm) {
  const w = G.weather.type;
  if (w === "storm") { if (outsideStorm) { G.stats.storms++; bob(G, "stormEnd", 0); } G.weather = { type: "clear", t: 90 + R() * 80 }; }
  else if (w === "dusty" && R() < 0.55) { G.weather = { type: "storm", t: 45 + R() * 30 }; bob(G, "stormWarn", 0); if (G.layer === "surface") sfxEv(G, "marsWind"); }
  else if (w === "clear" && R() < 0.6) G.weather = { type: "dusty", t: 30 + R() * 25 };
  else G.weather = { type: "clear", t: 60 + R() * 60 };
}

function startEmergency(G, W) {
  G.nextEmerg = 170 + R() * 120;
  if (G.story < 1) return;
  const heroQuest = G.quests.q24?.s === "active";
  const opts = G.layer === "under" ? ["leak"] : ["flare", "meteor", "rescue", "leak", ...(heroQuest ? ["rescue", "rescue"] : [])];
  const type = opts[Math.floor(R() * opts.length)];
  if (type === "rescue") {
    const L = W.surface;
    for (let i = 0; i < 200; i++) {
      const a = R() * Math.PI * 2, d = 18 + R() * 22, x = G.p.x + Math.cos(a) * d, y = G.p.y + Math.sin(a) * d;
      if (!blocked(L, x, y) && !blocked(L, x + 1, y) && !blocked(L, x, y + 1)) {
        const who = ["Andreea", "Maria", "Ionuț", "Goran", "Patrick"][Math.floor(R() * 5)];
        G.emerg = { type, t: 150, x, y, who };
        bob(G, "rescue", 0);
        return;
      }
    }
    return;
  }
  G.emerg = { type, t: type === "flare" ? 35 : type === "meteor" ? 25 : 60, spawn: 0 };
  bob(G, type, 0);
}

function die(G, W) {
  const c = colonyPos(W);
  G.credits = Math.floor(G.credits * 0.75);
  Object.keys(G.inv).forEach((k) => { if (ITEMS[k]?.kind === "res") G.inv[k] = Math.floor(G.inv[k] / 2); });
  Object.assign(G, { hp: 60, o2: maxO2(G), en: 60, rad: 0, layer: "surface", inRover: false, emerg: null, p: { x: c.x, y: c.y + 3 } });
  if (G.rover) G.rover = { x: c.x + 5, y: c.y + 4.5, h: 0 };
  G.tmp.meteors = [];
  dialog(G, [["bob", BOB_LINES.death[0]], ["bob", "You lost a quarter of your credits and half of your resources. Medical bills on Mars are wild."]]);
}

const shelterAt = (G, W) => {
  const L = W[G.layer];
  if (G.layer === "surface" && dist(G.p, colonyPos(W)) < 13) return "colony";
  return L.pois.find((p) => (p.type === "station" || (p.id === "lab" && G.flags.lab_powered)) && dist(p, G.p) < 4) ? "station" : null;
};

function move(G, L, dx, dy, jet) {
  const ok = (x, y) => {
    const b = blocked(L, x, y);
    return b === 0 || b === 3 || (b === 1 && (jet || blocked(L, G.p.x, G.p.y) === 1));
  };
  let hit = false;
  if (ok(G.p.x + dx, G.p.y)) G.p.x += dx; else hit = true;
  if (ok(G.p.x, G.p.y + dy)) G.p.y += dy; else hit = true;
  if (hit && blocked(L, G.p.x + dx, G.p.y + dy) === 1) bob(G, "mountain", 60);
}

export function update(G, inp, dt) {
  const W = world(G), L = W[G.layer], T = G.tmp, up = G.up;
  T.clock += dt;
  G.time += dt;
  const sol = Math.floor(G.time / DAY_LEN) + 1;
  if (sol !== G.sol) { G.sol = sol; daily(G); }
  const night = isNight(G);
  if (night !== T.wasNight) { T.wasNight = night; bob(G, night ? "night" : "dawn", 0); }
  const storm = G.weather.type === "storm" && G.layer === "surface";
  G.weather.t -= dt;
  if (G.weather.t <= 0) nextWeather(G, T.stormOutside);
  if (G.weather.type !== "storm") T.stormOutside = false;

  // emergencies
  G.nextEmerg -= dt;
  if (!G.emerg && G.nextEmerg <= 0) startEmergency(G, W);
  const E = G.emerg;
  if (E) {
    E.t -= dt;
    if (E.type === "meteor" && G.layer === "surface") {
      E.spawn -= dt;
      if (E.spawn <= 0) { E.spawn = 0.9; T.meteors.push({ x: G.p.x + (R() - 0.5) * 14, y: G.p.y + (R() - 0.5) * 10, t: 2.2 }); }
    }
    if (E.type === "rescue" && G.layer === "surface" && dist(E, G.p) < 2.2) {
      const reward = Math.round(120 * (G.buildings.includes("bunker") ? 1.5 : 1));
      add(G, "credits", reward); G.stats.rescues++;
      dialog(G, [["you", `${E.who}, I'm here!`], ["bob", `${E.who}: "Thank you! I almost became a Mars statue." Reward: ${reward} credits.`]]);
      G.emerg = null;
    } else if (E.t <= 0) {
      if (E.type === "rescue") toast(G, `${E.who} was picked up by the colony drone. Rescue failed.`);
      G.emerg = null;
    }
  }
  T.meteors.forEach((m) => {
    m.t -= dt;
    if (m.t <= 0) {
      if (dist(m, G.p) < 1.5) { G.hp -= 25 * (G.inRover ? 1 - 0.25 * (up.rover_armor || 0) : 1); toast(G, "OUCH! Meteor hit!"); }
      if (!blocked(L, m.x, m.y)) G.tempNodes.push({ id: `m${Math.round(G.time * 10)}${Math.round(m.x)}`, layer: "surface", x: m.x, y: m.y, type: "meteorite" });
    }
  });
  T.meteors = T.meteors.filter((m) => m.t > 0);
  if (G.tempNodes.length > 12) G.tempNodes.shift();

  // movement
  const mag = Math.min(1, Math.hypot(inp.x, inp.y));
  T.moving = false;
  const jet = inp.jet && G.flags.jetpack && !G.inRover && G.en > 1;
  let speed = G.inRover ? 7.5 * (1 + 0.25 * (up.rover_speed || 0)) * (G.en <= 0 ? 0.25 : 1) : jet ? 7 : 4;
  if (storm) speed *= G.inRover ? 0.65 : 0.75;
  if (mag > 0.05) {
    const ang = Math.atan2(inp.y, inp.x);
    const sx = G.p.x, sy = G.p.y;
    move(G, L, Math.cos(ang) * speed * mag * dt, Math.sin(ang) * speed * mag * dt, jet);
    const moved = Math.hypot(G.p.x - sx, G.p.y - sy);
    T.moving = moved > 0;
    G.stats.dist += moved;
    G.heading = ang;
    T.idle = 0;
    if (G.inRover) G.en -= 0.5 * (1 - 0.25 * (up.rover_battery || 0)) * dt * mag;
  } else T.idle += dt;
  if (jet) { G.stats.jetTime += dt; G.en -= 6 * (1 - 0.25 * (up.jet_fuel || 0)) * dt; if (G.stats.jetTime < 1) bob(G, "jet", 9999); }
  T.jetting = jet;
  if (G.inRover && G.rover) Object.assign(G.rover, { x: G.p.x, y: G.p.y, h: G.heading });
  if (T.idle > 45) { T.idle = 0; bob(G, "idle", 90); }

  // survival
  const shelter = shelterAt(G, W);
  const outdoor = G.layer === "surface" && !shelter;
  const flare = E?.type === "flare";
  if (shelter) {
    G.o2 += 25 * dt;
    G.en += (shelter === "colony" && G.buildings.includes("solar") ? 20 : 12) * dt;
    G.rad -= (shelter === "colony" && G.buildings.includes("bunker") ? 15 : 5) * dt;
    if (G.o2 > 0) G.hp += (shelter === "colony" && G.buildings.includes("greenhouse") ? 3 : 1.5) * dt;
  } else {
    G.o2 += G.inRover ? 3 * dt : -0.6 * (E?.type === "leak" ? 2.5 : storm ? 1.25 : G.layer === "under" ? 0.85 : 1) * dt;
    if (outdoor && !night && !storm && !G.inRover) G.en += 0.25 * dt;
    if (night && outdoor && !G.inRover) { G.en -= 0.25 * dt; G.stats.nightTime += dt; }
  }
  if (G.layer === "surface" && !shelter && (!night || flare)) {
    let g = flare ? 2.2 : 0.12;
    if (G.inRover) g *= 0.6 * (1 - 0.25 * (up.rover_armor || 0));
    G.rad += g * (1 - 0.3 * (up.suit_rad || 0)) * dt;
  } else if (!shelter) G.rad -= 0.3 * dt;
  if (storm && outdoor) { T.stormOutside = true; if (!G.inRover) G.hp -= 0.4 * dt; }
  if (G.o2 <= 0) G.hp -= 4 * dt;
  if (G.en <= 0 && night && outdoor && !G.inRover) G.hp -= 1 * dt;
  if (G.rad > 80) G.hp -= (G.rad - 80) * 0.08 * dt;
  G.o2 = Math.min(maxO2(G), Math.max(0, G.o2));
  G.en = Math.min(100, Math.max(0, G.en));
  G.rad = Math.min(100, Math.max(0, G.rad));
  G.hp = Math.min(100, G.hp);
  if (G.hp <= 0) return die(G, W);
  if (G.o2 < 25) bob(G, "lowOxygen", 40);
  if (G.en < 15) bob(G, "lowEnergy", 50);
  if (G.rad > 70) bob(G, "highRad", 40);

  // fog + visits
  const fog = T.fog[G.layer], n = Math.ceil(L.N / FOG), r = G.inRover ? 12 : 9;
  for (let y = Math.floor((G.p.y - r) / FOG); y <= (G.p.y + r) / FOG; y++)
    for (let x = Math.floor((G.p.x - r) / FOG); x <= (G.p.x + r) / FOG; x++)
      if (x >= 0 && y >= 0 && x < n && y < n && Math.hypot(x * FOG + 1.5 - G.p.x, y * FOG + 1.5 - G.p.y) < r) fog[y * n + x] = 1;
  L.pois.forEach((p) => {
    if (!G.visited[p.id] && dist(p, G.p) < 3 && (p.minStory === undefined || G.story >= p.minStory)) { G.visited[p.id] = true; toast(G, `Discovered: ${p.name}`); }
  });
  if (G.waypoint && G.waypoint.layer === G.layer && dist(G.waypoint, G.p) < 2) { G.waypoint = null; toast(G, "Waypoint reached"); }

  T.tick += dt;
  if (T.tick > 0.5) { T.tick = 0; checkProgress(G); }
  T.achTick += dt;
  if (T.achTick > 2) { T.achTick = 0; checkAchievements(G); }
  livingUpdate(G, W, dt, mag > 0.05);
  T.near = findNear(G, W);
}

// ---------- interactions ----------
export function findNear(G, W) {
  const L = W[G.layer], P = G.p, opts = [];
  const push = (o, x, y, rad = 1.8) => { const d = Math.hypot(x - P.x, y - P.y); if (d < rad) opts.push({ ...o, d }); };
  if (G.rover && !G.inRover && G.layer === "surface") push({ kind: "rover", label: "Get in the rover" }, G.rover.x, G.rover.y, 2.2);
  if (G.layer === "surface") Object.entries(COLONY_SPOTS).forEach(([k, s]) => { const p = spotPos(W, k, s); push({ kind: "spot", id: k, label: `Open ${s.name}` }, p.x, p.y, s.r + 1.2); });
  const talkTo = MISSIONS[G.story]?.obj.npc;
  Object.keys(NPCS).forEach((k) => { const p = npcPos(G, W, k); if (p && p.layer === G.layer) push({ kind: "npc", id: k, asleep: p.asleep, label: p.asleep ? `${NPCS[k].name} (sleeping)` : `Talk to ${NPCS[k].name}`, pri: k === talkTo ? 1.2 : 0 }, p.x, p.y, 2); });
  livingNear(G, W, push);
  W.collectibles.forEach((c) => { if (c.layer === G.layer && !G.collected.includes(c.id)) push({ kind: "pickup", id: c.id, label: `Pick up ${c.name}` }, c.x, c.y, 1.6); });
  if (G.story >= 12) W.fragments.forEach((c) => { if (c.layer === G.layer && !G.collected.includes(c.id)) push({ kind: "pickup", id: c.id, label: "Pick up Memory Core Fragment" }, c.x, c.y, 1.6); });
  [...L.nodes, ...G.tempNodes.filter((t) => t.layer === G.layer)].forEach((nd) => { if (nodeLeft(G, nd) > 0) push({ kind: "node", node: nd, label: `Mine ${ITEMS[nd.type].name}` }, nd.x, nd.y, 1.7); });
  L.pois.forEach((p) => {
    if (p.minStory !== undefined && G.story < p.minStory) return;
    const lab = { cave: `Enter ${p.name}`, exit: "Climb back to the surface", signal: `Decode ${p.name}`, egg: `Inspect: ${p.name}`, lab: "Use the lab terminal", secret: "Touch the machine core" }[p.type];
    if (p.type === "science" && !G.scanned.includes(p.id)) push({ kind: "poi", poi: p, label: `Scan: ${p.name}` }, p.x, p.y, 2.4);
    else if (lab) push({ kind: "poi", poi: p, label: lab }, p.x, p.y, 2.4);
  });
  if (G.inRover) return opts.filter((o) => o.kind !== "chest").sort((a, b) => a.d - b.d)[0] || { kind: "rover", label: "Get out of the rover" };
  return opts.sort((a, b) => a.d - (a.pri || 0) - (b.d - (b.pri || 0)))[0] || null;
}

const SIGNALS = {
  signal_a: "...beep... Ares-7 to anyone... we found tunnels... beep...",
  signal_b: "...the signal is coming from BELOW... the camp is not safe...",
  signal_c: "...meet at the ridge... the heart is deep... repeat, the heart is deep...",
};
const EGGS = {
  egg_door: [["bob", "A door. In the middle of Mars. Standing alone. Mocking us."], ["bob", "Go on. Try to walk through it. For old times' sake."], ["you", "*BONK*"], ["bob", "Rematch lost. Mars 1, cadet 0."]],
  egg_face: [["bob", "The famous 'Face on Mars'! In 1976 people thought aliens built it. It's just a hill with good lighting."], ["bob", "Kind of looks like me. Handsome."]],
  egg_potato: [["bob", "A potato field! Someone has been gardening in the desert."], ["bob", "Your 3 potatoes from the launch? I may have planted them. You're welcome."]],
  egg_monument: [["bob", "The Space Hackers Monument: 'Built by Andreea Vladu, Maria Cojocaru, Ionuț Ivanici, Goran Giuchici and Patrick Drăghina.'"], ["bob", "Legends say they also built me. My sarcasm is 100% their fault."]],
  egg_duck: [["bob", "A rubber duck. Underground. On Mars. I have so many questions."], ["bob", "*squeak*. Okay, I'm keeping it."]],
};

export function interact(G, near, ui) {
  const W = world(G);
  if (!near) return;
  if (livingInteract(G, near, ui, W)) return;
  const c = colonyPos(W);
  switch (near.kind) {
    case "rover":
      G.inRover = !G.inRover;
      if (G.inRover) { G.p = { x: G.rover.x, y: G.rover.y }; bob(G, "rover", 120); } else G.p.x += 1.2;
      return;
    case "spot": return ui.open({ hub: "build", fabricator: "craft", market: "market", habitat: "habitat", garage: "upgrades" }[near.id]);
    case "npc": G.flags[`talk_${near.id}`] = true; return ui.talk(near.id);
    case "pickup": {
      const col = COLLECTIBLES.find((x) => x.id === near.id);
      G.collected.push(near.id); sfxEv(G, "pickup");
      if (col) { dialog(G, [["bob", `Rare collectible: ${col.name}! (${G.collected.filter((x) => x.startsWith("c_")).length}/12)`], ["bob", col.text]]); bob(G, "collectible", 0); }
      else { add(G, "core_fragment"); toast(G, `Memory Core Fragment ${count(G, "core_fragment")}/3`); }
      return;
    }
    case "node": {
      const nd = near.node, amt = 1 + (G.inRover ? G.up.rover_drill || 0 : 0) + (R() < 0.3 ? 1 : 0) + (nd.type === "crystal" && eventOn(G, "bloom") ? 2 : 0);
      burst(G, nd.x, nd.y, 10, [ITEMS[nd.type].color, "#fff4e0"], 2.5); sfxEv(G, "mine");
      add(G, nd.type, amt); G.stats.mined += amt;
      const left = nodeLeft(G, nd) - 1;
      if (nd.id.startsWith("m")) G.tempNodes = G.tempNodes.filter((t) => t.id !== nd.id);
      else G.nodes[nd.id] = { left, at: G.time + 240 };
      toast(G, `+${amt} ${ITEMS[nd.type].name}`);
      if (G.stats.mined < 3 || R() < 0.08) bob(G, "mine", 30);
      return;
    }
    default: break;
  }
  const p = near.poi;
  if (p.type === "cave" || p.type === "exit") {
    if (G.inRover) return dialog(G, [["bob", "The rover doesn't fit in the cave. Park it and walk, cadet."]]);
    const toLayer = p.type === "cave" ? "under" : "surface";
    const dest = W[toLayer].pois.find((q) => q.id === p.link);
    G.layer = toLayer; G.p = { x: dest.x + 1.2, y: dest.y + 1.2 };
    if (toLayer === "under") G.visited.under = true;
    sfxEv(G, "marsAirlock");
    bob(G, toLayer === "under" ? "cave" : "surface", 60);
    return;
  }
  if (p.type === "signal") {
    G.flags[`decoded_${p.id}`] = true;
    sfxEv(G, "marsSignal");
    return dialog(G, [["bob", `${p.name} recorded. Someone actually used the emergency channel for an emergency.`], ["bob", SIGNALS[p.id]]]);
  }
  if (p.type === "science") {
    G.scanned.push(p.id); add(G, "credits", 50);
    dialog(G, [["bob", `Discovery: ${p.name}! +50 credits (${G.scanned.length}/12)`], ["andreea", p.fact]]);
    return bob(G, "discovery", 0);
  }
  if (p.type === "egg") { if (!G.eggs.includes(p.id)) G.eggs.push(p.id); return dialog(G, EGGS[p.id]); }
  if (p.type === "lab") {
    if (G.flags.lab_powered) return dialog(G, [["bob", "Lab log: 'The Hollow is a machine older than humanity. Its power could change Mars forever.'"]]);
    if (G.story >= 10 && count(G, "battery") >= 2) { G.inv.battery -= 2; G.flags.lab_powered = true; return toast(G, "Lab power restored!"); }
    return dialog(G, [["bob", "The lab is dead. It needs 2 batteries to power up. Batteries are printed at the colony 3D printer."]]);
  }
  if (p.type === "secret") {
    if (G.flags.ending) return dialog(G, [["bob", "The machine hums happily. It remembers you."]]);
    if (G.story >= 14) return ui.open("ending");
    return dialog(G, [["bob", "A giant glowing machine. It ignores us. Rude. Maybe we need to learn more first."]]);
  }
  void c;
}

// ---------- missions, quests, achievements ----------
const objDone = (G, o) => {
  switch (o.type) {
    case "talk": return !!G.flags[`talk_${o.npc}`];
    case "have": return Object.entries(o.items).every(([k, v]) => count(G, k) >= v);
    case "craft": return (G.stats.crafted[o.item] || 0) > (G.missionBase.crafted?.[o.item] || 0);
    case "goto": return !!G.visited[o.poi];
    case "decode": return o.pois.every((p) => G.flags[`decoded_${p}`]);
    case "layer": return !!G.visited[o.layer];
    case "flag": return !!G.flags[o.flag];
    default: return false;
  }
};

export function checkProgress(G) {
  const m = MISSIONS[G.story];
  if (m && !G.storyStarted) {
    G.storyStarted = true;
    G.missionBase = { crafted: { ...G.stats.crafted } };
    if (m.obj.type === "talk") G.flags[`talk_${m.obj.npc}`] = false;
    dialog(G, m.intro);
  } else if (m && objDone(G, m.obj)) {
    Object.entries(m.reward).forEach(([k, v]) => add(G, k, v));
    if (m.effect === "rover") { const d = world(G).surface.pois.find((p) => p.id === "rover_depot"); G.flags.rover = true; G.rover = { x: d.x + 1.5, y: d.y + 1, h: 0 }; }
    G.story++; G.storyStarted = false;
    sfxEv(G, "success");
    toast(G, `Mission complete: ${m.title}! +${m.reward.credits} credits`);
    dialog(G, m.outro);
  }
  QUESTS.forEach((q) => {
    const st = G.quests[q.id];
    if (st?.s === "active" && q.type !== "deliver" && questMet(G, q, st)) finishQuest(G, q);
  });
}
export const questMet = (G, q, st) => {
  switch (q.type) {
    case "deliver": return count(G, q.target) >= q.n;
    case "scan": return G.scanned.includes(q.target);
    case "visit": return !!G.visited[q.target];
    case "craft": return (G.stats.crafted[q.target] || 0) > (st.base || 0);
    case "build": return G.buildings.includes(q.target);
    case "upgrade": return (G.up[q.target] || 0) >= q.n;
    case "rescue": return G.stats.rescues - (st.base || 0) >= q.n;
    case "sell": return G.stats.sold - (st.base || 0) >= q.n;
    case "collect": return G.collected.includes(q.target);
    default: return false;
  }
};
export const questBase = (G, q) => (q.type === "craft" ? G.stats.crafted[q.target] || 0 : q.type === "rescue" ? G.stats.rescues : q.type === "sell" ? G.stats.sold : 0);
export function acceptQuest(G, q) { G.quests[q.id] = { s: "active", base: questBase(G, q) }; toast(G, `Side quest accepted: ${q.title}`); }
export function finishQuest(G, q) {
  if (q.type === "deliver") G.inv[q.target] -= q.n;
  G.quests[q.id] = { s: "done" };
  add(G, "credits", q.credits);
  toast(G, `Side quest complete: ${q.title}! +${q.credits} credits`);
}

function checkAchievements(G) {
  ACHIEVEMENTS.forEach((a) => { if (!G.achievements.includes(a.id) && a.check(G)) { G.achievements.push(a.id); toast(G, `Achievement unlocked: ${a.name}`); } });
}

// ---------- colony actions ----------
export function craft(G, item) {
  const cost = RECIPES[item];
  if (item === "jetpack" && G.flags.jetpack) return false;
  if (!canPay(G, cost)) return broke(G, cost);
  pay(G, cost);
  if (item === "jetpack") G.flags.jetpack = true; else add(G, item);
  G.stats.crafted[item] = (G.stats.crafted[item] || 0) + 1; G.stats.craftedTotal++;
  bob(G, "craft", 60);
  return true;
}
export function upgrade(G, key) {
  const lvl = G.up[key] || 0, u = UPGRADES[key], cost = upgradeCost(key, lvl);
  if (lvl >= 3) return false;
  if (u.needs && !G.flags[u.needs]) { toast(G, `You need the ${u.needs} first!`); return false; }
  if (!canPay(G, cost)) return broke(G, cost);
  pay(G, cost); G.up[key] = lvl + 1;
  return true;
}
export function build(G, key) {
  const cost = BUILDINGS[key].cost;
  if (G.buildings.includes(key)) return false;
  if (!canPay(G, cost)) return broke(G, cost);
  pay(G, cost); G.buildings.push(key); bob(G, "build", 0); celebrate(G, world(G));
  return true;
}
export function sell(G, item, n) {
  n = Math.min(n, count(G, item));
  if (n <= 0) return;
  G.inv[item] -= n; G.credits += sellPrice(G, item) * n; G.stats.sold += n; sfxEv(G, "coin");
}
export function buy(G, item) {
  const p = buyPrice(G, item);
  if (G.credits < p) return broke(G, { credits: p });
  G.credits -= p; add(G, item); bob(G, "bought", 120); sfxEv(G, "coin");
  return true;
}
export function consumeItem(G, item) {
  const u = ITEMS[item].use;
  if (!u || count(G, item) <= 0) return false;
  const useful = (u.oxygen && G.o2 < maxO2(G)) ||
    (u.health && (G.hp < 100 || G.emerg?.type === "leak")) ||
    (u.energy && G.en < 100) || (u.radiation && G.rad > 0);
  if (!useful) {
    toast(G, `${ITEMS[item].name} kept. No recovery needed.`);
    bob(G, "full", 30);
    return false;
  }
  G.inv[item]--;
  if (u.oxygen) G.o2 = Math.min(maxO2(G), G.o2 + u.oxygen);
  if (u.health) { G.hp = Math.min(100, G.hp + u.health); if (G.emerg?.type === "leak") { G.emerg = null; toast(G, "Suit leak fixed!"); } }
  if (u.energy) G.en = Math.min(100, G.en + u.energy);
  if (u.radiation) G.rad = Math.max(0, G.rad + u.radiation);
  return true;
}
export function sleep(G) {
  if (!isNight(G)) return false;
  G.time = Math.ceil(G.time / DAY_LEN) * DAY_LEN + DAY_LEN * 0.03;
  G.hp = 100; G.en = 100; G.o2 = maxO2(G);
  return true;
}
export function chooseEnding(G, key) {
  G.flags.ending = key;
  if (key === "awaken") G.flags.terraformed = true;
  if (COLLECTIBLES.every((c) => G.collected.includes(c.id))) G.flags.secretEnding = true;
  cutscene(G, key);
  if (G.flags.secretEnding) cutscene(G, "secret");
  const e = ENDINGS[key], lines = [["bob", e.title], ["bob", e.text], ["bob", e.bob]];
  if (G.flags.secretEnding) lines.push(["bob", ENDINGS.secret.title], ["bob", ENDINGS.secret.text], ["bob", ENDINGS.secret.bob]);
  dialog(G, lines);
}
