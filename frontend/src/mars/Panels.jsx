import { useEffect, useReducer, useRef, useState } from "react";
import { X, Check, Lock, Save, LogOut, Trash2, MapPin } from "lucide-react";
import { MISSIONS, QUESTS, ACHIEVEMENTS, COLLECTIBLES, ITEMS, RESOURCES, UPGRADES, NPCS } from "./content";
import { SIZES } from "./world";
import { world, colonyPos, consumeItem, count, questMet, saveGame, deleteSave, FOG, resolveTarget, toast } from "./engine";
import { sfx } from "../game/sound";
import { DailyList, SecretList } from "./LivingPanels";
import { chestSpots } from "./living";

export const Modal = ({ title, onClose, children, testid, wide }) => (
  <div className="mars-modal-bg" onClick={onClose}>
    <div className={`panel mars-modal ${wide ? "mars-modal-wide" : ""}`} data-testid={testid} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="font-display text-lg text-navy">{title}</h2>
        <button autoFocus data-testid="modal-close-btn" aria-label="Close" onClick={onClose}><X /></button>
      </div>
      {children}
    </div>
  </div>
);
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex gap-2 mb-3 flex-wrap">
    {tabs.map(([k, l]) => <button key={k} data-testid={`tab-${k}`} onClick={() => onChange(k)} className={`toon-btn !py-1 !px-3 text-xs ${value === k ? "toon-btn-orange" : "toon-btn-navy"}`}>{l}</button>)}
  </div>
);

const MARK = { colony: "#ffc93c", station: "#e9c46a", cave: "#111", exit: "#ffc93c", signal: "#e0337a", science: "#7bd389", egg: "#ff7a1a", lab: "#3fe0ff", secret: "#50ffb4" };

export const MapPanel = ({ G, onClose }) => {
  const [layer, setLayer] = useState(G.layer);
  const [, refresh] = useReducer((x) => x + 1, 0);
  const ref = useRef(null);
  const size = Math.max(120, Math.min(560, window.innerWidth - 70, window.innerHeight - 210));
  const W = world(G), L = W[layer], N = SIZES[layer], s = size / N;
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.drawImage(L.canvas, 0, 0, size, size);
    const fog = G.tmp.fog[layer], n = Math.ceil(N / FOG);
    const fc = document.createElement("canvas"); fc.width = fc.height = n;
    const fx = fc.getContext("2d"), img = fx.createImageData(n, n);
    for (let i = 0; i < fog.length; i++) img.data.set([12, 8, 22, fog[i] ? 0 : 230], i * 4);
    fx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(fc, 0, 0, n * FOG * s, n * FOG * s);
    const radar = G.buildings.includes("radar");
    const dot = (x, y, c, r = 5) => { ctx.fillStyle = c; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x * s, y * s, r, 0, 7); ctx.fill(); ctx.stroke(); };
    ctx.font = "700 10px 'Baloo 2'";
    L.pois.forEach((p) => {
      if (p.minStory !== undefined && G.story < p.minStory) return;
      if (!(G.visited[p.id] || (radar && !p.secret))) return;
      dot(p.x, p.y, MARK[p.type]);
      ctx.fillStyle = "#fff4e0"; ctx.fillText(p.name, p.x * s + 7, p.y * s + 3);
    });
    if (G.emerg?.type === "rescue" && layer === "surface") dot(G.emerg.x, G.emerg.y, "#ef233c", 7);
    const t = resolveTarget(G, W);
    if (t && t.layer === layer) { ctx.strokeStyle = "#ffc93c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x * s, t.y * s, 10, 0, 7); ctx.stroke(); }
    if (layer === "under" && G.flags.treasureMap) chestSpots(W).filter((c) => !G.chests.includes(c.id)).forEach((c) => dot(c.x, c.y, "#d4af37", 4));
    if (G.layer === layer) { dot(G.p.x, G.p.y, "#ffffff", 6); dot(G.p.x, G.p.y, "#3a86ff", 3); }
  });
  const click = (e) => {
    const r = ref.current.getBoundingClientRect();
    G.waypoint = { layer, x: ((e.clientX - r.left) / r.width) * N, y: ((e.clientY - r.top) / r.height) * N };
    toast(G, "Waypoint set"); sfx.select(); refresh();
  };
  return (
    <Modal title="World Map" onClose={onClose} testid="map-panel" wide>
      <Tabs tabs={[["surface", "Surface"], ["under", "Underground"]]} value={layer} onChange={setLayer} />
      <div className="flex flex-col items-center gap-2">
        <canvas ref={ref} width={size} height={size} onClick={click} className="mars-map-canvas" data-testid="map-canvas" />
        <div className="flex gap-2 flex-wrap justify-center text-xs font-bold">
          {[["You", "#3a86ff"], ["Science", "#7bd389"], ["Signal", "#e0337a"], ["Station", "#e9c46a"], ["Target", "#ffc93c"]].map(([l, c]) => <span key={l} className="flex items-center gap-1"><i className="w-3 h-3 rounded-full border-2 border-[#111] inline-block" style={{ background: c }} />{l}</span>)}
        </div>
        <p className="text-xs font-bold text-navy/70 flex items-center gap-1"><MapPin size={12} /> Tap the map to set a waypoint. {G.buildings.includes("radar") ? "Radar Tower reveals all places." : "Build a Radar Tower to reveal every place."}</p>
        {G.waypoint && <button className="toon-btn toon-btn-navy !py-1 !px-3 text-xs" data-testid="clear-waypoint-btn" onClick={() => { G.waypoint = null; refresh(); }}>Clear waypoint</button>}
      </div>
    </Modal>
  );
};

