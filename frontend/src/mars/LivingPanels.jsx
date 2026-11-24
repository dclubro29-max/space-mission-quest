import { useEffect, useReducer, useState } from "react";
import { motion } from "framer-motion";
import { Camera, X, Trash2, Bot, Check, Lock, Crown, SkipForward } from "lucide-react";
import { Modal } from "./Panels";
import { ITEMS } from "./content";
import { ROVER_COLORS, DECALS, LOCKED_STYLE, LUX_SHOP, SECRET_MISSIONS } from "./content2";
import { albumLoad, albumSave, placeName, photoBonus, dailyInfo, startTour, sfxEv } from "./living";
import { world, add, count, canPay, toast, bob } from "./engine";
import { sfx } from "../game/sound";

export const FILTERS = [["Normal", "none"], ["Vintage", "sepia(0.85) contrast(1.05)"], ["Vivid", "saturate(1.8) contrast(1.1)"], ["Alien", "hue-rotate(110deg) saturate(1.6)"], ["Noir", "grayscale(1) contrast(1.35)"]];

export const PhotoOverlay = ({ G, canvasRef, filter, setFilter, onClose }) => {
  const [flash, setFlash] = useState(0);
  const [bobOn, setBobOn] = useState(!G.tmp.hideBob);
  const snap = () => {
    const c = canvasRef.current, w = 640, h = Math.round((w * c.height) / c.width);
    const o = document.createElement("canvas"); o.width = w; o.height = h;
    const x = o.getContext("2d"); x.filter = FILTERS[filter][1]; x.drawImage(c, 0, 0, w, h); x.filter = "none";
    const place = placeName(G, world(G));
    x.fillStyle = "rgba(20,33,61,0.75)"; x.fillRect(0, h - 30, w, 30); x.fillStyle = "#fff4e0"; x.font = "700 15px 'Baloo 2', sans-serif"; x.fillText(`${place} · Sol ${G.sol} · ${G.name}`, 12, h - 10);
    const album = albumLoad();
    album.unshift({ id: Date.now(), img: o.toDataURL("image/jpeg", 0.7), place, sol: G.sol });
    while (album.length > 12 || (album.length > 1 && !albumSave(album))) album.pop();
    G.stats.photos++;
    const bonus = photoBonus(G);
    if (bonus && !G.flags[`photoBonus${G.sol}`]) { G.flags[`photoBonus${G.sol}`] = true; add(G, "credits", bonus); toast(G, `Rare sky photo! +${bonus} credits`); }
    toast(G, "Photo saved to your album"); bob(G, "photo", 60);
    sfx.shutter(); setFlash((f) => f + 1);
  };
  return (
    <div className="photo-ui" data-testid="photo-mode">
      <motion.div key={flash} className="photo-flash" initial={{ opacity: flash ? 0.9 : 0 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />
      <div className="photo-frame" />
      <div className="photo-bar panel">
        <div className="flex gap-1 flex-wrap justify-center">
          {FILTERS.map(([n], i) => <button key={n} data-testid={`photo-filter-${i}`} onClick={() => setFilter(i)} className={`toon-btn !py-1 !px-2 text-[0.65rem] ${filter === i ? "toon-btn-orange" : "toon-btn-navy"}`}>{n}</button>)}
          <button data-testid="photo-bob-toggle" onClick={() => { G.tmp.hideBob = bobOn; setBobOn(!bobOn); }} className="toon-btn toon-btn-navy !py-1 !px-2 text-[0.65rem]">B.O.B. {bobOn ? "on" : "off"}</button>
        </div>
        <div className="flex gap-2 justify-center mt-2">
          <button data-testid="photo-snap-btn" className="toon-btn toon-btn-red" onClick={snap}><Camera size={18} /> Snap</button>
          <button data-testid="photo-close-btn" className="toon-btn toon-btn-navy" onClick={() => { G.tmp.hideBob = false; onClose(); }}><X size={18} /> Done</button>
        </div>
      </div>
    </div>
  );
};

export const AlbumPanel = ({ onClose }) => {
  const [album, setAlbum] = useState(albumLoad);
  const [big, setBig] = useState(null);
  const del = (id) => { const a = album.filter((p) => p.id !== id); albumSave(a); setAlbum(a); setBig(null); };
  return (
    <Modal title={`Photo Album · ${album.length}/12`} onClose={onClose} testid="album-panel" wide>
      {big ? (
        <div className="flex flex-col items-center gap-2">
          <img src={big.img} alt={big.place} className="rounded-xl border-4 border-[#111] max-h-[55vh]" data-testid="album-big" />
          <div className="flex gap-2"><button className="toon-btn toon-btn-navy !py-1 text-xs" onClick={() => setBig(null)}>Back</button><button data-testid="album-delete-btn" className="toon-btn toon-btn-red !py-1 text-xs" onClick={() => del(big.id)}><Trash2 size={14} /> Delete</button></div>
        </div>
      ) : album.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {album.map((p) => <button key={p.id} data-testid={`album-photo-${p.id}`} onClick={() => setBig(p)} className="text-left"><img src={p.img} alt={p.place} className="rounded-lg border-[3px] border-[#111]" /><span className="text-xs font-bold">{p.place}</span></button>)}
        </div>
      ) : <p className="font-bold text-navy/70">No photos yet. Tap the camera button to open Photo Mode!</p>}
      <p className="text-xs font-bold text-navy/50 mt-2">Photos stay in the game on this device (up to 12).</p>
    </Modal>
  );
};

const ROBOT_COST = { credits: 150, iron: 3, silicon: 2 };
const ROBOT_TYPES = ["iron", "silicon", "ice", "titanium", "scrap"];
export const RobotsPanel = ({ G, onClose }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const buyRobot = () => {
    if (G.robots.length >= 5) return;
    if (!canPay(G, ROBOT_COST)) { toast(G, "Not enough resources for a robot!"); sfx.fail(); return refresh(); }
    Object.entries(ROBOT_COST).forEach(([k, v]) => add(G, k, -v)); G.robots.push({ type: "iron" }); sfx.success(); refresh();
  };
  const collect = () => { Object.entries(G.robotStore).forEach(([k, v]) => add(G, k, v)); G.robotStore = {}; sfxEv(G, "coin"); refresh(); };
  const stored = Object.entries(G.robotStore).filter(([, v]) => v > 0);
  return (
    <Modal title={`Robot Factory · ${G.robots.length}/5 robots`} onClose={onClose} testid="robots-panel">
      <p className="text-xs font-bold text-navy/70">Each robot mines 1 resource every 45 seconds (up to 20 stored per type).</p>
      <div className="space-y-2 mt-2">
        {G.robots.map((r, i) => (
          <div key={i} className="mars-row" data-testid={`robot-${i}`}><Bot /><div className="flex-1 font-bold">Robot #{i + 1} mines {ITEMS[r.type].name}</div>
            <button className="toon-btn toon-btn-navy !py-1 !px-3 text-xs" data-testid={`robot-switch-${i}`} onClick={() => { r.type = ROBOT_TYPES[(ROBOT_TYPES.indexOf(r.type) + 1) % ROBOT_TYPES.length]; G.tmp.robTarget = {}; refresh(); }}>Switch</button></div>
        ))}
      </div>
      {G.robots.length < 5 && <button className="toon-btn toon-btn-orange mt-3 w-full justify-center" data-testid="buy-robot-btn" onClick={buyRobot}>Build robot (150 cr, 3 iron, 2 silicon)</button>}
      <div className="mars-row mt-3"><div className="flex-1 text-sm font-bold">Stored: {stored.length ? stored.map(([k, v]) => `${v} ${ITEMS[k].name}`).join(", ") : "nothing yet"}</div>
        <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid="robot-collect-btn" disabled={!stored.length} onClick={collect}>Collect</button></div>
    </Modal>
  );
};

export const ToursPanel = ({ G, onClose }) => (
  <Modal title="Tourist Center" onClose={onClose} testid="tours-panel">
    <p className="font-bold text-navy">Tourists from Earth want to see the wonders of Mars! Lead a group to a landmark before they get bored (about 4 minutes).</p>
    <p className="text-sm font-bold text-navy/70 mt-1">Tours completed: {G.stats.tours}</p>
    {G.tour ? <p className="mars-row mt-3 font-bold">A tour is running. Follow the arrow! {Math.ceil(G.tour.t)}s left</p>
      : <button className="toon-btn toon-btn-orange mt-3 w-full justify-center" data-testid="start-tour-btn" onClick={() => { startTour(G, world(G)); sfx.success(); onClose(); }}>Start a tour</button>}
  </Modal>
);

export const LuxPanel = ({ G, onClose }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const PASS = { credits: 300, crystal: 5 };
  const buyPass = () => { if (!canPay(G, PASS)) { toast(G, "Mayor Lux: 'Not enough, darling. 300 credits and 5 Glow Crystals.'"); sfx.fail(); return refresh(); } add(G, "credits", -300); add(G, "crystal", -5); G.flags.golden_pass = true; sfx.fanfare(); refresh(); };
  const buyLux = (k) => { if (G.credits < ITEMS[k].price) { toast(G, "Not enough credits!"); sfx.fail(); return refresh(); } add(G, "credits", -ITEMS[k].price); add(G, k); sfx.coin(); refresh(); };
  return (
    <Modal title="Aurelia · Mayor Lux" onClose={onClose} testid="lux-panel">
      <p className="bubble text-sm">{G.flags.golden_pass ? "Welcome back, VIP! Only the finest things on Mars." : "Welcome to Aurelia, the Golden City. Our shops are for Golden Pass holders only."}</p>
      {!G.flags.golden_pass ? (
        <button className="toon-btn toon-btn-orange mt-3 w-full justify-center" data-testid="buy-pass-btn" onClick={buyPass}><Crown size={16} /> Golden Pass (300 cr + 5 Glow Crystals)</button>
      ) : (
        <div className="space-y-2 mt-3">
          {LUX_SHOP.map((k) => <div key={k} className="mars-row" data-testid={`lux-${k}`}><div className="flex-1 font-bold">{ITEMS[k].name} <span className="text-navy/60">×{count(G, k)}</span></div><span className="font-display text-xs">{ITEMS[k].price} cr</span><button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`buy-lux-${k}`} onClick={() => buyLux(k)}>Buy</button></div>)}
          <div className="mars-row"><div className="flex-1 font-bold">Sell Martian Gold ×{count(G, "martian_gold")}</div><span className="font-display text-xs">225 cr</span><button className="toon-btn toon-btn-navy !py-1 !px-3 text-xs" data-testid="lux-sell-gold" disabled={!count(G, "martian_gold")} onClick={() => { add(G, "martian_gold", -1); add(G, "credits", 225); G.stats.sold++; sfx.coin(); refresh(); }}>Sell</button></div>
        </div>
      )}
    </Modal>
  );
};

