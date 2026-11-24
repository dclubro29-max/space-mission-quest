import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Wind, Heart, Zap, Radiation, Map, Backpack, ScrollText, Trophy, Menu, Sun, Moon, CloudFog, Tornado, Coins, Hand, Rocket, CarFront, TriangleAlert, Camera, Images, Megaphone, Sparkles } from "lucide-react";
import { WORLD_EVENTS } from "./content2";
import { sfx } from "../game/sound";
import { MISSIONS } from "./content";
import { maxO2, isNight, navPoint, resolveTarget, world } from "./engine";
import { DAY_LEN } from "./content";

const Bar = ({ icon: Icon, v, max = 100, color, label, warn }) => (
  <div className={`mars-bar ${warn ? "mars-bar-warn" : ""}`} data-testid={`hud-${label}`} title={label}>
    <Icon size={14} />
    <div className="mars-bar-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(v)}><div className="mars-bar-fill" style={{ width: `${(v / max) * 100}%`, background: color }} /></div>
    <span>{Math.round(v)}</span>
  </div>
);

const clock = (G) => {
  const ph = (G.time % DAY_LEN) / DAY_LEN, h = (6 + ph * 24) % 24;
  return `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
};
const COMPASS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
const WEATHER = { clear: [Sun, "Clear"], dusty: [CloudFog, "Dusty"], storm: [Tornado, "DUST STORM"] };
const EMERG = { flare: "SOLAR FLARE: find shelter or go underground!", meteor: "METEOR SHOWER: dodge the shadows!", rescue: "RESCUE: reach the stranded colonist!", leak: "SUIT LEAK: use a repair kit!" };

export const Hud = ({ G, onOpen, onPhoto }) => {
  const m = MISSIONS[G.story];
  const W = world(G);
  const target = navPoint(G, W, resolveTarget(G, W));
  const dx = target?.x - G.p.x;
  const dy = target?.y - G.p.y;
  const meters = target && Math.round(Math.hypot(dx, dy) * 10);
  const bearing = COMPASS[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8];
  const [WIcon, wName] = WEATHER[G.weather.type];
  const night = isNight(G);
  const btns = [["map", Map, "Map (M)"], ["bag", Backpack, "Bag (I)"], ["quests", ScrollText, "Quests (Q)"], ["trophies", Trophy, "Trophies"], ["album", Images, "Photo album"], ["menu", Menu, "Menu"]];
  return (
    <>
      <div className="mars-hud" data-testid="mars-hud">
        <Bar icon={Wind} v={G.o2} max={maxO2(G)} color="#3fe0ff" label="oxygen" warn={G.o2 < 25} />
        <Bar icon={Heart} v={G.hp} color="#ef233c" label="health" warn={G.hp < 30} />
        <Bar icon={Zap} v={G.en} color="#ffc93c" label="energy" warn={G.en < 15} />
        <Bar icon={Radiation} v={G.rad} color="#7bd389" label="radiation" warn={G.rad > 70} />
        <div className="mars-hud-row" data-testid="hud-time">
          {night ? <Moon size={14} /> : <Sun size={14} />} Sol {G.sol} · {clock(G)}
          <span className="ml-auto flex items-center gap-1"><WIcon size={14} /> {G.layer === "under" ? "Sheltered" : wName}</span>
        </div>
        {G.worldEvent?.sol === G.sol && <div className="mars-hud-row text-[#7bd389]" data-testid="hud-event"><Sparkles size={14} /> {WORLD_EVENTS[G.worldEvent.type].name}</div>}
        <div className="mars-hud-row" data-testid="hud-credits"><Coins size={14} /> {G.credits} credits {G.layer === "under" && <span className="ml-auto text-cyan-300">UNDERGROUND</span>}</div>
      </div>
      <div className="mars-topbtns">
        <button data-testid="hud-photo-btn" className="mars-iconbtn !bg-[#ffc93c]" title="Photo Mode (P)" aria-label="Photo Mode" onClick={onPhoto}><Camera size={18} /></button>
        {btns.map(([k, I, t]) => <button key={k} data-testid={`hud-${k}-btn`} className="mars-iconbtn" title={t} aria-label={t} onClick={() => onOpen(k)}><I size={18} /></button>)}
      </div>
      <div className="mars-tracker" data-testid="mission-tracker">
        <div className="font-display text-[0.65rem] text-orange">{m ? `MISSION ${G.story + 1}/15 · ${m.title}` : "STORY COMPLETE"}</div>
        <div className="text-sm font-bold leading-tight">{m ? m.goal : "Mars is yours. Finish side quests and find every secret!"}</div>
        {target && <div className="mars-tracker-target"><b>{target.label}</b> · {meters < 20 ? "Nearby" : meters + " m · " + bearing}</div>}
      </div>
      {G.emerg && (
        <div className="mars-emerg" data-testid="emergency-banner"><TriangleAlert size={16} className="blink" /> {EMERG[G.emerg.type]} <b>{Math.ceil(G.emerg.t)}s</b></div>
      )}
    </>
  );
};

const Joystick = ({ joy }) => {
  const base = useRef(null);
  const on = useRef(null);
  useEffect(() => () => { joy.current = { x: 0, y: 0 }; }, [joy]);
  const [k, setK] = useState({ x: 0, y: 0 });
  const move = (e) => {
    if (on.current !== e.pointerId) return;
    const r = base.current.getBoundingClientRect(), max = r.width / 2;
    let x = e.clientX - (r.left + max), y = e.clientY - (r.top + max);
    const d = Math.hypot(x, y);
    if (d > max) { x *= max / d; y *= max / d; }
    joy.current = { x: x / max, y: y / max }; setK({ x, y });
  };
  const end = (e) => {
    if (on.current !== e.pointerId) return;
    on.current = null;
    joy.current = { x: 0, y: 0 };
    setK({ x: 0, y: 0 });
  };
  return (
    <div ref={base} className="joy" data-testid="mars-joystick"
      onPointerDown={(e) => { if (on.current !== null) return; on.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="joy-knob" style={{ transform: `translate(${k.x}px, ${k.y}px)` }} />
    </div>
  );
};

export const Controls = ({ G, joy, jet, onInteract, onRover }) => {
  const near = G.tmp.near;
  const touch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  useEffect(() => () => { jet.current = false; }, [jet]);
  return (
    <>
      {touch && <Joystick joy={joy} />}
      {near && (
        <button className="mars-prompt" data-testid="mars-interact-btn" onClick={onInteract}>
          <Hand size={16} /> <span className="hidden md:inline font-display text-xs">E</span> {near.label}
        </button>
      )}
      <div className="mars-actions">
        {G.flags.jetpack && !G.inRover && (
          <button className="mars-action" data-testid="mars-jet-btn" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); jet.current = true; }} onLostPointerCapture={() => { jet.current = false; }}>
            <Rocket size={20} /><span>Jet</span>
          </button>
        )}
        {G.inRover && <button className="mars-action" data-testid="mars-horn-btn" onClick={() => sfx.horn()}><Megaphone size={20} /><span>Honk</span></button>}
        {G.rover && G.layer === "surface" && (G.inRover || near?.kind === "rover") && (
          <button className="mars-action" data-testid="mars-rover-btn" onClick={onRover}><CarFront size={20} /><span>{G.inRover ? "Exit" : "Drive"}</span></button>
        )}
        {touch && near && <button className="mars-action mars-action-main" data-testid="mars-action-btn" onClick={onInteract}><Hand size={22} /><span>Use</span></button>}
      </div>
    </>
  );
};

export const BobToast = ({ msg }) => {
  const [show, setShow] = useState(null);
  const reduce = useReducedMotion();
  useEffect(() => { if (!msg) return; setShow(msg); const t = setTimeout(() => setShow(null), 6500); return () => clearTimeout(t); }, [msg]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div key={show.id} className="mars-bob" data-testid="mars-bob-toast" initial={{ x: reduce ? 0 : -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }}>
          <img src="/game/bob.png" alt="B.O.B." className="w-12 bob-float" />
          <div className="bubble bubble-left text-sm">{show.text}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Toasts = ({ items }) => (
  <div className="mars-toasts" data-testid="mars-toasts" role="status" aria-live="polite">
    <AnimatePresence>
      {items.map((t) => <motion.div key={t.id} className="mars-toast" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>{t.text}</motion.div>)}
    </AnimatePresence>
  </div>
);
