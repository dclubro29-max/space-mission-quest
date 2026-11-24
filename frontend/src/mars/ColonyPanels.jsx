import { useReducer, useState } from "react";
import { Check, TrendingUp, TrendingDown, BedDouble, Sprout, Image, Bean, Guitar, PawPrint, Telescope, Lamp, Square, Globe, Moon, Sparkles, Shield, Share2 } from "lucide-react";
import { Modal, Tabs } from "./Panels";
import { RECIPES, RECIPE_NAMES, UPGRADES, upgradeCost, ITEMS, RESOURCES, SHOP_BUY, BUILDINGS } from "./content";
import { canPay, count, craft, upgrade, build, sell, buy, sellPrice, buyPrice, priceMult, sleep, isNight, chooseEnding } from "./engine";
import { sfx } from "../game/sound";
import { CustomsTab } from "./LivingPanels";
import { Crown, Bath } from "lucide-react";

const Cost = ({ G, cost }) => (
  <div className="flex flex-wrap gap-1 mt-1">
    {Object.entries(cost).map(([k, v]) => (
      <span key={k} className={`mars-cost ${count(G, k) >= v ? "mars-cost-ok" : ""}`}>{v} {k === "credits" ? "cr" : ITEMS[k].name}</span>
    ))}
  </div>
);
const act = (fn, refresh) => () => { if (fn()) sfx.success(); else sfx.fail(); refresh(); };