export const BagPanel = ({ G, onClose }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const of = (kind) => Object.keys(ITEMS).filter((k) => ITEMS[k].kind === kind && count(G, k) > 0);
  return (
    <Modal title="Inventory" onClose={onClose} testid="bag-panel" wide>
      <h3 className="font-display text-xs text-orange">Resources</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
        {RESOURCES.map((k) => <div key={k} className="mars-chip" data-testid={`bag-${k}`}><i style={{ background: ITEMS[k].color }} />{ITEMS[k].name}<b>{count(G, k)}</b></div>)}
      </div>
      <h3 className="font-display text-xs text-orange mt-4">Supplies</h3>
      <div className="space-y-2 mt-1">
        {of("use").length ? of("use").map((k) => (
          <div key={k} className="mars-row"><div className="flex-1 font-bold">{ITEMS[k].name} ×{count(G, k)} <span className="text-xs text-navy/60">{ITEMS[k].desc}</span></div>
            <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`use-${k}`} onClick={() => { if (consumeItem(G, k)) sfx.success(); else sfx.fail(); refresh(); }}>Use</button></div>
        )) : <p className="text-sm font-bold text-navy/60">No supplies. Print some at the 3D printer!</p>}
      </div>
      <h3 className="font-display text-xs text-orange mt-4">Gear & items</h3>
      <div className="flex flex-wrap gap-2 mt-1 text-sm font-bold">
        <span className="mars-chip">Rover: {G.flags.rover ? "Yes" : "No"}</span>
        <span className="mars-chip">Jetpack: {G.flags.jetpack ? "Yes" : "No"}</span>
        {Object.entries(UPGRADES).map(([k, u]) => G.up[k] ? <span key={k} className="mars-chip">{u.name} Lv{G.up[k]}</span> : null)}
        {[...of("key"), ...of("decor")].map((k) => <span key={k} className="mars-chip">{ITEMS[k].name} ×{count(G, k)}</span>)}
      </div>
    </Modal>
  );
};

