import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getWorld } from "./world";
import { loadGame, saveGame, update, interact, world } from "./engine";
import { render } from "./render";
import { NPCS } from "./content";
import { Hud, Controls, BobToast, Toasts } from "./Hud";
import { DialogBox, NpcPanel } from "./Talk";
import { MapPanel, BagPanel, QuestPanel, TrophyPanel, MenuPanel } from "./Panels";
import { CraftPanel, MarketPanel, BuildPanel, HabitatPanel, EndingPanel } from "./ColonyPanels";
import { sfx } from "../game/sound";

const KEYMAP = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
const PANELS = { map: MapPanel, bag: BagPanel, quests: QuestPanel, trophies: TrophyPanel, menu: MenuPanel, craft: CraftPanel, upgrades: CraftPanel, market: MarketPanel, build: BuildPanel, habitat: HabitatPanel, ending: EndingPanel };

export default function MarsGame({ name, onExit }) {
  const cvs = useRef(null);
  const G = useRef(null);
  const keys = useRef(new Set());
  const joy = useRef({ x: 0, y: 0 });
  const jet = useRef(false);
  const paused = useRef(false);
  const [ready, setReady] = useState(false);
  const [hud, setHud] = useState(0);
  const [panel, setPanel] = useState(null);
  const [talk, setTalk] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [bobMsg, setBobMsg] = useState(null);
  const [toasts, setToasts] = useState([]);
  const imgs = useMemo(() => {
    const src = { alex: "/game/alex.png", bob: "/game/bob.png", ...Object.fromEntries(Object.entries(NPCS).map(([k, v]) => [k, v.img])) };
    return Object.fromEntries(Object.entries(src).map(([k, s]) => { const i = new Image(); i.src = s; return [k, i]; }));
  }, []);
  paused.current = !!(panel || talk || dlg);
  const ui = useMemo(() => ({ open: (p) => { sfx.select(); setPanel(p); }, talk: (id) => { sfx.select(); setTalk(id); } }), []);

  const doInteract = useCallback(() => { if (!paused.current && G.current) { interact(G.current, G.current.tmp.near, ui); sfx.click(); } }, [ui]);
  const toggleRover = useCallback(() => {
    const g = G.current;
    if (!g || paused.current) return;
    if (g.inRover) interact(g, { kind: "rover" }, ui);
    else if (g.tmp.near?.kind === "rover") interact(g, g.tmp.near, ui);
  }, [ui]);

  useEffect(() => {
    // world generation is heavy; let the loading screen paint first
    const t = setTimeout(() => { G.current = loadGame(name); world(G.current); getWorld(false); setReady(true); }, 50);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    if (!ready) return;
    const c = cvs.current, ctx = c.getContext("2d");
    let raf, last = performance.now(), hudT = 0, saveT = 0;
    const resize = () => { const d = Math.min(window.devicePixelRatio || 1, 1.5); c.width = c.clientWidth * d; c.height = c.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize();
    window.addEventListener("resize", resize);
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const g = G.current;
      let x = joy.current.x, y = joy.current.y;
      keys.current.forEach((k) => { if (KEYMAP[k]) { x += KEYMAP[k][0]; y += KEYMAP[k][1]; } });
      if (!paused.current) update(g, { x, y, jet: jet.current || keys.current.has("Space") }, dt);
      render(ctx, g, c.clientWidth, c.clientHeight, imgs);
      hudT += dt; saveT += dt;
      if (hudT > 0.15) {
        hudT = 0;
        const q = g.tmp.queue.splice(0);
        const lines = [];
        q.forEach((e) => {
          if (e.kind === "bob") setBobMsg({ text: e.text, id: now + Math.random() });
          if (e.kind === "toast") { const id = now + Math.random(); setToasts((ts) => [...ts.slice(-3), { id, text: e.text }]); setTimeout(() => setToasts((ts) => ts.filter((z) => z.id !== id)), 3200); }
          if (e.kind === "dialog") lines.push(...e.lines);
        });
        if (lines.length) setDlg((d) => (d ? { ...d, lines: [...d.lines, ...lines] } : { lines, i: 0 }));
        setHud((h) => h + 1);
      }
      if (saveT > 10) { saveT = 0; saveGame(g); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const save = () => saveGame(G.current);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", save);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("beforeunload", save); document.removeEventListener("visibilitychange", save); save(); };
  }, [ready, imgs]);

  useEffect(() => {
    const down = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Escape") { setPanel(null); setTalk(null); return; }
      if (paused.current) { if (dlg && (e.code === "Enter" || e.code === "KeyE" || e.code === "Space")) { e.preventDefault(); nextLine(); } return; }
      if (KEYMAP[e.code] || e.code === "Space") e.preventDefault();
      keys.current.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyE" || e.code === "Enter") doInteract();
      if (e.code === "KeyR") toggleRover();
      if (e.code === "KeyM") setPanel("map");
      if (e.code === "KeyI") setPanel("bag");
      if (e.code === "KeyQ") setPanel("quests");
    };
    const up = (e) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  });

  const nextLine = () => { sfx.click(); setDlg((d) => (d && d.i < d.lines.length - 1 ? { ...d, i: d.i + 1 } : null)); };
  const P = panel && PANELS[panel];
  const g = G.current;

  if (!ready) return (
    <div className="mars-root flex items-center justify-center" data-testid="mars-loading">
      <div className="panel p-8 text-center"><div className="font-display text-2xl text-navy">EXPLORE MARS</div><p className="font-bold mt-2">B.O.B. is generating a whole planet... please wait.</p></div>
    </div>
  );

  return (
    <div className="mars-root" data-testid="mars-game">
      <canvas ref={cvs} className="mars-canvas" data-testid="mars-canvas" />
      <Hud G={g} tick={hud} onOpen={ui.open} />
      <Controls G={g} joy={joy} jet={jet} onInteract={doInteract} onRover={toggleRover} />
      <BobToast msg={bobMsg} />
      <Toasts items={toasts} />
      {dlg && <DialogBox line={dlg.lines[dlg.i]} name={g.name} onNext={nextLine} />}
      {talk && !dlg && <NpcPanel G={g} id={talk} onClose={() => setTalk(null)} onShop={() => { setTalk(null); setPanel("market"); }} />}
      {P && !dlg && <P G={g} tab={panel} onClose={() => setPanel(null)} onExit={() => { saveGame(g); onExit(); }} />}
    </div>
  );
}