export const CraftPanel = ({ G, tab, onClose }) => {
  const [t, setT] = useState(tab === "upgrades" ? "up" : "craft");
  const [, refresh] = useReducer((x) => x + 1, 0);
  return (
    <Modal title="3D Printer & Garage" onClose={onClose} testid="craft-panel" wide>
      <Tabs tabs={[["craft", "Print items"], ["up", "Upgrades"], ["custom", "Customize rover"]]} value={t} onChange={setT} />
      {t === "custom" && <CustomsTab G={G} />}
      <p className="text-xs font-bold text-navy/70 mb-2">Credits: {G.credits}</p>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {t === "custom" ? null : t === "craft" ? Object.entries(RECIPES).map(([k, cost]) => {
          const done = k === "jetpack" && G.flags.jetpack;
          return (
            <div key={k} className="mars-row" data-testid={`recipe-${k}`}>
              <div className="flex-1"><div className="font-display text-xs">{RECIPE_NAMES[k] || ITEMS[k].name} {count(G, k) > 0 && <span className="text-navy/50">(have {count(G, k)})</span>}</div>
                <div className="text-xs font-semibold text-navy/70">{ITEMS[k]?.desc || (k === "jetpack" ? "Fly over mountains (hold SPACE)" : "Habitat decoration")}</div><Cost G={G} cost={cost} /></div>
              {done ? <Check className="text-teal-700" /> : <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`craft-${k}`} disabled={!canPay(G, cost)} style={{ opacity: canPay(G, cost) ? 1 : 0.5 }} onClick={act(() => craft(G, k), refresh)}>Print</button>}
            </div>
          );
        }) : Object.entries(UPGRADES).map(([k, u]) => {
          const lvl = G.up[k] || 0, cost = upgradeCost(k, lvl), locked = u.needs && !G.flags[u.needs];
          return (
            <div key={k} className="mars-row" data-testid={`upgrade-${k}`}>
              <div className="flex-1"><div className="font-display text-xs">{u.name} · Lv {lvl}/3</div><div className="text-xs font-semibold text-navy/70">{u.desc}{locked && ` (needs ${u.needs})`}</div>{lvl < 3 && <Cost G={G} cost={cost} />}</div>
              {lvl >= 3 ? <span className="level-chip !text-[0.6rem]">MAX</span> : <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`do-upgrade-${k}`} disabled={locked || !canPay(G, cost)} style={{ opacity: !locked && canPay(G, cost) ? 1 : 0.5 }} onClick={act(() => upgrade(G, k), refresh)}>Upgrade</button>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export const MarketPanel = ({ G, onClose }) => {
  const [t, setT] = useState("sell");
  const [, refresh] = useReducer((x) => x + 1, 0);
  return (
    <Modal title={`Market · Sol ${G.sol} prices`} onClose={onClose} testid="market-panel" wide>
      <Tabs tabs={[["sell", "Sell"], ["buy", "Buy"]]} value={t} onChange={setT} />
      <p className="text-sm font-bold text-navy mb-2" data-testid="market-credits">Credits: {G.credits}{G.buildings.includes("refinery") && " · Refinery bonus +20%"}</p>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {t === "sell" ? RESOURCES.map((k) => {
          const up = priceMult(G, k) >= 1;
          return (
            <div key={k} className="mars-row" data-testid={`sell-row-${k}`}>
              <div className="flex-1 font-bold">{ITEMS[k].name} <span className="text-navy/60">×{count(G, k)}</span></div>
              <span className={`flex items-center gap-1 font-display text-xs ${up ? "text-teal-700" : "text-red-600"}`}>{up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{sellPrice(G, k)} cr</span>
              <button className="toon-btn toon-btn-navy !py-1 !px-3 text-xs" data-testid={`sell-1-${k}`} disabled={!count(G, k)} onClick={() => { sell(G, k, 1); sfx.click(); refresh(); }}>Sell 1</button>
              <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`sell-all-${k}`} disabled={!count(G, k)} onClick={() => { sell(G, k, count(G, k)); sfx.success(); refresh(); }}>All</button>
            </div>
          );
        }) : SHOP_BUY.map((k) => (
          <div key={k} className="mars-row" data-testid={`buy-row-${k}`}>
            <div className="flex-1"><div className="font-bold">{ITEMS[k].name} <span className="text-navy/60">×{count(G, k)}</span></div><div className="text-xs text-navy/60 font-semibold">{ITEMS[k].desc || "Decoration for your habitat"}</div></div>
            <span className="font-display text-xs">{buyPrice(G, k)} cr</span>
            <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`buy-${k}`} style={{ opacity: G.credits >= buyPrice(G, k) ? 1 : 0.5 }} onClick={act(() => buy(G, k), refresh)}>Buy</button>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export const BuildPanel = ({ G, onClose }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  return (
    <Modal title={`Colony Hub · ${G.buildings.length}/7 buildings`} onClose={onClose} testid="build-panel" wide>
      <p className="text-xs font-bold text-navy/70 mb-2">Buildings produce every sol (Mars day). Credits: {G.credits}</p>
      <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
        {Object.entries(BUILDINGS).map(([k, b]) => {
          const has = G.buildings.includes(k);
          return (
            <div key={k} className={`mars-row ${has ? "mars-row-done" : ""}`} data-testid={`building-${k}`}>
              <i className="w-6 h-6 rounded-full border-2 border-[#111] shrink-0" style={{ background: b.color }} />
              <div className="flex-1"><div className="font-display text-xs">{b.name}</div><div className="text-xs font-semibold text-navy/70">{b.desc}</div>{!has && <Cost G={G} cost={b.cost} />}</div>
              {has ? <Check className="text-teal-700" /> : <button className="toon-btn toon-btn-orange !py-1 !px-3 text-xs" data-testid={`build-${k}`} style={{ opacity: canPay(G, b.cost) ? 1 : 0.5 }} onClick={act(() => build(G, k), refresh)}>Build</button>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

const DECOR = { bed: BedDouble, plant: Sprout, bob_poster: Image, potato_plant: Bean, guitar: Guitar, teddy: PawPrint, telescope: Telescope, lava_lamp: Lamp, rug: Square, globe: Globe, gold_statue: Crown, chandelier: Sparkles, hot_tub: Bath };
const WALLS = ["#fff4e0", "#bde0fe", "#ffd6e0", "#d8f3dc"];
const FLOORS = ["#8d6e63", "#5c677d", "#e9c46a", "#2a9d8f"];

export const HabitatPanel = ({ G, onClose }) => {
  const [, refresh] = useReducer((x) => x + 1, 0);
  const H = G.habitat;
  const toggle = (k) => {
    if (H.decor.includes(k)) { H.decor = H.decor.filter((d) => d !== k); G.inv[k] = (G.inv[k] || 0) + 1; }
    else if (count(G, k) > 0) { G.inv[k]--; H.decor = [...H.decor, k]; }
    sfx.select(); refresh();
  };
  const owned = Object.keys(DECOR).filter((k) => count(G, k) > 0 || H.decor.includes(k));
  return (
    <Modal title={`Your Habitat · Comfort ${H.decor.length * 2}`} onClose={onClose} testid="habitat-panel" wide>
      <div className="habitat-room" data-testid="habitat-room" style={{ background: WALLS[H.wall] }}>
        <div className="habitat-window" />
        <div className="habitat-floor" style={{ background: FLOORS[H.floor] }} />
        <div className="habitat-decor">
          {H.decor.map((k) => { const I = DECOR[k]; return <span key={k} title={ITEMS[k].name}><I size={34} /></span>; })}
          {!H.decor.length && <span className="text-sm font-bold text-navy/60">Empty. Buy or print decorations!</span>}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <div className="font-display text-xs text-orange">Walls</div>
          <div className="flex gap-2 mt-1">{WALLS.map((c, i) => <button key={c} data-testid={`wall-${i}`} className={`swatch ${H.wall === i ? "swatch-on" : ""}`} style={{ background: c }} onClick={() => { H.wall = i; refresh(); }} aria-label={`Wall color ${i + 1}`} />)}</div>
          <div className="font-display text-xs text-orange mt-2">Floor</div>
          <div className="flex gap-2 mt-1">{FLOORS.map((c, i) => <button key={c} data-testid={`floor-${i}`} className={`swatch ${H.floor === i ? "swatch-on" : ""}`} style={{ background: c }} onClick={() => { H.floor = i; refresh(); }} aria-label={`Floor color ${i + 1}`} />)}</div>
        </div>
        <div>
          <div className="font-display text-xs text-orange">Decorations (tap to place / remove)</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {owned.length ? owned.map((k) => <button key={k} data-testid={`decor-${k}`} onClick={() => toggle(k)} className={`mars-chip ${H.decor.includes(k) ? "!bg-[#c8f7dc]" : ""}`}>{ITEMS[k].name}</button>) : <span className="text-xs font-bold text-navy/60">Buy decorations at the market.</span>}
          </div>
        </div>
      </div>
      <button className="toon-btn toon-btn-navy mt-4 w-full justify-center" data-testid="sleep-btn" style={{ opacity: isNight(G) ? 1 : 0.5 }}
        onClick={() => { if (sleep(G)) { sfx.fanfare(); onClose(); } else sfx.fail(); }}>
        <Moon size={16} /> {isNight(G) ? "Sleep until morning (full health & energy)" : "You can sleep only at night"}
      </button>
    </Modal>
  );
};

export const EndingPanel = ({ G, onClose }) => {
  const opts = [["awaken", Sparkles, "Awaken the machine", "Make Mars warm and wet again. Lakes will appear across the world."], ["seal", Shield, "Seal The Hollow", "Keep the ancient power locked away forever. Safe and wild."], ["share", Share2, "Share it with Earth", "Send all the data home. Science for everyone! (+1000 credits)"]];
  return (
    <Modal title="The Choice" onClose={onClose} testid="ending-panel" wide>
      <p className="font-bold text-navy mb-3">The ancient machine at the heart of The Hollow awaits your decision. This changes Mars forever.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {opts.map(([k, I, t, d]) => (
          <button key={k} data-testid={`ending-${k}`} className="cargo-item !pb-4" onClick={() => { chooseEnding(G, k); if (k === "share") G.credits += 1000; sfx.fanfare(); onClose(); }}>
            <span className="icon-bubble"><I size={24} /></span><span className="font-display text-xs mt-2">{t}</span><span className="text-xs font-semibold text-navy/70">{d}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};