export const CustomsTab = ({ G }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  if (!G.flags.rover) return <p className="font-bold text-navy/70">Get a rover first (story mission 4).</p>;
  const set = (key, v, cost) => {
    if (LOCKED_STYLE[key] === v && !G.stats.raceWins) { toast(G, "Win a race against B.O.B. to unlock this!"); sfx.fail(); return refresh(); }
    if (G.credits < cost) { toast(G, "Not enough credits!"); sfx.fail(); return refresh(); }
    add(G, "credits", -cost); G.roverStyle = { ...G.roverStyle, [key]: v }; sfx.success(); refresh();
  };
  return (
    <div data-testid="customs-tab">
      <div className="font-display text-xs text-orange">Paint (40 cr)</div>
      <div className="flex gap-2 mt-1 flex-wrap">{ROVER_COLORS.map((c, i) => <button key={c} data-testid={`paint-${i}`} aria-label={`Paint ${i + 1}`} className={`swatch ${G.roverStyle.color === i ? "swatch-on" : ""}`} style={{ background: c }} onClick={() => set("color", i, 40)}>{LOCKED_STYLE.color === i && !G.stats.raceWins && <Lock size={12} />}</button>)}</div>
      <div className="font-display text-xs text-orange mt-3">Decal (60 cr)</div>
      <div className="flex gap-2 mt-1 flex-wrap">{DECALS.map((d, i) => <button key={d} data-testid={`decal-${i}`} className={`toon-btn !py-1 !px-3 text-xs ${G.roverStyle.decal === i ? "toon-btn-orange" : "toon-btn-navy"}`} onClick={() => set("decal", i, 60)}>{d}{LOCKED_STYLE.decal === i && !G.stats.raceWins ? " (locked)" : ""}</button>)}</div>
      <p className="text-xs font-bold text-navy/60 mt-3">Tip: honk with the horn button while driving. B.O.B. loves it. (He doesn't.)</p>
    </div>
  );
};

export const DailyList = ({ G }) => (
  <div className="space-y-2" data-testid="daily-list">
    <p className="text-xs font-bold text-navy/70">New challenges every sol (Mars day). Today: Sol {G.sol}{G.worldEvent?.sol === G.sol ? ` · Event: ${G.worldEvent.type}` : ""}</p>
    {dailyInfo(G).map((d) => <div key={d.id} className={`mars-row ${d.done ? "mars-row-done" : ""}`} data-testid={`daily-${d.id}`}>{d.done ? <Check className="text-teal-700" /> : <span className="font-display text-xs">{Math.max(0, Math.round(d.prog))}/{d.n}</span>}<div className="flex-1 font-bold text-sm">{d.text}</div><span className="level-chip !text-[0.6rem]">+{d.reward}</span></div>)}
  </div>
);

export const SecretList = ({ G }) => (
  <div className="space-y-2" data-testid="secret-list">
    {SECRET_MISSIONS.map((m, i) => {
      const done = i < G.secret.idx, now = i === G.secret.idx && G.secret.started;
      return <div key={i} className={`mars-row ${done ? "mars-row-done" : now ? "mars-row-now" : "opacity-60"}`} data-testid={`secret-${i}`}>{done ? <Check className="text-teal-700" /> : now ? <span className="font-display text-orange">▶</span> : <Lock size={16} />}<div className="flex-1"><div className="font-display text-xs">{done || now ? m.title : "??? Secret mission"}</div>{now && <div className="text-sm font-semibold">{m.goal}</div>}</div></div>;
    })}
    <p className="text-xs font-bold text-navy/60">Hint: old spacecraft hold old secrets...</p>
  </div>
);

// ---------- animated cutscenes ----------
const Planet = ({ from, to, size = 220, delay = 0 }) => <motion.div className="cs-planet" style={{ width: size, height: size }} initial={{ background: from }} animate={{ background: to }} transition={{ duration: 6, delay }} />;
const SCENES = {
  awaken: { bg: "#1a0b2e", caps: ["The ancient machine roars to life...", "Clouds gather over the red deserts.", "Rain falls on Mars for the first time in 3 billion years!", "A NEW BLUE MARS is born."], art: () => (<><Planet from="radial-gradient(circle at 35% 35%, #ff9a5a, #8c2f14)" to="radial-gradient(circle at 35% 35%, #8fd3ff, #1d6fa5 55%, #3f8f4f)" />{[0, 1, 2].map((i) => <motion.div key={i} className="cs-cloud" style={{ top: 140 + i * 50 }} initial={{ x: -300, opacity: 0 }} animate={{ x: 300, opacity: [0, 1, 1, 0] }} transition={{ duration: 7, delay: 1 + i, repeat: Infinity }} />)}<div className="cs-rain" /></>) },
  seal: { bg: "#08131f", caps: ["You place your hand on the machine...", "Giant doors slide shut, one by one.", "The Hollow sleeps again, safe for a million years.", "You are THE GUARDIAN of Mars."], art: () => (<>{[0, 1, 2].map((i) => <motion.div key={i} className="cs-ring" style={{ width: 300 - i * 70, height: 300 - i * 70 }} initial={{ scale: 1.4, opacity: 1 }} animate={{ scale: 0.2, opacity: 0.2 }} transition={{ duration: 5, delay: i * 0.8 }} />)}<motion.div className="cs-door cs-door-l" initial={{ x: -260 }} animate={{ x: 0 }} transition={{ duration: 2.5, delay: 4 }} /><motion.div className="cs-door cs-door-r" initial={{ x: 260 }} animate={{ x: 0 }} transition={{ duration: 2.5, delay: 4 }} /></>) },
  share: { bg: "#050a1a", caps: ["You open a channel to Earth...", "Terabytes of ancient knowledge fly across space.", "Scientists from every country work together.", "A GIFT TO HUMANITY."], art: () => (<div className="flex items-center gap-[30vw]"><Planet from="radial-gradient(circle at 35% 35%, #ff9a5a, #8c2f14)" to="radial-gradient(circle at 35% 35%, #ff9a5a, #8c2f14)" size={140} /><Planet from="radial-gradient(circle at 35% 35%, #8fd3ff, #1d6fa5 60%, #3f8f4f)" to="radial-gradient(circle at 35% 35%, #8fd3ff, #1d6fa5 60%, #3f8f4f)" size={100} />{[0, 1, 2, 3, 4].map((i) => <motion.span key={i} className="cs-data" initial={{ left: "30%" }} animate={{ left: "70%" }} transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity }} />)}</div>) },
  secret: { bg: "#0b1d1a", caps: ["One last memory appears in the light...", "A tiny robot, built on Mars long ago.", "He was never lost. He was waiting for a friend.", "B.O.B. REMEMBERS."], art: () => (<><motion.img src="/game/bob.png" alt="B.O.B." className="w-48" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: [0, -14, 0] }} transition={{ duration: 3, y: { repeat: Infinity, duration: 2.5 } }} />{[0, 1, 2].map((i) => <motion.div key={i} className="cs-ring !border-[#50ffb4]" style={{ width: 200 + i * 80, height: 200 + i * 80 }} animate={{ rotate: 360 }} transition={{ duration: 8 + i * 3, repeat: Infinity, ease: "linear" }} />)}</>) },
  alien: { bg: "#0d0618", caps: ["The Black Monolith begins to glow...", "A tall figure of light steps out.", "It doesn't speak. It sings in colors.", "FIRST CONTACT."], art: () => (<><div className="cs-monolith" /><motion.svg width="140" height="200" viewBox="0 0 140 200" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 3, delay: 1.5 }}><ellipse cx="70" cy="60" rx="44" ry="52" fill="#9cffd0" stroke="#111" strokeWidth="5" /><ellipse cx="52" cy="58" rx="12" ry="18" fill="#111" /><ellipse cx="88" cy="58" rx="12" ry="18" fill="#111" /><circle cx="56" cy="52" r="4" fill="#fff" /><circle cx="92" cy="52" r="4" fill="#fff" /><path d="M40 120 Q70 100 100 120 L110 200 L30 200 Z" fill="#9cffd0" stroke="#111" strokeWidth="5" /></motion.svg></>) },
  garden: { bg: "#1b0f2e", caps: ["The Star Seed sinks into Martian soil...", "Glowing flowers bloom across the colony.", "Everyone comes out to dance under the stars.", "THE GARDEN OF STARS."], art: () => (<div className="flex items-end gap-6">{[0, 1, 2, 3, 4].map((i) => <motion.div key={i} className="cs-flower" initial={{ height: 0 }} animate={{ height: 60 + (i % 3) * 40 }} transition={{ duration: 2, delay: 0.6 * i }}><span style={{ background: ["#c77dff", "#ffd60a", "#3fe0ff"][i % 3] }} /></motion.div>)}</div>) },
};

export const Cutscene = ({ id, onDone }) => {
  const sc = SCENES[id];
  const [i, setI] = useState(0);
  useEffect(() => { sfx.fanfare(); }, []);
  useEffect(() => { if (i >= sc.caps.length - 1) return; const t = setTimeout(() => setI(i + 1), 3200); return () => clearTimeout(t); }, [i, sc]);
  const Art = sc.art;
  return (
    <div className="cutscene" style={{ background: sc.bg }} data-testid={`cutscene-${id}`}>
      <div className="cs-stars" />
      <div className="cs-art"><Art /></div>
      <motion.p key={i} className="cs-cap font-display" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} data-testid="cutscene-caption">{sc.caps[i]}</motion.p>
      <button className="skip-btn" data-testid="cutscene-skip-btn" onClick={onDone}>Skip <SkipForward size={16} /></button>
      {i === sc.caps.length - 1 && <button className="toon-btn toon-btn-orange cs-continue" data-testid="cutscene-continue-btn" onClick={onDone}>Continue</button>}
    </div>
  );
};
