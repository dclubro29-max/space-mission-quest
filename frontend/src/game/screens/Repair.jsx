import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, TriangleAlert, Wrench } from "lucide-react";
import { Scene, Btn, BobSays } from "../ui";
import { Rocket } from "../Rocket";
import { MALFUNCTIONS, COMPONENTS, JOKES, pick, shuffle } from "../data";
import { sfx } from "../sound";

const Hud = ({ lives, idx }) => (
  <div className="panel p-4 flex flex-wrap items-center gap-4 justify-between">
    <h2 className="font-display text-lg md:text-xl text-navy">Level 3 · Problems & Solutions</h2>
    <div className="flex items-center gap-1" data-testid="repair-lives">
      {[0, 1, 2].map((k) => <Heart key={k} className={k < lives ? "text-red-500 fill-red-500" : "text-navy/20"} />)}
    </div>
    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
      <span className="text-xs font-display text-navy">EARTH</span>
      <div className="mass-bar flex-1"><motion.div className="mass-fill" animate={{ width: `${(idx / MALFUNCTIONS.length) * 100}%` }} /></div>
      <span className="text-xs font-display text-red-600">MARS</span>
    </div>
  </div>
);

export default function Repair({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [wrong, setWrong] = useState([]);
  const [fixed, setFixed] = useState(false);
  const [hit, setHit] = useState(0);
  const [bob, setBob] = useState("Uh-oh. Something is beeping. Beeping is never good.");
  const m = MALFUNCTIONS[idx];
  const opts = useMemo(() => shuffle(m.options), [m]);

  useEffect(() => { sfx.alarm(); }, [idx]);

  const choose = (k) => {
    if (fixed || wrong.includes(k) || lives === 0) return;
    if (k === m.correct) { sfx.success(); setFixed(true); setBob(m.bob); return; }
    sfx.fail(); setHit(hit + 1); setWrong([...wrong, k]);
    const left = lives - 1;
    setLives(left);
    if (left === 0) { setBob("Oh no. Oh no no no. That was our last chance..."); setTimeout(() => onDone({ win: false, fixed: idx, lives: 0 }), 1800); }
    else setBob(pick(JOKES.repairWrong));
  };
  const next = () => {
    sfx.click();
    if (idx === MALFUNCTIONS.length - 1) return onDone({ win: true, fixed: MALFUNCTIONS.length, lives });
    setIdx(idx + 1); setWrong([]); setFixed(false); setBob("Next problem incoming. Space really hates us today.");
  };
  const Info = COMPONENTS[m.correct];

  return (
    <Scene bg="/game/bg-space.jpg" testid="repair-screen" className={`overflow-y-auto ${!fixed ? "alarm-glow" : ""}`}>
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
        <Hud lives={lives} idx={idx + (fixed ? 1 : 0)} />
        <div className="grid md:grid-cols-[180px_1fr] gap-4 items-center">
          <motion.div key={hit} className="hidden md:block w-32 mx-auto" animate={hit ? { x: [0, -14, 14, -8, 0], rotate: [0, -6, 6, 0] } : { y: [0, -8, 0] }}
            transition={hit ? { duration: 0.5 } : { repeat: Infinity, duration: 2 }}>
            <Rocket className="w-full" broken={!fixed} />
          </motion.div>
          <motion.div key={idx} className={`panel p-5 sm:p-6 ${fixed ? "panel-ok" : "panel-alert"}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="flex items-center gap-2 font-display text-sm sm:text-base text-red-600" data-testid="malfunction-alert">
              <TriangleAlert className={fixed ? "" : "blink"} /> {fixed ? "FIXED!" : `ALERT ${idx + 1}/${MALFUNCTIONS.length}: ${m.alert}`}
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-navy mt-2" data-testid="malfunction-text">{m.text}</p>
            {fixed && <p className="mt-3 font-bold text-teal-800" data-testid="malfunction-explain"><Wrench size={16} className="inline" /> {Info.name}: {Info.info}</p>}
          </motion.div>
        </div>
        <p className="font-display text-sm text-cream title-shadow">Which component do you repair?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {opts.map((k) => {
            const c = COMPONENTS[k]; const Icon = c.icon;
            const st = fixed && k === m.correct ? "cargo-on" : wrong.includes(k) ? "comp-wrong" : "";
            return (
              <button key={k} data-testid={`repair-option-${k}`} onClick={() => choose(k)} className={`cargo-item ${st}`}>
                <span className="icon-bubble"><Icon size={26} /></span>
                <span className="font-display text-xs sm:text-sm text-navy mt-2">{c.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <BobSays text={bob} testid="repair-bob-text" />
          {fixed && <Btn data-testid="repair-next-btn" onClick={next}>{idx === MALFUNCTIONS.length - 1 ? "Land on Mars!" : "Next problem"}</Btn>}
        </div>
      </div>
    </Scene>
  );
}
