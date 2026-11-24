import { useReducer } from "react";
import { motion } from "framer-motion";
import { ChevronRight, X, Check, Store } from "lucide-react";
import { SPEAKERS, NPCS, QUESTS, ITEMS } from "./content";
import { acceptQuest, finishQuest, questMet, count } from "./engine";
import { sfx } from "../game/sound";

export const DialogBox = ({ line, name, onNext }) => {
  const [who, text] = line;
  const s = SPEAKERS[who] || SPEAKERS.bob;
  return (
    <div className="mars-dialog-bg" onClick={onNext}>
      <motion.div key={text} className="mars-dialog panel" data-testid="mars-dialog" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <img src={s.img} alt={s.name} className={`mars-dialog-img ${who === "bob" ? "bob-float" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="name-tag !static inline-block mb-2" style={{ background: who === "bob" ? "#ff7a1a" : "#14213d" }}>{who === "you" ? name : s.name}</div>
          <p className="text-base sm:text-lg font-bold text-navy leading-snug" data-testid="mars-dialog-text">{text}</p>
          <div className="flex justify-end mt-2">
            <button data-testid="mars-dialog-next" className="toon-btn toon-btn-orange !py-1.5 !px-4 text-sm">Next <ChevronRight size={16} /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const GREET = {
  queen: "Welcome, brave cadet. The whole colony is proud of you.",
  andreea: "Science never sleeps! Unlike me. I sleep a lot.",
  maria: "Plants on Mars need love, light and LOTS of water.",
  ionut: "If it's broken, I can print a new one. Even your sense of direction.",
  goran: "Rocks! Beautiful rocks! Bring me all the rocks!",
  patrick: "Need a ride? Rovers are my thing. Driving them well is your thing. Hopefully.",
  zip: "Psst! Best prices on Mars. Only prices on Mars, actually.",
  vega: "Thank you for finding me. Mars still has so many secrets.",
};

const QuestRow = ({ G, q, refresh }) => {
  const st = G.quests[q.id];
  const prog = q.type === "deliver" ? `${Math.min(count(G, q.target), q.n)}/${q.n} ${ITEMS[q.target].name}` : null;
  return (
    <div className="mars-row" data-testid={`npc-quest-${q.id}`}>
      <div className="flex-1">
        <div className="font-display text-xs text-navy">{q.title} <span className="text-orange">+{q.credits}</span></div>
        <div className="text-sm font-semibold text-navy/80">{q.text} {prog && <b>({prog})</b>}</div>
      </div>
      {!st && <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`accept-${q.id}`} onClick={() => { acceptQuest(G, q); sfx.success(); refresh(); }}>Accept</button>}
      {st?.s === "active" && q.type === "deliver" && (
        <button disabled={!questMet(G, q, st)} className={`toon-btn !py-1 !px-3 text-xs ${questMet(G, q, st) ? "toon-btn-orange" : "toon-btn-navy opacity-50"}`}
          data-testid={`turnin-${q.id}`} onClick={() => { finishQuest(G, q); sfx.fanfare(); refresh(); }}>Turn in</button>
      )}
      {st?.s === "active" && q.type !== "deliver" && <span className="level-chip !text-[0.6rem]">In progress</span>}
      {st?.s === "done" && <Check className="text-teal-700" />}
    </div>
  );
};

export const NpcPanel = ({ G, id, onClose, onShop }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const n = NPCS[id];
  const qs = QUESTS.filter((q) => q.giver === id);
  const open = qs.filter((q) => G.story >= q.minStory || G.quests[q.id]);
  const locked = qs.length - open.length;
  return (
    <div className="mars-modal-bg" onClick={onClose}>
      <div className="panel mars-modal" data-testid="npc-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <img src={n.img} alt={n.name} className="h-28 w-20 object-cover object-top rounded-xl border-4 border-[#111] bg-white" />
          <div className="flex-1">
            <div className="font-display text-lg text-navy">{n.name}</div>
            <div className="text-xs font-bold text-orange">{n.role}</div>
            <p className="bubble mt-2 text-sm">{GREET[id]}</p>
          </div>
          <button data-testid="npc-close-btn" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {id === "zip" && <button data-testid="npc-shop-btn" className="toon-btn toon-btn-orange mt-4 w-full justify-center" onClick={onShop}><Store size={18} /> Open shop</button>}
        <div className="mt-4 space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {open.map((q) => <QuestRow key={q.id} G={G} q={q} refresh={refresh} />)}
          {!qs.length && id !== "zip" && <p className="text-sm font-bold text-navy/60">No side quests from {n.name.split(" ")[0]}.</p>}
          {locked > 0 && <p className="text-xs font-bold text-navy/60">{locked} more quest{locked > 1 ? "s" : ""} will unlock as the story goes on.</p>}
        </div>
      </div>
    </div>
  );
};