export const QuestPanel = ({ G, onClose }) => {
  const [tab, setTab] = useState("story");
  return (
    <Modal title="Quest Log" onClose={onClose} testid="quest-panel" wide>
      <Tabs tabs={[["story", "Story missions"], ["side", "Side quests"], ["daily", "Daily"], ["secret", "Secret"]]} value={tab} onChange={setTab} />
      {tab === "daily" && <DailyList G={G} />}
      {tab === "secret" && <SecretList G={G} />}
      <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
        {tab === "daily" || tab === "secret" ? null : tab === "story" ? MISSIONS.map((m, i) => (
          <div key={i} className={`mars-row ${i === G.story ? "mars-row-now" : ""}`} data-testid={`story-${i}`}>
            {i < G.story ? <Check className="text-teal-700" /> : i === G.story ? <span className="font-display text-orange">▶</span> : <Lock size={16} className="text-navy/40" />}
            <div className="flex-1"><div className="font-display text-xs">{i + 1}. {i <= G.story ? m.title : "???"}</div>{i === G.story && <div className="text-sm font-semibold">{m.goal}</div>}</div>
          </div>
        )) : QUESTS.map((q) => {
          const st = G.quests[q.id];
          const status = st?.s === "done" ? "Done" : st ? (q.type === "deliver" && questMet(G, q, st) ? `Turn in to ${NPCS[q.giver].name.split(" ")[0]}` : "Active") : G.story >= q.minStory ? `Talk to ${NPCS[q.giver].name.split(" ")[0]}` : "Locked";
          return (
            <div key={q.id} className={`mars-row ${st?.s === "active" ? "mars-row-now" : ""}`} data-testid={`side-${q.id}`}>
              <div className="flex-1"><div className="font-display text-xs">{status === "Locked" ? "???" : q.title}</div>{status !== "Locked" && <div className="text-xs font-semibold">{q.text}</div>}</div>
              <span className="level-chip !text-[0.55rem]">{status}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs font-bold text-navy/60 mt-2">{Object.values(G.quests).filter((q) => q.s === "done").length}/30 side quests done</p>
    </Modal>
  );
};

export const TrophyPanel = ({ G, onClose }) => {
  const relics = G.collected.filter((c) => c.startsWith("c_"));
  return (
    <Modal title="Trophies & Secrets" onClose={onClose} testid="trophy-panel" wide>
      <div className="flex flex-wrap gap-2 text-xs font-bold mb-3">
        <span className="mars-chip">Achievements {G.achievements.length}/{ACHIEVEMENTS.length}</span>
        <span className="mars-chip">Relics {relics.length}/12</span>
        <span className="mars-chip">Discoveries {G.scanned.length}/12</span>
        <span className="mars-chip">Easter eggs {G.eggs.length}/5</span>
        <span className="mars-chip">Chests {G.chests.length}/8</span>
        <span className="mars-chip">Wrecks {G.salvaged.length}/4</span>
        <span className="mars-chip">Races won {G.stats.raceWins}</span>
      </div>
      <div className="max-h-[55vh] overflow-y-auto pr-1">
        <div className="grid sm:grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => { const on = G.achievements.includes(a.id); return (
            <div key={a.id} className={`mars-row ${on ? "mars-row-done" : "opacity-60"}`} data-testid={`ach-${a.id}`}>{on ? <Check className="text-teal-700" /> : <Lock size={16} />}<div><div className="font-display text-xs">{a.name}</div><div className="text-xs font-semibold">{a.desc}</div></div></div>
          ); })}
        </div>
        <h3 className="font-display text-xs text-orange mt-4">Rare relics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {COLLECTIBLES.map((c) => <div key={c.id} className="mars-chip !justify-center text-center">{relics.includes(c.id) ? c.name : "???"}</div>)}
        </div>
      </div>
    </Modal>
  );
};

export const MenuPanel = ({ G, onClose, onExit }) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal title="Menu" onClose={onClose} testid="menu-panel">
      <div className="text-sm font-bold text-navy space-y-1">
        <p>Move: WASD / arrows or joystick · Interact: E · Rover: R · Jetpack: hold SPACE</p>
        <p>Map: M · Bag: I · Quests: Q · Close: ESC</p>
        <p className="text-navy/60">Progress saves automatically on this device every few seconds.</p>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button className="toon-btn toon-btn-navy justify-center" data-testid="menu-save-btn" onClick={() => { toast(G, saveGame(G) ? "Game saved!" : "Unable to save on this device."); onClose(); }}><Save size={16} /> Save now</button>
        <button className="toon-btn toon-btn-orange justify-center" data-testid="menu-exit-btn" onClick={onExit}><LogOut size={16} /> Save & finish (colony, credits / title)</button>
        <button className="toon-btn toon-btn-red justify-center" data-testid="menu-reset-btn" onClick={() => { if (!confirm) return setConfirm(true); deleteSave(); window.location.reload(); }}>
          <Trash2 size={16} /> {confirm ? "Tap again to erase ALL Mars progress" : "Restart Explore Mars"}
        </button>
      </div>
      <p className="text-xs font-bold text-navy/50 mt-3">Colony: {Math.round(colonyPos(world(G)).x)}, {Math.round(colonyPos(world(G)).y)} · Sol {G.sol}</p>
    </Modal>
  );
};
